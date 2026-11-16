import mqtt from "mqtt";
import { prisma } from "@/lib/prisma";

// Downlink: retained per-device config so the ESP32 picks up dashboard
// edits (sampling interval, thresholds, pipe geometry, overrides) without
// physical access. Topic: <MQTT_TOPIC>/<deviceId>/config, e.g.
// LPA/test/nyawit/LPA-C3113122025-M0019/config
// Retained = the device receives the last config on every (re)connect.
// Firmware subscribes its own topic, applies the values, persists to NVS.
// Publish failures never throw: dashboard writes must succeed even when
// the broker is unreachable (device syncs on next connect via retain).
export function deviceConfigTopic(deviceId: string): string {
  const base = process.env.MQTT_TOPIC ?? "LPA/test/nyawit";
  return `${base}/${deviceId}/config`;
}

export interface DeviceConfigPayload {
  device_id: string;
  station_id: string | null;
  sampling_interval: number;
  battery_warning: number;
  battery_critical: number;
  pipe_length: number | null;
  remaining_pipe: number | null;
  sensor_config: unknown;
  updated_at: string;
}

export async function publishDeviceConfig(deviceId: string): Promise<boolean> {
  try {
    const device = await prisma.device.findUnique({ where: { deviceId } });
    if (!device) return false;

    const broker = process.env.MQTT_BROKER_URL;
    if (!broker) {
      console.warn("[mqtt-config] MQTT_BROKER_URL not set, skipping publish");
      return false;
    }

    const payload: DeviceConfigPayload = {
      device_id: device.deviceId,
      station_id: device.stationId,
      sampling_interval: device.samplingInterval,
      battery_warning: device.batteryWarning,
      battery_critical: device.batteryCritical,
      pipe_length: device.pipeLength,
      remaining_pipe: device.remainingPipe,
      sensor_config: device.sensorConfig ?? null,
      updated_at: new Date().toISOString(),
    };

    await new Promise<void>((resolve, reject) => {
      const client = mqtt.connect(broker, {
        connectTimeout: 3000,
        reconnectPeriod: 0,
      });
      client.on("connect", () => {
        client.publish(
          deviceConfigTopic(deviceId),
          JSON.stringify(payload),
          { qos: 1, retain: true },
          (err) => {
            try {
              client.end();
            } catch {
              // ignore close errors
            }
            if (err) reject(err);
            else resolve();
          }
        );
      });
      client.on("error", (err) => {
        try {
          client.end();
        } catch {
          // ignore close errors
        }
        reject(err);
      });
    });

    console.log(`[mqtt-config] published ${deviceConfigTopic(deviceId)}`);
    return true;
  } catch (err) {
    console.warn(
      `[mqtt-config] publish failed for ${deviceId}:`,
      (err as Error).message
    );
    return false;
  }
}
