import mqtt from "mqtt";

// Dummy telemetry publisher: sends ONE firmware-format reading per seeded
// device (24 total) so the full fleet can be verified end-to-end against
// the dashboard without waiting for physical firmware.
// Run: bun run mqtt:dummy   (needs broker up + mqtt-ingest worker running)
const BROKER_URL = process.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883";
const TOPIC = process.env.MQTT_TOPIC ?? "LPA/test/nyawit";

interface DummyDevice {
  deviceId: string;
  lat: number;
  lon: number;
}

// The 24 seeded devices with their station coordinates (see prisma/seed.ts).
const DEVICES: DummyDevice[] = [
  { deviceId: "LPA-ESP3201-P001", lat: -2.3167, lon: 113.9167 },
  { deviceId: "LPA-ESP3201-P002", lat: -2.3167, lon: 113.9167 },
  { deviceId: "LPA-ESP3202-P001", lat: 0.2833, lon: 102.4167 },
  { deviceId: "LPA-ESP3202-P002", lat: 0.2833, lon: 102.4167 },
  { deviceId: "LPA-ESP3203-P001", lat: -8.4667, lon: 140.3333 },
  { deviceId: "LPA-ESP3203-P002", lat: -8.4667, lon: 140.3333 },
  { deviceId: "LPA-C3113122025-M0019", lat: 2.2772, lon: 101.0683 },
  { deviceId: "LPA-C2413122025-M0015", lat: 2.2772, lon: 101.0683 },
  { deviceId: "LPA-C2313122025-M0011", lat: 3.4017, lon: 114.761 },
  { deviceId: "LPA-C2613122025-M0014", lat: 3.4017, lon: 114.761 },
  { deviceId: "LPA-C3613122025-P0024", lat: 1.5166, lon: 103.7834 },
  { deviceId: "LPA-M1906112025-P0007", lat: 1.5166, lon: 103.7834 },
  { deviceId: "LPA-C4113122025-M0020", lat: -0.0167, lon: 109.4667 },
  { deviceId: "LPA-C4213122025-M0021", lat: -0.0167, lon: 109.4667 },
  { deviceId: "LPA-C4313122025-M0022", lat: 0.3167, lon: 103.15 },
  { deviceId: "LPA-C4413122025-M0023", lat: 0.3167, lon: 103.15 },
  { deviceId: "LPA-C4513122025-P0025", lat: -3.38, lon: 104.83 },
  { deviceId: "LPA-C4613122025-P0026", lat: -3.38, lon: 104.83 },
  { deviceId: "LPA-C4713122025-M0027", lat: -1.9, lon: 113.4 },
  { deviceId: "LPA-C4813122025-M0028", lat: -1.9, lon: 113.4 },
  { deviceId: "LPA-C4913122025-P0029", lat: 0.35, lon: 109.15 },
  { deviceId: "LPA-C5013122025-P0030", lat: 0.35, lon: 109.15 },
  { deviceId: "LPA-C5113122025-P0031", lat: -3.9771, lon: 138.5076 },
  { deviceId: "LPA-M5213122025-M0032", lat: -3.9771, lon: 138.5076 },
];

const client = mqtt.connect(BROKER_URL, { connectTimeout: 5000, reconnectPeriod: 0 });

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function publishOne(device: DummyDevice, index: number): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const battery = 95 - (index % 5);
  const payload = {
    unixtime: now,
    SM: 40 + ((index * 5) % 55),
    ST: 27 + (index % 5),
    ph: Math.round((6 + (index % 20) / 10) * 100) / 100,
    SEC: 2 + (index % 10),
    WL: 40 + ((index * 7) % 120),
    RR: 0,
    BT1: battery,
    BT2: battery,
    Lat: device.lat,
    Lon: device.lon,
    TTi: 32 + (index % 6),
    mode: "GSM",
    SG: -70 - (index % 25),
    fw_version: "1.0.15",
    otaInProgress: false,
    deviceId: device.deviceId,
  };
  return new Promise((resolve, reject) => {
    client.publish(TOPIC, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) reject(err);
      else {
        console.log(`[mqtt-dummy] sent ${device.deviceId}@${now}`);
        resolve();
      }
    });
  });
}

client.on("connect", async () => {
  console.log(`[mqtt-dummy] connected to ${BROKER_URL}, publishing to ${TOPIC}`);
  try {
    for (let i = 0; i < DEVICES.length; i++) {
      await publishOne(DEVICES[i], i);
      await sleep(150);
    }
    console.log(`[mqtt-dummy] done: ${DEVICES.length} devices`);
  } catch (err) {
    console.error("[mqtt-dummy] failed:", (err as Error).message);
    process.exitCode = 1;
  } finally {
    client.end(false, () => process.exit(process.exitCode ?? 0));
  }
});

client.on("error", (err) => {
  console.error("[mqtt-dummy] connection error:", err.message);
  process.exit(1);
});
