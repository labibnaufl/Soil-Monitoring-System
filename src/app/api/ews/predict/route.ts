import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SENSORS = [
  "soilMoisture",
  "soilTemperature",
  "phValue",
  "soilConductivity",
  "waterLevel",
  "rainMeter",
] as const;

// ML feature keys expected by POST /api/v1/predict
const TO_ML: Record<(typeof SENSORS)[number], string> = {
  soilMoisture: "SM",
  soilTemperature: "ST",
  phValue: "ph",
  soilConductivity: "SEC",
  waterLevel: "WL",
  rainMeter: "RR",
};

function floorHour(d: Date): Date {
  const c = new Date(d);
  c.setMinutes(0, 0, 0);
  return c;
}

// GET /api/ews/predict?deviceId=LPA-... - 24h forecast from Postgres readings via ML service
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hardwareId = searchParams.get("deviceId");
    if (!hardwareId) {
      return NextResponse.json(
        { error: "deviceId query param is required (hardware ID, e.g. LPA-...)" },
        { status: 400 }
      );
    }

    const device = await prisma.device.findUnique({
      where: { deviceId: hardwareId },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        stationId: true,
        station: { select: { id: true, name: true } },
      },
    });
    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // ADMIN_LOCATION is scoped to their own station
    if (
      session.user.role !== "SUPER_ADMIN" &&
      device.stationId !== session.user.stationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!device.stationId) {
      return NextResponse.json(
        { error: "Device is not assigned to any station" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.EWS_API_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "EWS_API_URL is not configured" },
        { status: 503 }
      );
    }
    const maxAgeMinutes = Number(
      process.env.EWS_MAX_AGE_MINUTES ?? "120"
    );

    // Pull the recent window (generous take; bucketing trims to 24h)
    const rows = await prisma.readings.findMany({
      where: { deviceId: device.id },
      orderBy: { dateTime: "desc" },
      take: 500,
      select: {
        dateTime: true,
        soilMoisture: true,
        soilTemperature: true,
        phValue: true,
        soilConductivity: true,
        waterLevel: true,
        rainMeter: true,
      },
    });
    if (rows.length === 0) {
      return NextResponse.json({
        device: {
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          station: device.station,
        },
        prediction: {
          availability: "insufficient_history",
          message: "Perangkat belum memiliki pembacaan di database.",
          horizon_hours: 24,
          points: [],
        },
      });
    }

    const asc = [...rows].reverse();
    const latestTime = new Date(asc[asc.length - 1].dateTime);
    const now = new Date();
    const ageMinutes = Math.max(
      0,
      (now.getTime() - latestTime.getTime()) / 60000
    );
    const origin = floorHour(latestTime);

    const latest = {
      dateTime: latestTime.toISOString(),
      ageMinutes: Math.round(ageMinutes * 100) / 100,
      dataLama: ageMinutes > maxAgeMinutes,
      sensors: {
        SM: asc[asc.length - 1].soilMoisture,
        ST: asc[asc.length - 1].soilTemperature,
        ph: asc[asc.length - 1].phValue,
        SEC: asc[asc.length - 1].soilConductivity,
        WL: asc[asc.length - 1].waterLevel,
        RR: asc[asc.length - 1].rainMeter,
      },
    };

    if (latest.dataLama) {
      return NextResponse.json({
        device: {
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          station: device.station,
        },
        checkedAt: now.toISOString(),
        latest,
        prediction: {
          availability: "stale_data",
          message:
            "Data terbaru sudah lama; perbarui telemetri sebelum memprediksi.",
          horizon_hours: 24,
          forecast_origin: origin.toISOString(),
          points: [],
        },
      });
    }

    // Hourly means over (binStart, binEnd], last 24 complete bins ending at origin
    const usable = asc.filter((r) => new Date(r.dateTime) <= origin);
    const hourly: { date_time: string; [k: string]: number | null | string }[] =
      [];
    let complete = true;
    for (let i = 23; i >= 0; i--) {
      const binEnd = new Date(origin.getTime() - i * 60 * 60 * 1000);
      const binStart = new Date(binEnd.getTime() - 60 * 60 * 1000);
      const inBin = usable.filter((r) => {
        const t = new Date(r.dateTime);
        // right-closed bin: (binStart, binEnd]
        return t > binStart && t <= binEnd;
      });
      if (inBin.length === 0) {
        complete = false;
        break;
      }
      const point: { date_time: string; [k: string]: number | null | string } =
        { date_time: binEnd.toISOString() };
      for (const s of SENSORS) {
        const vals = inBin
          .map((r) => r[s])
          .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
        point[TO_ML[s]] = vals.length
          ? vals.reduce((a, b) => a + b, 0) / vals.length
          : null;
      }
      if (Object.values(point).some((v) => v === null)) {
        complete = false;
        break;
      }
      hourly.push(point);
    }

    if (!complete || hourly.length !== 24) {
      return NextResponse.json({
        device: {
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          station: device.station,
        },
        checkedAt: now.toISOString(),
        latest,
        prediction: {
          availability: "insufficient_history",
          message:
            "Perlu 24 jam pengukuran lengkap terakhir; terdapat jam/sensor yang kosong.",
          horizon_hours: 24,
          forecast_origin: origin.toISOString(),
          points: [],
        },
      });
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.EWS_API_KEY) {
      headers["X-API-Key"] = process.env.EWS_API_KEY;
    }
    let ml: Response;
    try {
      ml = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/predict`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          device_id: device.deviceId,
          hourly,
          forecast_origin: origin.toISOString(),
        }),
        signal: AbortSignal.timeout(30000),
      });
    } catch (error) {
      console.error("EWS service unreachable:", error);
      return NextResponse.json(
        { error: "Prediction service unavailable" },
        { status: 502 }
      );
    }
    if (!ml.ok) {
      const detail = await ml.text().catch(() => "");
      console.error("EWS service error:", ml.status, detail);
      return NextResponse.json(
        { error: "Prediction service error", detail: detail.slice(0, 500) },
        { status: 502 }
      );
    }
    const data = await ml.json();

    // Persist ready snapshots to AIInsight (best-effort; never fail the response).
    if (data?.prediction?.availability === "ready" && device.stationId) {
      try {
        await prisma.aIInsight.create({
          data: {
            stationId: device.stationId,
            analysisStart: new Date(origin.getTime() - 24 * 60 * 60 * 1000),
            analysisEnd: origin,
            modelVersion: process.env.EWS_MODEL_VERSION ?? "ews-classic-v1",
            riskAssessment: {
              deviceId: device.deviceId,
              availability: data.prediction.availability,
              methodPerSensor: data.prediction.method_per_sensor ?? null,
            },
            rawOutput: data.prediction,
          },
        });
      } catch (persistError) {
        console.error("AIInsight persist failed:", persistError);
      }
    }

    return NextResponse.json({
      device: {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        station: device.station,
      },
      checkedAt: data.checked_at ?? now.toISOString(),
      timezone: data.timezone ?? null,
      latest,
      prediction: data.prediction,
    });
  } catch (error) {
    console.error("Error serving EWS prediction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
