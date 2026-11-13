// MQTT ingest worker: subscribes to the telemetry topic and feeds every
// payload through the SAME pipeline as POST /api/readings (src/lib/ingest.ts).
//
// Accepts TWO payload shapes (firmware keys take precedence per-field):
//   firmware: { deviceId, unixtime, WL, RR, SM, ST, SEC, ph, BT1, BT2,
//               SG, TTi, ... }  (Lat/Lon/mode/fw_version/otaInProgress ignored)
//   canonical: { device_id, unix_time, water_level, rain_meter, soil_moisture,
//               soil_temperature, soil_conductivity, ph_value, battery,
//               signal_strength, panel_temperature } (RAW values, server calibrates).
//
// Run: bun run mqtt:ingest   (needs MQTT_BROKER_URL, MQTT_TOPIC env)
import mqtt from "mqtt";
import { ingestTelemetry, type TelemetryInput } from "../../src/lib/ingest";
import { prisma } from "../../src/lib/prisma";

const BROKER_URL = process.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883";
const TOPIC = process.env.MQTT_TOPIC ?? "LPA/test/nyawit";

const client = mqtt.connect(BROKER_URL, { reconnectPeriod: 2000 });

function toNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

// Normalize firmware payloads to the canonical TelemetryInput contract.
// Firmware keys win per-field; canonical keys are the fallback.
function mapPayload(body: unknown): TelemetryInput | null {
  if (typeof body !== "object" || body === null) return null;
  const p = body as Record<string, unknown>;

  const deviceId = p.device_id ?? p.deviceId;
  const unixTime = p.unix_time ?? p.unixtime;
  if (typeof deviceId !== "string" || typeof unixTime !== "number") return null;

  const bt1 = toNumber(p.battery ?? p.BT1);
  const bt2 = toNumber(p.BT2);
  const battery =
    bt1 !== undefined && bt2 !== undefined
      ? Math.round(((bt1 + bt2) / 2) * 10) / 10
      : (bt1 ?? bt2);

  return {
    device_id: deviceId,
    unix_time: unixTime,
    water_level: toNumber(p.water_level ?? p.WL),
    rain_meter: toNumber(p.rain_meter ?? p.RR),
    soil_moisture: toNumber(p.soil_moisture ?? p.SM),
    soil_temperature: toNumber(p.soil_temperature ?? p.ST),
    soil_conductivity: toNumber(p.soil_conductivity ?? p.SEC),
    ph_value: toNumber(p.ph_value ?? p.ph),
    battery,
    signal_strength: toNumber(p.signal_strength ?? p.SG),
    panel_temperature: toNumber(p.panel_temperature ?? p.TTi),
  };
}

client.on("connect", async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error(
      "[mqtt-ingest] database unreachable, exiting:",
      (err as Error).message
    );
    process.exit(1);
  }
  console.log(`[mqtt-ingest] connected to ${BROKER_URL}, subscribing ${TOPIC}`);
  client.subscribe(TOPIC, { qos: 1 }, (err) => {
    if (err) console.error("[mqtt-ingest] subscribe failed:", err);
  });
});

client.on("reconnect", () => console.log("[mqtt-ingest] reconnecting..."));
client.on("offline", () => console.log("[mqtt-ingest] broker offline"));
client.on("error", (err) => console.error("[mqtt-ingest] error:", err.message));

// Messages are handled strictly one at a time: concurrent first-queries
// each load Prisma's query compiler and OOM on small machines.
let processing: Promise<void> = Promise.resolve();

client.on("message", (topic, payload) => {
  processing = processing.then(() => handleMessage(topic, payload));
});

async function handleMessage(topic: string, payload: Buffer): Promise<void> {
  let body: unknown;
  try {
    body = JSON.parse(payload.toString());
  } catch {
    console.error("[mqtt-ingest] dropped non-JSON payload on", topic);
    return;
  }

  const data = mapPayload(body);
  if (!data) {
    console.error("[mqtt-ingest] dropped payload missing device_id/unix_time");
    return;
  }

  try {
    const result = await ingestTelemetry(data as TelemetryInput, {
      rawPayload: body,
    });
    if (result.ok) {
      console.log(
        `[mqtt-ingest] stored ${data.device_id}@${data.unix_time} -> ${result.reading.id}`
      );
    } else {
      console.warn(
        `[mqtt-ingest] rejected ${data.device_id}: ${result.reason}`
      );
    }
  } catch (err) {
    console.error("[mqtt-ingest] ingest failed:", err);
  }
}

function shutdown(signal: string) {
  console.log(`[mqtt-ingest] ${signal}, closing...`);
  client.end(false, () => process.exit(0));
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
