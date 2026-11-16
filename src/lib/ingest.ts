import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { calibrateAllReadings, DEFAULT_FORMULAS } from "@/lib/calibration";

// Shared ingestion pipeline: identical for HTTPS (POST /api/readings)
// and MQTT (services/mqtt-ingest). Devices always send RAW values;
// calibration, dedup, and alerting happen here, exactly once.

// Field-for-field compatible with the readings POST body / MQTT payload.
export interface TelemetryInput {
  device_id: string;
  unix_time: number;
  water_level?: number;
  rain_meter?: number;
  soil_moisture?: number;
  soil_temperature?: number;
  soil_conductivity?: number;
  ph_value?: number;
  battery?: number;
  signal_strength?: number;
  panel_temperature?: number;
}

export type IngestResult =
  | { ok: true; reading: Prisma.ReadingsGetPayload<{}> }
  | { ok: false; reason: "unknown-device" | "unassigned" };

export async function ingestTelemetry(
  data: TelemetryInput,
  opts?: { ip?: string | null; rawPayload?: unknown }
): Promise<IngestResult> {
  // Find device by device_id
  const device = await prisma.device.findUnique({
    where: { deviceId: data.device_id },
    include: { station: true },
  });

  if (!device) {
    // Same unclaimed-sender inbox as the HTTPS path (Phase 2).
    await prisma.rejectedReading.create({
      data: {
        deviceId: data.device_id,
        payload: (opts?.rawPayload ?? data) as Prisma.InputJsonValue,
        ip: opts?.ip ?? null,
      },
    });
    return { ok: false, reason: "unknown-device" };
  }

  if (!device.stationId || !device.station) {
    return { ok: false, reason: "unassigned" };
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

  // Use upsert for deduplication based on @@unique([deviceId, unixTime]).
  // Safe to retry the same payload: conflicts update nothing.
  const beforeUpsert = new Date();
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

  // Only trigger alerts for new readings (not duplicates):
  // an upsert that matched an existing row keeps its original createdAt,
  // which predates beforeUpsert; a fresh insert does not.
  const isNewReading = reading.createdAt >= beforeUpsert;
  if (isNewReading) {
    await checkAndCreateAlerts(reading, device);
  }

  return { ok: true, reading };
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

        // Check if there's already an open alert of this type for this device
        const existingAlert = await prisma.alert.findFirst({
          where: {
            stationId: device.stationId!,
            deviceId: device.id,
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
            deviceId: device.id,
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
