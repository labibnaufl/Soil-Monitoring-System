import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  calibrateAllReadings,
  DEFAULT_FORMULAS,
} from "../src/lib/calibration";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 12;

// Seed passwords: override via env in real deployments.
const SUPERADMIN_PASSWORD =
  process.env.SEED_SUPERADMIN_PASSWORD ?? "SuperAdmin@LPA123";
const ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD ?? "AdminLokasi@LPA123";
if (!process.env.SEED_SUPERADMIN_PASSWORD || !process.env.SEED_ADMIN_PASSWORD) {
  console.warn(
    "⚠️  Using default seed passwords — set SEED_SUPERADMIN_PASSWORD / SEED_ADMIN_PASSWORD in production!"
  );
}

// ============================================
// HELPERS — modeled on data_lpafinal.sql (~205k rows, 12 devices)
// ============================================

/** Random float between min and max, 2 decimals */
function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/** Random walk: drift prev by up to step, clamped to [min, max] */
function walk(prev: number, min: number, max: number, step: number): number {
  const next = prev + rand(-step, step);
  return Math.round(Math.min(max, Math.max(min, next)) * 100) / 100;
}

interface DeviceProfile {
  waterLevel: [number, number];
  soilMoisture: [number, number];
  soilTemp: [number, number];
  rainfallMax: number;
  ph: [number, number];
  conductivity: [number, number];
  /** Fraction of readings where conductivity sensor drops out (0-1) */
  conductivityDropout: number;
  /** General sensor dropout applied to soil metrics (0-1) */
  dropout: number;
  batteryStart: number;
  signal: [number, number];
}

/**
 * Generate telemetry that looks like the field dump:
 * - random-walk drift (not white noise) so charts show trends
 * - rain as clustered storm events, not uniform drizzle
 * - soil moisture coupled to rain (rises after storms, decays after)
 * - battery solar-charges by day, drains by night
 * - occasional nulls so charts exercise their gap handling
 */
function generateReadings(
  deviceId: string,
  count: number,
  baseTime: Date,
  intervalSeconds: number,
  profile: DeviceProfile,
  pipeLength: number,
  remainingPipe: number
) {
  const readings = [];
  let wl = rand(profile.waterLevel[0], profile.waterLevel[1]);
  let moist = rand(profile.soilMoisture[0], profile.soilMoisture[1]);
  let temp = rand(profile.soilTemp[0], profile.soilTemp[1]);
  let cond = rand(profile.conductivity[0], profile.conductivity[1]);
  let ph = rand(profile.ph[0], profile.ph[1]);
  let battery = profile.batteryStart;
  let raining = false;

  for (let i = 0; i < count; i++) {
    const time = new Date(baseTime.getTime() - i * intervalSeconds * 1000);
    const unixTime = Math.floor(time.getTime() / 1000);
    const hour = time.getHours();

    // --- rain state machine: storms persist, dry spells dominate ---
    if (raining) {
      raining = Math.random() < 0.55;
    } else {
      raining = Math.random() < 0.035;
    }
    const rain = raining ? rand(0.5, profile.rainfallMax) : 0;

    // --- moisture follows rain with lag, decays in dry spells ---
    if (raining) {
      moist = Math.min(profile.soilMoisture[1], moist + rand(0.3, 1.2));
    } else {
      moist = Math.max(profile.soilMoisture[0], moist - rand(0, 0.25));
    }

    // --- diurnal temperature cycle (peaks 13:00-15:00) ---
    const diurnal =
      2.2 * Math.sin(((hour - 9) / 24) * Math.PI * 2) + rand(-0.4, 0.4);
    temp = walk(temp, profile.soilTemp[0] - 1, profile.soilTemp[1] + 1, 0.3);

    // --- other channels drift slowly ---
    wl = walk(wl, profile.waterLevel[0], profile.waterLevel[1], 1.5);
    cond = walk(cond, profile.conductivity[0], profile.conductivity[1], 4);
    ph = walk(ph, profile.ph[0], profile.ph[1], 0.05);

    // --- battery: solar charge by day, drain by night ---
    if (hour >= 6 && hour <= 18) {
      battery = Math.min(100, battery + rand(0.02, 0.06));
    } else {
      battery = Math.max(5, battery - rand(0.01, 0.04));
    }

    // --- sensor dropouts -> null (charts must show gaps, not zeros) ---
    const dropSoil = Math.random() < profile.dropout;
    const dropCond =
      dropSoil || Math.random() < profile.conductivityDropout;

    const raw = {
      rawWaterLevel: wl,
      rawRainMeter: rain,
      rawSoilMoisture: dropSoil ? null : Math.round(moist * 10) / 10,
      rawSoilTemperature:
        dropSoil ? null : Math.round((temp + diurnal) * 10) / 10,
      rawSoilConductivity: dropCond ? null : Math.round(cond),
      rawPhValue: dropSoil ? null : Math.round(ph * 100) / 100,
    };

    // Calibrated through the REAL pipeline (formulas + pipe geometry),
    // exactly like POST /api/readings does — never "same as raw".
    const calibrated = calibrateAllReadings(
      raw,
      DEFAULT_FORMULAS,
      { pipe_length: pipeLength, remaining_pipe: remainingPipe }
    );

    readings.push({
      deviceId,
      unixTime: BigInt(unixTime),
      dateTime: time,
      calibrationVersion: 1,
      ...raw,
      waterLevel: calibrated.waterLevel,
      rainMeter: calibrated.rainMeter,
      soilMoisture: calibrated.soilMoisture,
      soilTemperature: calibrated.soilTemperature,
      soilConductivity: calibrated.soilConductivity,
      phValue: calibrated.phValue,
      battery: Math.round(battery * 10) / 10,
      signalStrength: Math.round(rand(profile.signal[0], profile.signal[1])),
      panelTemperature: rand(25, 50),
    });
  }
  return readings;
}

async function main() {
  console.log("🌱 Starting seed (field-data archetypes)...\n");

  // ============================================
  // 1. SYSTEM CONFIG (singleton row)
  // ============================================
  const systemConfig = await prisma.systemConfig.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      soilMoistureMin: 20,
      soilMoistureMax: 80,
      peatlandLifespanMin: 10,
      calibrationFormulas: {
        rain_meter: { type: "linear", slope: 0.2, intercept: 0 },
        soil_conductivity: { type: "linear", slope: 400, intercept: 0 },
        water_level: { type: "water_level" },
      },
    },
  });
  console.log("✅ SystemConfig:", systemConfig.id);

  // ============================================
  // 2. STATIONS (3 original + 3 from real GPS clusters)
  // ============================================

  const stationDefs = [
    {
      id: "station-lpa-001",
      name: "Stasiun Pemantauan Lahan Gambut Sebangau",
      provinsi: "Kalimantan Tengah",
      kabupaten: "Kota Palangka Raya",
      kecamatan: "Rakumpit",
      desa: "Mungku Baru",
      latitude: -2.3167,
      longitude: 113.9167,
    },
    {
      id: "station-lpa-002",
      name: "Stasiun Pemantauan Gambut Kampar",
      provinsi: "Riau",
      kabupaten: "Kabupaten Pelalawan",
      kecamatan: "Kerumutan",
      desa: "Tanjung Batu",
      latitude: 0.2833,
      longitude: 102.4167,
    },
    {
      id: "station-lpa-003",
      name: "Stasiun Pemantauan Gambut Merauke",
      provinsi: "Papua Selatan",
      kabupaten: "Kabupaten Merauke",
      kecamatan: "Merauke",
      desa: "Wasur",
      latitude: -8.4667,
      longitude: 140.3333,
    },
    // Real cluster: M0015/M0019 pair (~2.28, 101.08)
    {
      id: "station-lpa-004",
      name: "Stasiun Gambut Siak",
      provinsi: "Riau",
      kabupaten: "Kabupaten Siak",
      kecamatan: "Sungai Apit",
      desa: "Teluk Lanus",
      latitude: 2.2772,
      longitude: 101.0683,
    },
    // Real cluster: M0011/M0014 pair (~3.40, 114.76)
    {
      id: "station-lpa-005",
      name: "Stasiun Gambut Malinau",
      provinsi: "Kalimantan Utara",
      kabupaten: "Kabupaten Malinau",
      kecamatan: "Malinau Kota",
      desa: "Pelita Kanaan",
      latitude: 3.4017,
      longitude: 114.761,
    },
    // Real device: M0024 (~1.52, 103.78)
    {
      id: "station-lpa-006",
      name: "Stasiun Gambut Jambi",
      provinsi: "Jambi",
      kabupaten: "Kabupaten Tanjung Jabung Timur",
      kecamatan: "Mendahara",
      desa: "Pangkal Babu",
      latitude: 1.5166,
      longitude: 103.7834,
    },
    // Expansion fleet: western + eastern peatlands
    {
      id: "station-lpa-007",
      name: "Stasiun Gambut Kubu Raya",
      provinsi: "Kalimantan Barat",
      kabupaten: "Kabupaten Kubu Raya",
      kecamatan: "Kubu",
      desa: "Air Putih",
      latitude: -0.0167,
      longitude: 109.4667,
    },
    {
      id: "station-lpa-008",
      name: "Stasiun Gambut Indragiri",
      provinsi: "Riau",
      kabupaten: "Kabupaten Indragiri Hilir",
      kecamatan: "Tembilahan",
      desa: "Sungai Beringin",
      latitude: 0.3167,
      longitude: 103.15,
    },
    {
      id: "station-lpa-009",
      name: "Stasiun Gambut Ogan Komering",
      provinsi: "Sumatera Selatan",
      kabupaten: "Kabupaten Ogan Komering Ilir",
      kecamatan: "Kayuagung",
      desa: "Celungan",
      latitude: -3.38,
      longitude: 104.83,
    },
    {
      id: "station-lpa-010",
      name: "Stasiun Gambut Katingan",
      provinsi: "Kalimantan Tengah",
      kabupaten: "Kabupaten Katingan",
      kecamatan: "Kasongan",
      desa: "Hampalit",
      latitude: -1.9,
      longitude: 113.4,
    },
    {
      id: "station-lpa-011",
      name: "Stasiun Gambut Mempawah",
      provinsi: "Kalimantan Barat",
      kabupaten: "Kabupaten Mempawah",
      kecamatan: "Sungai Pinyuh",
      desa: "Peniraman",
      latitude: 0.35,
      longitude: 109.15,
    },
    {
      id: "station-lpa-012",
      name: "Stasiun Gambut Asmat",
      provinsi: "Papua Selatan",
      kabupaten: "Kabupaten Asmat",
      kecamatan: "Agats",
      desa: "Bis Agats",
      latitude: -3.9771,
      longitude: 138.5076,
    },
  ];

  const stations: Record<string, { id: string; name: string }> = {};
  for (const s of stationDefs) {
    const station = await prisma.station.upsert({
      where: { id: s.id },
      update: {},
      create: {
        ...s,
        mapsLink: `https://maps.google.com/?q=${s.latitude},${s.longitude}`,
        status: "AKTIF",
      },
    });
    stations[s.id] = station;
    console.log("✅ Station:", station.name);
  }

  // ============================================
  // 3. DEVICES (2 per station = 12 total)
  // ============================================

  const devices = [
    // --- Original 6 (7 days @ 5 min) ---
    { id: "device-001", deviceId: "LPA-ESP3201-P001", deviceName: "Sensor Utama Sebangau", stationId: "station-lpa-001", description: "Sensor utama area gambut dalam, kedalaman 2m", pipeLength: 200, remainingPipe: 185, interval: 300, days: 7 },
    { id: "device-002", deviceId: "LPA-ESP3201-P002", deviceName: "Sensor Tepi Sungai Sebangau", stationId: "station-lpa-001", description: "Sensor di tepi sungai, pemantauan pasang surut", pipeLength: 150, remainingPipe: 138, interval: 300, days: 7 },
    { id: "device-003", deviceId: "LPA-ESP3202-P001", deviceName: "Sensor Utama Kampar", stationId: "station-lpa-002", description: "Sensor utama area restorasi gambut", pipeLength: 180, remainingPipe: 168, interval: 300, days: 7 },
    { id: "device-004", deviceId: "LPA-ESP3202-P002", deviceName: "Sensor Kanal Kampar", stationId: "station-lpa-002", description: "Sensor pemantauan kanal blokade", pipeLength: 120, remainingPipe: 110, interval: 300, days: 7 },
    { id: "device-005", deviceId: "LPA-ESP3203-P001", deviceName: "Sensor Utama Merauke", stationId: "station-lpa-003", description: "Sensor area gambut pantai", pipeLength: 160, remainingPipe: 148, interval: 300, days: 7 },
    { id: "device-006", deviceId: "LPA-ESP3203-P002", deviceName: "Sensor Rawa Merauke", stationId: "station-lpa-003", description: "Sensor area rawa gambut tropis", pipeLength: 140, remainingPipe: 128, interval: 300, days: 7 },
    // --- New 6: field-ID format, 30 days @ 15 min (battery-friendly) ---
    { id: "device-007", deviceId: "LPA-C3113122025-M0019", deviceName: "Sensor Utama Siak", stationId: "station-lpa-004", description: "Sensor utama blok C31 Siak", pipeLength: 200, remainingPipe: 186, interval: 900, days: 30 },
    { id: "device-008", deviceId: "LPA-C2413122025-M0015", deviceName: "Sensor Rawa Siak", stationId: "station-lpa-004", description: "Sensor rawa blok C24, konduktivitas intermiten", pipeLength: 200, remainingPipe: 184, interval: 900, days: 30 },
    { id: "device-009", deviceId: "LPA-C2313122025-M0011", deviceName: "Sensor Utama Malinau", stationId: "station-lpa-005", description: "Sensor area tergenang permanen", pipeLength: 220, remainingPipe: 206, interval: 900, days: 30 },
    { id: "device-010", deviceId: "LPA-C2613122025-M0014", deviceName: "Sensor Hutan Malinau", stationId: "station-lpa-005", description: "Sensor hutan sekunder, baterai lemah", pipeLength: 200, remainingPipe: 188, interval: 900, days: 30 },
    { id: "device-011", deviceId: "LPA-C3613122025-P0024", deviceName: "Sensor Utama Jambi", stationId: "station-lpa-006", description: "Sensor utama blok C36 Jambi", pipeLength: 180, remainingPipe: 166, interval: 900, days: 30 },
    { id: "device-012", deviceId: "LPA-M1906112025-P0007", deviceName: "Sensor Rawa Jambi", stationId: "station-lpa-006", description: "Sensor rawa blok M19, dropout periodik", pipeLength: 200, remainingPipe: 185, interval: 900, days: 30 },
    // --- Expansion fleet: 30 days @ 15 min ---
    { id: "device-013", deviceId: "LPA-C4113122025-M0020", deviceName: "Sensor Utama Kubu Raya", stationId: "station-lpa-007", description: "Sensor utama blok C41 Kubu Raya", pipeLength: 200, remainingPipe: 187, interval: 900, days: 30 },
    { id: "device-014", deviceId: "LPA-C4213122025-M0021", deviceName: "Sensor Rawa Kubu Raya", stationId: "station-lpa-007", description: "Sensor rawa blok C42, tergenang musiman", pipeLength: 210, remainingPipe: 196, interval: 900, days: 30 },
    { id: "device-015", deviceId: "LPA-C4313122025-M0022", deviceName: "Sensor Utama Indragiri", stationId: "station-lpa-008", description: "Sensor utama blok C43 Indragiri", pipeLength: 190, remainingPipe: 176, interval: 900, days: 30 },
    { id: "device-016", deviceId: "LPA-C4413122025-M0023", deviceName: "Sensor Kanal Indragiri", stationId: "station-lpa-008", description: "Sensor kanal blok C44", pipeLength: 170, remainingPipe: 158, interval: 900, days: 30 },
    { id: "device-017", deviceId: "LPA-C4513122025-P0025", deviceName: "Sensor Utama Ogan", stationId: "station-lpa-009", description: "Sensor lahan kering blok C45", pipeLength: 200, remainingPipe: 190, interval: 900, days: 30 },
    { id: "device-018", deviceId: "LPA-C4613122025-P0026", deviceName: "Sensor Rawa Ogan", stationId: "station-lpa-009", description: "Sensor rawa blok C46", pipeLength: 200, remainingPipe: 186, interval: 900, days: 30 },
    { id: "device-019", deviceId: "LPA-C4713122025-M0027", deviceName: "Sensor Utama Katingan", stationId: "station-lpa-010", description: "Sensor utama blok C47 Katingan", pipeLength: 210, remainingPipe: 197, interval: 900, days: 30 },
    { id: "device-020", deviceId: "LPA-C4813122025-M0028", deviceName: "Sensor Hutan Katingan", stationId: "station-lpa-010", description: "Sensor hutan blok C48, baterai lemah", pipeLength: 200, remainingPipe: 187, interval: 900, days: 30 },
    { id: "device-021", deviceId: "LPA-C4913122025-P0029", deviceName: "Sensor Utama Mempawah", stationId: "station-lpa-011", description: "Sensor utama blok C49 Mempawah", pipeLength: 190, remainingPipe: 177, interval: 900, days: 30 },
    { id: "device-022", deviceId: "LPA-C5013122025-P0030", deviceName: "Sensor Pesisir Mempawah", stationId: "station-lpa-011", description: "Sensor pesisir blok C50, intrusi air asin", pipeLength: 180, remainingPipe: 168, interval: 900, days: 30 },
    { id: "device-023", deviceId: "LPA-C5113122025-P0031", deviceName: "Sensor Utama Asmat", stationId: "station-lpa-012", description: "Sensor utama blok C51 Asmat", pipeLength: 220, remainingPipe: 205, interval: 900, days: 30 },
    { id: "device-024", deviceId: "LPA-M5213122025-M0032", deviceName: "Sensor Rawa Asmat", stationId: "station-lpa-012", description: "Sensor rawa blok M52 Asmat", pipeLength: 220, remainingPipe: 204, interval: 900, days: 30 },
  ];

  for (const d of devices) {
    await prisma.device.upsert({
      where: { deviceId: d.deviceId },
      update: {},
      create: {
        id: d.id,
        deviceId: d.deviceId,
        deviceName: d.deviceName,
        stationId: d.stationId,
        description: d.description,
        pipeLength: d.pipeLength,
        remainingPipe: d.remainingPipe,
        status: "BEROPERASI",
        samplingInterval: d.interval,
        batteryWarning: 20,
        batteryCritical: 10,
      },
    });
    console.log(`✅ Device: ${d.deviceName} (${d.deviceId})`);
  }

  // ============================================
  // 4. READINGS — per-device archetype profiles
  // ============================================
  const profiles: Record<string, DeviceProfile> = {
    "device-001": { waterLevel: [30, 80], soilMoisture: [55, 85], soilTemp: [24, 30], rainfallMax: 15, ph: [3.2, 4.5], conductivity: [50, 200], conductivityDropout: 0, dropout: 0.005, batteryStart: 95, signal: [-85, -55] },
    "device-002": { waterLevel: [50, 120], soilMoisture: [60, 95], soilTemp: [23, 29], rainfallMax: 25, ph: [3.8, 5.0], conductivity: [80, 300], conductivityDropout: 0, dropout: 0.005, batteryStart: 90, signal: [-88, -60] },
    "device-003": { waterLevel: [20, 60], soilMoisture: [40, 70], soilTemp: [25, 32], rainfallMax: 20, ph: [3.5, 4.8], conductivity: [60, 250], conductivityDropout: 0, dropout: 0.005, batteryStart: 92, signal: [-85, -55] },
    "device-004": { waterLevel: [10, 90], soilMoisture: [35, 75], soilTemp: [24, 31], rainfallMax: 18, ph: [3.8, 5.2], conductivity: [40, 180], conductivityDropout: 0, dropout: 0.01, batteryStart: 88, signal: [-90, -60] },
    "device-005": { waterLevel: [40, 100], soilMoisture: [50, 80], soilTemp: [26, 34], rainfallMax: 30, ph: [4.5, 6.0], conductivity: [100, 400], conductivityDropout: 0, dropout: 0.005, batteryStart: 93, signal: [-85, -55] },
    "device-006": { waterLevel: [60, 140], soilMoisture: [65, 95], soilTemp: [27, 35], rainfallMax: 35, ph: [4.0, 5.5], conductivity: [120, 350], conductivityDropout: 0, dropout: 0.005, batteryStart: 91, signal: [-85, -58] },
    // Siak pair (real: wl 13-118, moisture 45-100, cond mostly dead on M0015)
    "device-007": { waterLevel: [30, 118], soilMoisture: [45, 95], soilTemp: [28, 33], rainfallMax: 22, ph: [6.0, 7.8], conductivity: [2, 15], conductivityDropout: 0.05, dropout: 0.008, batteryStart: 99, signal: [-107, -70] },
    "device-008": { waterLevel: [70, 118], soilMoisture: [40, 62], soilTemp: [28, 33], rainfallMax: 22, ph: [6.2, 7.8], conductivity: [1, 12], conductivityDropout: 0.45, dropout: 0.01, batteryStart: 98, signal: [-103, -51] },
    // Malinau pair (real: saturated moisture ~100, wl 82-182)
    "device-009": { waterLevel: [82, 182], soilMoisture: [96, 100], soilTemp: [27, 30], rainfallMax: 28, ph: [6.4, 7.6], conductivity: [10, 18], conductivityDropout: 0, dropout: 0.005, batteryStart: 97, signal: [-107, -65] },
    "device-010": { waterLevel: [80, 120], soilMoisture: [90, 100], soilTemp: [27, 30], rainfallMax: 28, ph: [6.5, 7.6], conductivity: [10, 16], conductivityDropout: 0.02, dropout: 0.01, batteryStart: 24, signal: [-100, -60] },
    // Jambi pair
    "device-011": { waterLevel: [33, 118], soilMoisture: [50, 85], soilTemp: [26, 32], rainfallMax: 24, ph: [5.5, 7.0], conductivity: [20, 120], conductivityDropout: 0, dropout: 0.008, batteryStart: 96, signal: [-107, -62] },
    "device-012": { waterLevel: [40, 121], soilMoisture: [55, 95], soilTemp: [26, 32], rainfallMax: 24, ph: [5.5, 7.2], conductivity: [15, 90], conductivityDropout: 0.1, dropout: 0.03, batteryStart: 94, signal: [-105, -60] },
    // Expansion fleet: distinct bands so bar charts separate clearly
    "device-013": { waterLevel: [45, 110], soilMoisture: [55, 85], soilTemp: [26, 33], rainfallMax: 26, ph: [4.5, 6.0], conductivity: [60, 220], conductivityDropout: 0, dropout: 0.008, batteryStart: 97, signal: [-100, -62] },
    "device-014": { waterLevel: [85, 160], soilMoisture: [93, 100], soilTemp: [26, 31], rainfallMax: 26, ph: [4.8, 6.2], conductivity: [80, 200], conductivityDropout: 0.02, dropout: 0.008, batteryStart: 95, signal: [-102, -64] },
    "device-015": { waterLevel: [25, 75], soilMoisture: [48, 78], soilTemp: [25, 32], rainfallMax: 20, ph: [4.0, 5.5], conductivity: [50, 180], conductivityDropout: 0, dropout: 0.01, batteryStart: 93, signal: [-98, -58] },
    "device-016": { waterLevel: [15, 85], soilMoisture: [38, 72], soilTemp: [25, 31], rainfallMax: 20, ph: [4.2, 5.8], conductivity: [40, 150], conductivityDropout: 0.05, dropout: 0.01, batteryStart: 91, signal: [-99, -60] },
    "device-017": { waterLevel: [10, 55], soilMoisture: [18, 38], soilTemp: [27, 34], rainfallMax: 12, ph: [4.5, 6.0], conductivity: [30, 120], conductivityDropout: 0, dropout: 0.008, batteryStart: 92, signal: [-96, -58] },
    "device-018": { waterLevel: [55, 130], soilMoisture: [70, 96], soilTemp: [26, 32], rainfallMax: 24, ph: [4.6, 6.1], conductivity: [70, 240], conductivityDropout: 0, dropout: 0.008, batteryStart: 90, signal: [-97, -59] },
    "device-019": { waterLevel: [40, 100], soilMoisture: [52, 82], soilTemp: [24, 31], rainfallMax: 22, ph: [3.5, 4.8], conductivity: [55, 210], conductivityDropout: 0, dropout: 0.008, batteryStart: 96, signal: [-101, -61] },
    "device-020": { waterLevel: [35, 95], soilMoisture: [50, 80], soilTemp: [24, 31], rainfallMax: 22, ph: [3.6, 4.9], conductivity: [50, 190], conductivityDropout: 0.03, dropout: 0.01, batteryStart: 28, signal: [-103, -63] },
    "device-021": { waterLevel: [50, 115], soilMoisture: [58, 88], soilTemp: [26, 33], rainfallMax: 26, ph: [5.0, 6.5], conductivity: [90, 260], conductivityDropout: 0, dropout: 0.008, batteryStart: 94, signal: [-99, -60] },
    "device-022": { waterLevel: [60, 125], soilMoisture: [62, 90], soilTemp: [27, 34], rainfallMax: 26, ph: [6.8, 8.0], conductivity: [400, 900], conductivityDropout: 0.04, dropout: 0.01, batteryStart: 93, signal: [-101, -62] },
    "device-023": { waterLevel: [70, 150], soilMoisture: [75, 98], soilTemp: [26, 32], rainfallMax: 30, ph: [5.0, 6.5], conductivity: [100, 300], conductivityDropout: 0, dropout: 0.008, batteryStart: 95, signal: [-104, -64] },
    "device-024": { waterLevel: [65, 145], soilMoisture: [72, 97], soilTemp: [26, 32], rainfallMax: 30, ph: [5.2, 6.6], conductivity: [90, 280], conductivityDropout: 0.06, dropout: 0.012, batteryStart: 92, signal: [-106, -66] },
  };

  const now = new Date();
  console.log("\n📊 Generating readings (random-walk + storm events)...");

  for (const d of devices) {
    const profile = profiles[d.id];
    const count = Math.floor((d.days * 24 * 3600) / d.interval);
    const readings = generateReadings(
      d.id,
      count,
      now,
      d.interval,
      profile,
      d.pipeLength,
      d.remainingPipe
    );

    const BATCH_SIZE = 500;
    for (let i = 0; i < readings.length; i += BATCH_SIZE) {
      const batch = readings.slice(i, i + BATCH_SIZE);
      await prisma.readings.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }
    console.log(`✅ ${readings.length} readings for ${d.deviceName}`);
  }

  // ============================================
  // 5. ALERTS (one per persona: open, pending, resolved, in-progress + offline demo)
  // ============================================

  const alerts = [
    {
      id: "alert-seed-001",
      stationId: "station-lpa-001",
      deviceId: "device-001",
      alertType: "SOIL_MOISTURE" as const,
      priority: "HIGH" as const,
      status: "OPEN" as const,
      sourceType: "READING" as const,
      message: "KRITIS - Kekeringan Ekstrem: Kelembapan tanah 8.2% (ambang batas: 10%)",
      thresholdValue: 10,
      actualValue: 8.2,
    },
    {
      id: "alert-seed-002",
      stationId: "station-lpa-001",
      deviceId: "device-002",
      alertType: "LOW_BATTERY" as const,
      priority: "MEDIUM" as const,
      status: "OPEN" as const,
      sourceType: "READING" as const,
      message: "Baterai perangkat Sensor Tepi Sungai Sebangau rendah: 18.5%",
      thresholdValue: 20,
      actualValue: 18.5,
    },
    {
      id: "alert-seed-003",
      stationId: "station-lpa-002",
      deviceId: "device-003",
      alertType: "SOIL_MOISTURE" as const,
      priority: "MEDIUM" as const,
      status: "RESOLVED" as const,
      sourceType: "READING" as const,
      message: "Kelembapan tanah turun ke 18.3%, di bawah ambang batas 20%",
      thresholdValue: 20,
      actualValue: 18.3,
      resolutionNote: "Area telah disiram, kelembapan kembali normal",
    },
    {
      id: "alert-seed-004",
      stationId: "station-lpa-002",
      deviceId: "device-004",
      alertType: "LOW_BATTERY" as const,
      priority: "HIGH" as const,
      status: "PENDING" as const,
      sourceType: "READING" as const,
      message: "Baterai perangkat Sensor Kanal Kampar kritis: 7.2%",
      thresholdValue: 10,
      actualValue: 7.2,
    },
    {
      id: "alert-seed-005",
      stationId: "station-lpa-003",
      deviceId: "device-005",
      alertType: "SOIL_MOISTURE" as const,
      priority: "MEDIUM" as const,
      status: "IN_PROGRESS" as const,
      sourceType: "READING" as const,
      message: "Kelembapan tanah naik ke 88.7%, di atas ambang batas 80%",
      thresholdValue: 80,
      actualValue: 88.7,
    },
    // New fleet: low-battery device (seeded at 24%, drains below critical)
    {
      id: "alert-seed-006",
      stationId: "station-lpa-005",
      deviceId: "device-010",
      alertType: "LOW_BATTERY" as const,
      priority: "HIGH" as const,
      status: "OPEN" as const,
      sourceType: "READING" as const,
      message: "Baterai perangkat Sensor Hutan Malinau kritis: 9.4%",
      thresholdValue: 10,
      actualValue: 9.4,
    },
    // New fleet: saturated station reads high moisture
    {
      id: "alert-seed-007",
      stationId: "station-lpa-005",
      deviceId: "device-009",
      alertType: "SOIL_MOISTURE" as const,
      priority: "MEDIUM" as const,
      status: "OPEN" as const,
      sourceType: "READING" as const,
      message: "Kelembapan tanah naik ke 99.2%, di atas ambang batas 80%",
      thresholdValue: 80,
      actualValue: 99.2,
    },
    // Expansion fleet: dry Ogan block + weak Katingan battery
    {
      id: "alert-seed-008",
      stationId: "station-lpa-009",
      deviceId: "device-017",
      alertType: "SOIL_MOISTURE" as const,
      priority: "HIGH" as const,
      status: "OPEN" as const,
      sourceType: "READING" as const,
      message: "KRITIS - Kekeringan Ekstrem: Kelembapan tanah 9.1% (ambang batas: 10%)",
      thresholdValue: 10,
      actualValue: 9.1,
    },
    {
      id: "alert-seed-009",
      stationId: "station-lpa-010",
      deviceId: "device-020",
      alertType: "LOW_BATTERY" as const,
      priority: "MEDIUM" as const,
      status: "PENDING" as const,
      sourceType: "READING" as const,
      message: "Baterai perangkat Sensor Hutan Katingan rendah: 17.8%",
      thresholdValue: 20,
      actualValue: 17.8,
    },
  ];

  for (const a of alerts) {
    await prisma.alert.upsert({
      where: { id: a.id },
      update: {},
      create: a,
    });
    console.log(`✅ Alert: ${a.alertType} (${a.status}) — ${a.message.slice(0, 50)}...`);
  }

  // ============================================
  // 6. USERS (super admin + one location admin per station)
  // ============================================
  const superAdminPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, SALT_ROUNDS);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@lpa.id" },
    update: {},
    create: {
      name: "Super Admin LPA",
      email: "superadmin@lpa.id",
      password: superAdminPassword,
      companyName: "Lembaga Pengelola Area",
      role: "SUPER_ADMIN",
      status: "AKTIF",
      stationId: null,
    },
  });
  console.log(`\n✅ Super Admin: ${superAdmin.email}`);

  const adminConfigs = [
    { name: "Admin Lokasi Sebangau", email: "admin.sebangau@lpa.id", stationId: "station-lpa-001" },
    { name: "Admin Lokasi Kampar", email: "admin.kampar@lpa.id", stationId: "station-lpa-002" },
    { name: "Admin Lokasi Merauke", email: "admin.merauke@lpa.id", stationId: "station-lpa-003" },
    { name: "Admin Lokasi Siak", email: "admin.siak@lpa.id", stationId: "station-lpa-004" },
    { name: "Admin Lokasi Malinau", email: "admin.malinau@lpa.id", stationId: "station-lpa-005" },
    { name: "Admin Lokasi Jambi", email: "admin.jambi@lpa.id", stationId: "station-lpa-006" },
    { name: "Admin Lokasi Kubu Raya", email: "admin.kuburaya@lpa.id", stationId: "station-lpa-007" },
    { name: "Admin Lokasi Indragiri", email: "admin.indragiri@lpa.id", stationId: "station-lpa-008" },
    { name: "Admin Lokasi Ogan", email: "admin.ogan@lpa.id", stationId: "station-lpa-009" },
    { name: "Admin Lokasi Katingan", email: "admin.katingan@lpa.id", stationId: "station-lpa-010" },
    { name: "Admin Lokasi Mempawah", email: "admin.mempawah@lpa.id", stationId: "station-lpa-011" },
    { name: "Admin Lokasi Asmat", email: "admin.asmat@lpa.id", stationId: "station-lpa-012" },
  ];

  const adminPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  for (const cfg of adminConfigs) {
    const admin = await prisma.user.upsert({
      where: { email: cfg.email },
      update: {},
      create: {
        name: cfg.name,
        email: cfg.email,
        password: adminPassword,
        companyName: "Lembaga Pengelola Area",
        role: "ADMIN_LOCATION",
        status: "AKTIF",
        stationId: cfg.stationId,
      },
    });
    console.log(`✅ Admin Lokasi: ${admin.email} → ${cfg.stationId}`);
  }

  // ============================================
  // 7. SUMMARY
  // ============================================
  const totalReadings = await prisma.readings.count();
  const totalAlerts = await prisma.alert.count();

  console.log("\n📋 Seed Summary");
  console.log("─────────────────────────────────────────────");
  console.log(`SystemConfig   → ${systemConfig.id}`);
  console.log(`Stations       → 12 (Sebangau, Kampar, Merauke, Siak, Malinau, Jambi, Kubu Raya, Indragiri, Ogan, Katingan, Mempawah, Asmat)`);
  console.log(`Devices        → 24 (6 × 7d@5min + 18 × 30d@15min)`);
  console.log(`Readings       → ${totalReadings.toLocaleString()} total`);
  console.log(`Alerts         → ${totalAlerts} (mixed statuses)`);
  console.log(`Super Admin    → ${superAdmin.email}`);
  console.log(`Admin Lokasi   → 12 accounts`);
  console.log("─────────────────────────────────────────────");
  console.log("⚠️  Change all passwords before deploying to production!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
