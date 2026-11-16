// MQTT ingest worker: subscribes to the telemetry topic and feeds every
// payload through the SAME pipeline as POST /api/readings (src/lib/ingest.ts).
// Payload contract = the readings POST body:
// { device_id, unix_time, water_level?, rain_meter?, soil_moisture?,
//   soil_temperature?, soil_conductivity?, ph_value?, battery?,
//   signal_strength?, panel_temperature? } (RAW values, server calibrates).
//
// Run: bun run mqtt:ingest   (needs MQTT_BROKER_URL, MQTT_TOPIC in env)
import mqtt from "mqtt";
import { ingestTelemetry, type TelemetryInput } from "../../src/lib/ingest";

const BROKER_URL = process.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883";
const TOPIC = process.env.MQTT_TOPIC ?? "LPA/test/nyawit";

const client = mqtt.connect(BROKER_URL, { reconnectPeriod: 2000 });

client.on("connect", () => {
  console.log(`[mqtt-ingest] connected to ${BROKER_URL}, subscribing ${TOPIC}`);
  client.subscribe(TOPIC, { qos: 1 }, (err) => {
    if (err) console.error("[mqtt-ingest] subscribe failed:", err);
  });
});

client.on("reconnect", () => console.log("[mqtt-ingest] reconnecting..."));
client.on("offline", () => console.log("[mqtt-ingest] broker offline"));
client.on("error", (err) => console.error("[mqtt-ingest] error:", err.message));

client.on("message", async (topic, payload) => {
  let body: unknown;
  try {
    body = JSON.parse(payload.toString());
  } catch {
    console.error("[mqtt-ingest] dropped non-JSON payload on", topic);
    return;
  }

  const data = body as Partial<TelemetryInput>;
  if (typeof data.device_id !== "string" || typeof data.unix_time !== "number") {
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
});

function shutdown(signal: string) {
  console.log(`[mqtt-ingest] ${signal}, closing...`);
  client.end(false, () => process.exit(0));
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
