import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calibrateAllReadings, DEFAULT_FORMULAS } from "@/lib/calibration";
import { Prisma } from "@prisma/client";

// Schema for device data ingestion
// Device sends RAW values only
const readingSchema = z.object({
  device_id: z.string(), // Device ID like "LPA-ESP3201-P001"
  unix_time: z.number(),
  // Raw sensor values (what the sensor hardware sends)
  water_level: z.number().optional(),        // cm (raw)
  rain_meter: z.number().optional(),         // mm (raw)
  soil_moisture: z.number().optional(),      // % (raw)
  soil_temperature: z.number().optional(),   // °C (raw)
  soil_conductivity: z.number().optional(),  // µS/cm (raw)
  ph_value: z.number().optional(),           // pH (raw, unitless)
  // Telemetry
  battery: z.number().optional(),            // %
  signal_strength: z.number().optional(),    // dBm
  panel_temperature: z.number().optional(),  // °C
});

// POST /api/readings - Ingest new sensor data from devices
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = readingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data format", details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Find device by device_id
    const device = await prisma.device.findUnique({
      where: { deviceId: data.device_id },
      include: { station: true },
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    if (!device.stationId || !device.station) {
      return NextResponse.json(
        { error: "Device not assigned to any station" },
        { status: 400 }
      );
    }

    // Create dateTime from unix_time
    const dateTime = new Date(data.unix_time * 1000);

    // Fetch calibration formulas from SystemConfig (universal)
    const systemConfig = await prisma.systemConfig.findFirst();
    let formulas = (systemConfig?.calibrationFormulas as any) || DEFAULT_FORMULAS;

    // Merge device sensorConfig overrides with system defaults
    if (device.sensorConfig) {
      const sensorOverrides = device.sensorConfig as Record<string, any>;
      formulas = { ...formulas, ...sensorOverrides };
    }

    // Build device calibration params from per-device fields
    const params: Record<string, number> = {};
    if (device.pipeLength !== null) {
      params.pipe_length = device.pipeLength;
    }
    if (device.remainingPipe !== null) {
      params.remaining_pipe = device.remainingPipe;
    }

    // Apply calibration to get calibrated values
    const calibrated = calibrateAllReadings(
      {
        rawWaterLevel: data.water_level,
        rawRainMeter: data.rain_meter,
        rawSoilMoisture: data.soil_moisture,
        rawSoilTemperature: data.soil_temperature,
        rawSoilConductivity: data.soil_conductivity,
        rawPhValue: data.ph_value,
      },
      formulas,
      params
    );

    // Use upsert for deduplication based on @@unique([deviceId, unixTime])
    const reading = await prisma.readings.upsert({
      where: {
        deviceId_unixTime: {
          deviceId: device.id,
          unixTime: BigInt(data.unix_time),
        },
      },
      update: {}, // No update on conflict - device retry with same data
      create: {
        deviceId: device.id,
        unixTime: BigInt(data.unix_time),
        dateTime: dateTime,
        calibrationVersion: 1,

        // RAW values (what sensor sent)
        rawWaterLevel: data.water_level ?? null,
        rawRainMeter: data.rain_meter ?? null,
        rawSoilMoisture: data.soil_moisture ?? null,
        rawSoilTemperature: data.soil_temperature ?? null,
        rawSoilConductivity: data.soil_conductivity ?? null,
        rawPhValue: data.ph_value ?? null,

        // CALIBRATED values (after formula applied)
        waterLevel: calibrated.waterLevel ?? null,
        rainMeter: calibrated.rainMeter ?? null,
        soilMoisture: calibrated.soilMoisture ?? null,
        soilTemperature: calibrated.soilTemperature ?? null,
        soilConductivity: calibrated.soilConductivity ?? null,
        phValue: calibrated.phValue ?? null,

        // Telemetry
        battery: data.battery ?? null,
        signalStrength: data.signal_strength ?? null,
        panelTemperature: data.panel_temperature ?? null,
      },
    });

    // Only trigger alerts for new readings (not duplicates)
    // Check if this was a new creation by comparing createdAt
    const isNewReading = reading.createdAt.getTime() > Date.now() - 5000; // Within last 5 seconds
    if (isNewReading) {
      await checkAndCreateAlerts(reading, device);
    }

    return NextResponse.json(
      {
        success: true,
        reading: {
          id: reading.id,
          deviceId: reading.deviceId,
          dateTime: reading.dateTime,
          calibrationVersion: reading.calibrationVersion,
          // Return calibrated values (what user sees)
          waterLevel: reading.waterLevel,
          rainMeter: reading.rainMeter,
          soilMoisture: reading.soilMoisture,
          soilTemperature: reading.soilTemperature,
          soilConductivity: reading.soilConductivity,
          phValue: reading.phValue,
          battery: reading.battery,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error ingesting reading:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/readings - Get readings (with filtering)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get("stationId");
    const deviceId = searchParams.get("deviceId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");
    const includeRaw = searchParams.get("includeRaw") === "true";

    const where: Prisma.ReadingsWhereInput = {};

    // Filter by deviceId directly
    if (deviceId) {
      where.deviceId = deviceId;
    }

    // Filter by stationId via device relation
    if (stationId) {
      where.device = {
        stationId: stationId,
      };
    }

    if (startDate || endDate) {
      where.dateTime = {};
      if (startDate) where.dateTime.gte = new Date(startDate);
      if (endDate) where.dateTime.lte = new Date(endDate);
    }

    const readings = await prisma.readings.findMany({
      where,
      orderBy: { dateTime: "desc" },
      take: limit,
      select: {
        id: true,
        deviceId: true,
        unixTime: true,
        dateTime: true,
        calibrationVersion: true,
        // Calibrated values (always included)
        waterLevel: true,
        rainMeter: true,
        soilMoisture: true,
        soilTemperature: true,
        soilConductivity: true,
        phValue: true,
        battery: true,
        signalStrength: true,
        panelTemperature: true,
        // Raw values (only if requested)
        rawWaterLevel: includeRaw,
        rawRainMeter: includeRaw,
        rawSoilMoisture: includeRaw,
        rawSoilTemperature: includeRaw,
        rawSoilConductivity: includeRaw,
        rawPhValue: includeRaw,
        createdAt: true,
        device: {
          select: {
            deviceId: true,
            deviceName: true,
            station: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(readings);
  } catch (error) {
    console.error("Error fetching readings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to check thresholds and create alerts
async function checkAndCreateAlerts(
  reading: Prisma.ReadingsGetPayload<{}>,
  device: Prisma.DeviceGetPayload<{ include: { station: true } }>
) {
  try {
    // Get system config for thresholds
    const config = await prisma.systemConfig.findFirst();
    if (!config) return;

    // Check soil moisture threshold (use CALIBRATED value)
    if (reading.soilMoisture !== null) {
      // Define extreme thresholds (outside these is considered HIGH priority)
      const extremeLow = 10;  // Below 10% is dangerously dry
      const extremeHigh = 95; // Above 95% is waterlogged/flooded
      
      const isBelowMin = reading.soilMoisture < config.soilMoistureMin;
      const isAboveMax = reading.soilMoisture > config.soilMoistureMax;
      const isExtremeLow = reading.soilMoisture < extremeLow;
      const isExtremeHigh = reading.soilMoisture > extremeHigh;
      
      if (isBelowMin || isAboveMax) {
        // Determine priority based on extremity
        // HIGH: Extreme conditions (< 10% or > 95%)
        // MEDIUM: Outside normal range but not extreme (10-20% or 80-95%)
        const priority = (isExtremeLow || isExtremeHigh) ? "HIGH" : "MEDIUM";
        
        // Check if there's already an open alert of this type
        const existingAlert = await prisma.alert.findFirst({
          where: {
            stationId: device.stationId!,
            alertType: "SOIL_MOISTURE",
            status: { in: ["OPEN", "PENDING", "IN_PROGRESS"] },
          },
        });

        if (!existingAlert) {
          const isLow = isBelowMin;
          const severityText = priority === "HIGH" 
            ? (isExtremeLow ? "KRITIS - Kekeringan Ekstrem" : "KRITIS - Genangan Air")
            : (isLow ? "di bawah" : "di atas");
          
          await prisma.alert.create({
            data: {
              stationId: device.stationId!,
              deviceId: device.id,
              alertType: "SOIL_MOISTURE",
              priority,
              status: "OPEN",
              readingId: reading.id,
              sourceType: "READING",
              message: priority === "HIGH"
                ? `${severityText}: Kelembapan tanah ${reading.soilMoisture.toFixed(1)}% (ambang batas: ${isExtremeLow ? extremeLow : extremeHigh}%)`
                : `Kelembapan tanah ${isLow ? "turun" : "naik"} ke ${reading.soilMoisture.toFixed(1)}%, ${isLow ? "di bawah" : "di atas"} ambang batas ${isLow ? config.soilMoistureMin : config.soilMoistureMax}%`,
              thresholdValue: isLow ? config.soilMoistureMin : config.soilMoistureMax,
              actualValue: reading.soilMoisture,
            },
          });
        }
      }
    }

    // Check battery thresholds (always percentage)
    if (reading.battery !== null) {
      const isCritical = reading.battery <= device.batteryCritical;
      const isWarning = reading.battery <= device.batteryWarning && !isCritical;

      if (isCritical || isWarning) {
        // Check if there's already an open alert
        const existingAlert = await prisma.alert.findFirst({
          where: {
            stationId: device.stationId!,
            alertType: "LOW_BATTERY",
            status: { in: ["OPEN", "PENDING", "IN_PROGRESS"] },
          },
        });

        if (!existingAlert) {
          await prisma.alert.create({
            data: {
              stationId: device.stationId!,
              deviceId: device.id,
              alertType: "LOW_BATTERY",
              priority: isCritical ? "HIGH" : "MEDIUM",
              status: "OPEN",
              readingId: reading.id,
              sourceType: "READING",
              message: `Baterai perangkat ${device.deviceName} ${isCritical ? "kritis" : "rendah"}: ${reading.battery.toFixed(1)}%`,
              thresholdValue: isCritical ? device.batteryCritical : device.batteryWarning,
              actualValue: reading.battery,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error("Error checking alerts:", error);
  }
}
