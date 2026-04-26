import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 12;

// ============================================
// HELPERS
// ============================================

/** Generate a random float between min and max */
function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/** Generate realistic sensor readings that drift over time */
function generateReadings(
  deviceId: string,
  count: number,
  baseTime: Date,
  intervalSeconds: number,
  profile: {
    waterLevel: [number, number];
    soilMoisture: [number, number];
    soilTemp: [number, number];
    rainfall: [number, number];
    ph: [number, number];
    conductivity: [number, number];
    battery: [number, number];
  }
) {
  const readings = [];
  let battery = profile.battery[1]; // Start at max

  for (let i = 0; i < count; i++) {
    const time = new Date(baseTime.getTime() - i * intervalSeconds * 1000);
    const unixTime = Math.floor(time.getTime() / 1000);

    // Battery slowly drains over time
    battery = Math.max(profile.battery[0], battery - rand(0.01, 0.05));

    // Add some time-of-day variation to soil temperature
    const hour = time.getHours();
    const tempOffset = hour >= 10 && hour <= 16 ? rand(1, 3) : rand(-1, 0);

    readings.push({
      deviceId,
      unixTime: BigInt(unixTime),
      dateTime: time,
      calibrationVersion: 1,
      // Raw values
      rawWaterLevel: rand(profile.waterLevel[0], profile.waterLevel[1]),
      rawSoilMoisture: rand(profile.soilMoisture[0], profile.soilMoisture[1]),
      rawSoilTemperature: rand(profile.soilTemp[0], profile.soilTemp[1]) + tempOffset,
      rawRainMeter: Math.random() > 0.7 ? rand(profile.rainfall[0], profile.rainfall[1]) : 0,
      rawPhValue: rand(profile.ph[0], profile.ph[1]),
      rawSoilConductivity: rand(profile.conductivity[0], profile.conductivity[1]),
      // Calibrated = same as raw for seed data (no formula applied)
      waterLevel: rand(profile.waterLevel[0], profile.waterLevel[1]),
      soilMoisture: rand(profile.soilMoisture[0], profile.soilMoisture[1]),
      soilTemperature: rand(profile.soilTemp[0], profile.soilTemp[1]) + tempOffset,
      rainMeter: Math.random() > 0.7 ? rand(profile.rainfall[0], profile.rainfall[1]) : 0,
      phValue: rand(profile.ph[0], profile.ph[1]),
      soilConductivity: rand(profile.conductivity[0], profile.conductivity[1]),
      // Telemetry
      battery: Math.round(battery * 10) / 10,
      signalStrength: rand(-85, -55),
      panelTemperature: rand(25, 50),
    });
  }
  return readings;
}

async function main() {
  console.log("🌱 Starting seed...\n");

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
  // 2. STATIONS (3 real peatland locations)
  // ============================================

  const station1 = await prisma.station.upsert({
    where: { id: "station-lpa-001" },
    update: {},
    create: {
      id: "station-lpa-001",
      name: "Stasiun Pemantauan Lahan Gambut Sebangau",
      provinsi: "Kalimantan Tengah",
      kabupaten: "Kota Palangka Raya",
      kecamatan: "Rakumpit",
      desa: "Mungku Baru",
      latitude: -2.3167,
      longitude: 113.9167,
      mapsLink: "https://maps.google.com/?q=-2.3167,113.9167",
      status: "AKTIF",
    },
  });
  console.log("✅ Station 1:", station1.name);

  const station2 = await prisma.station.upsert({
    where: { id: "station-lpa-002" },
    update: {},
    create: {
      id: "station-lpa-002",
      name: "Stasiun Pemantauan Gambut Kampar",
      provinsi: "Riau",
      kabupaten: "Kabupaten Pelalawan",
      kecamatan: "Kerumutan",
      desa: "Tanjung Batu",
      latitude: 0.2833,
      longitude: 102.4167,
      mapsLink: "https://maps.google.com/?q=0.2833,102.4167",
      status: "AKTIF",
    },
  });
  console.log("✅ Station 2:", station2.name);

  const station3 = await prisma.station.upsert({
    where: { id: "station-lpa-003" },
    update: {},
    create: {
      id: "station-lpa-003",
      name: "Stasiun Pemantauan Gambut Merauke",
      provinsi: "Papua Selatan",
      kabupaten: "Kabupaten Merauke",
      kecamatan: "Merauke",
      desa: "Wasur",
      latitude: -8.4667,
      longitude: 140.3333,
      mapsLink: "https://maps.google.com/?q=-8.4667,140.3333",
      status: "AKTIF",
    },
  });
  console.log("✅ Station 3:", station3.name);

  // ============================================
  // 3. DEVICES (2 per station = 6 total)
  // ============================================

  const devices = [
    // Station 1 — Sebangau
    {
      id: "device-001",
      deviceId: "LPA-ESP3201-P001",
      deviceName: "Sensor Utama Sebangau",
      stationId: station1.id,
      description: "Sensor utama area gambut dalam, kedalaman 2m",
      pipeLength: 200,
      remainingPipe: 45,
    },
    {
      id: "device-002",
      deviceId: "LPA-ESP3201-P002",
      deviceName: "Sensor Tepi Sungai Sebangau",
      stationId: station1.id,
      description: "Sensor di tepi sungai, pemantauan pasang surut",
      pipeLength: 150,
      remainingPipe: 30,
    },
    // Station 2 — Kampar
    {
      id: "device-003",
      deviceId: "LPA-ESP3202-P001",
      deviceName: "Sensor Utama Kampar",
      stationId: station2.id,
      description: "Sensor utama area restorasi gambut",
      pipeLength: 180,
      remainingPipe: 40,
    },
    {
      id: "device-004",
      deviceId: "LPA-ESP3202-P002",
      deviceName: "Sensor Kanal Kampar",
      stationId: station2.id,
      description: "Sensor pemantauan kanal blokade",
      pipeLength: 120,
      remainingPipe: 25,
    },
    // Station 3 — Merauke
    {
      id: "device-005",
      deviceId: "LPA-ESP3203-P001",
      deviceName: "Sensor Utama Merauke",
      stationId: station3.id,
      description: "Sensor area gambut pantai",
      pipeLength: 160,
      remainingPipe: 35,
    },
    {
      id: "device-006",
      deviceId: "LPA-ESP3203-P002",
      deviceName: "Sensor Rawa Merauke",
      stationId: station3.id,
      description: "Sensor area rawa gambut tropis",
      pipeLength: 140,
      remainingPipe: 30,
    },
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
        samplingInterval: 300,
        batteryWarning: 20,
        batteryCritical: 10,
      },
    });
    console.log(`✅ Device: ${d.deviceName} (${d.deviceId})`);
  }

  // ============================================
  // 4. READINGS (7 days of data, every 5 min = ~2016 per device)
  // ============================================
  const now = new Date();
  const READINGS_PER_DEVICE = 2016; // 7 days × 24 hours × 60/5 min
  const INTERVAL = 300; // 5 minutes

  // Different environmental profiles per station
  const profiles: Record<string, Parameters<typeof generateReadings>[4]> = {
    // Sebangau — deep peat, high moisture, acidic
    "device-001": {
      waterLevel: [30, 80],
      soilMoisture: [55, 85],
      soilTemp: [24, 30],
      rainfall: [0, 15],
      ph: [3.2, 4.5],
      conductivity: [50, 200],
      battery: [15, 95],
    },
    // Sebangau riverside — higher water, more rainfall influence
    "device-002": {
      waterLevel: [50, 120],
      soilMoisture: [60, 95],
      soilTemp: [23, 29],
      rainfall: [0, 25],
      ph: [3.8, 5.0],
      conductivity: [80, 300],
      battery: [20, 90],
    },
    // Kampar — restoration area, moderate moisture
    "device-003": {
      waterLevel: [20, 60],
      soilMoisture: [40, 70],
      soilTemp: [25, 32],
      rainfall: [0, 20],
      ph: [3.5, 4.8],
      conductivity: [60, 250],
      battery: [25, 92],
    },
    // Kampar canal — variable water, controlled drainage
    "device-004": {
      waterLevel: [10, 90],
      soilMoisture: [35, 75],
      soilTemp: [24, 31],
      rainfall: [0, 18],
      ph: [3.8, 5.2],
      conductivity: [40, 180],
      battery: [18, 88],
    },
    // Merauke — coastal peat, higher pH
    "device-005": {
      waterLevel: [40, 100],
      soilMoisture: [50, 80],
      soilTemp: [26, 34],
      rainfall: [0, 30],
      ph: [4.5, 6.0],
      conductivity: [100, 400],
      battery: [22, 93],
    },
    // Merauke swamp — very wet, warm
    "device-006": {
      waterLevel: [60, 140],
      soilMoisture: [65, 95],
      soilTemp: [27, 35],
      rainfall: [0, 35],
      ph: [4.0, 5.5],
      conductivity: [120, 350],
      battery: [20, 91],
    },
  };

  console.log(`\n📊 Generating ${READINGS_PER_DEVICE} readings per device (7 days)...`);

  for (const d of devices) {
    const profile = profiles[d.id];
    const readings = generateReadings(d.id, READINGS_PER_DEVICE, now, INTERVAL, profile);

    // Batch insert in chunks of 500 for performance
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
  // 5. ALERTS (sample alerts across stations)
  // ============================================

  const alerts = [
    {
      id: "alert-seed-001",
      stationId: station1.id,
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
      stationId: station1.id,
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
      stationId: station2.id,
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
      stationId: station2.id,
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
      stationId: station3.id,
      deviceId: "device-005",
      alertType: "SOIL_MOISTURE" as const,
      priority: "MEDIUM" as const,
      status: "IN_PROGRESS" as const,
      sourceType: "READING" as const,
      message: "Kelembapan tanah naik ke 88.7%, di atas ambang batas 80%",
      thresholdValue: 80,
      actualValue: 88.7,
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
  // 6. USERS
  // ============================================
  const superAdminPassword = await bcrypt.hash("SuperAdmin@LPA123", SALT_ROUNDS);
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

  // One admin per station
  const adminConfigs = [
    { name: "Admin Lokasi Sebangau", email: "admin.sebangau@lpa.id", stationId: station1.id },
    { name: "Admin Lokasi Kampar", email: "admin.kampar@lpa.id", stationId: station2.id },
    { name: "Admin Lokasi Merauke", email: "admin.merauke@lpa.id", stationId: station3.id },
  ];

  const adminPassword = await bcrypt.hash("AdminLokasi@LPA123", SALT_ROUNDS);
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
  console.log(`Stations       → 3 (Sebangau, Kampar, Merauke)`);
  console.log(`Devices        → 6 (2 per station)`);
  console.log(`Readings       → ${totalReadings.toLocaleString()} total`);
  console.log(`Alerts         → ${totalAlerts} (mixed statuses)`);
  console.log(`Super Admin    → ${superAdmin.email} | pw: SuperAdmin@LPA123`);
  console.log(`Admin Lokasi   → 3 accounts | pw: AdminLokasi@LPA123`);
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