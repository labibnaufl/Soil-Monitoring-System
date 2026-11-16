import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { ingestTelemetry } from "@/lib/ingest";
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
    // Device authentication: require X-API-Key when DEVICE_API_KEY is configured.
    // (No session check here - headless ESP32 devices can't do credential login.)
    if (process.env.DEVICE_API_KEY) {
      const apiKey = request.headers.get("x-api-key");
      if (!apiKey || apiKey !== process.env.DEVICE_API_KEY) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else {
      console.warn("DEVICE_API_KEY is not set - POST /api/readings is unauthenticated");
    }

    const body = await request.json();
    const result = readingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data format", details: result.error.format() },
        { status: 400 }
      );
    }

    // Shared pipeline with the MQTT subscriber (src/lib/ingest.ts):
    // device lookup, calibration, idempotent upsert, alert checks.
    const ingest = await ingestTelemetry(result.data, {
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      rawPayload: body,
    });

    if (!ingest.ok) {
      return NextResponse.json(
        {
          error:
            ingest.reason === "unknown-device"
              ? "Device not found"
              : "Device not assigned to any station",
        },
        { status: ingest.reason === "unknown-device" ? 404 : 400 }
      );
    }

    const reading = ingest.reading;

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

// GET /api/readings - Get readings (with filtering, requires login)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get("stationId");
    const deviceId = searchParams.get("deviceId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");
    const includeRaw = searchParams.get("includeRaw") === "true";

    // ADMIN_LOCATION users are scoped to their own station
    let effectiveStationId = stationId;
    if (session.user.role !== "SUPER_ADMIN") {
      if (!session.user.stationId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (stationId && stationId !== session.user.stationId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      effectiveStationId = session.user.stationId;
    }

    const where: Prisma.ReadingsWhereInput = {};

    // Filter by deviceId directly
    if (deviceId) {
      where.deviceId = deviceId;
    }

    // Filter by stationId via device relation
    if (effectiveStationId) {
      where.device = {
        stationId: effectiveStationId,
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

    // BigInt (unixTime) cannot be JSON-serialized - convert before responding
    return NextResponse.json(
      readings.map((r) => ({ ...r, unixTime: Number(r.unixTime) }))
    );
  } catch (error) {
    console.error("Error fetching readings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
