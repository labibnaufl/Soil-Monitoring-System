import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 12;

async function main() {
  console.log("🌱 Starting seed...");

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
  console.log("✅ SystemConfig upserted:", systemConfig.id);

  // ============================================
  // 2. STATION (Kalimantan Tengah — realistic peatland area)
  // ============================================
  const station = await prisma.station.upsert({
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
  console.log("✅ Station upserted:", station.name);

  // ============================================
  // 3. SUPER ADMIN
  // ============================================
  const superAdminPassword = await bcrypt.hash("SuperAdmin@LPA123", SALT_ROUNDS);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@lpa.id" },
    update: {},
    create: {
      name: "Super Admin LPA",
      email: "superadmin@lpa.id",
      password: superAdminPassword,
      companyName: "LPA",
      role: "SUPER_ADMIN",
      status: "AKTIF",
      stationId: null, // Super Admin has no station binding
    },
  });
  console.log("✅ Super Admin created:", superAdmin.email);

  // ============================================
  // 4. ADMIN LOKASI
  // ============================================
  const adminLokasiPassword = await bcrypt.hash("AdminLokasi@LPA123", SALT_ROUNDS);

  const adminLokasi = await prisma.user.upsert({
    where: { email: "admin.sebangau@lpa.id" },
    update: {},
    create: {
      name: "Admin Lokasi Sebangau",
      email: "admin.sebangau@lpa.id",
      password: adminLokasiPassword,
      companyName: "LPA",
      role: "ADMIN_LOCATION",
      status: "AKTIF",
      stationId: station.id, // Bound to exactly one station
    },
  });
  console.log("✅ Admin Lokasi created:", adminLokasi.email);

  // ============================================
  // 5. SUMMARY
  // ============================================
  console.log("\n📋 Seed Summary");
  console.log("─────────────────────────────────────────");
  console.log("SystemConfig  →", systemConfig.id);
  console.log("Station       →", station.name);
  console.log("Super Admin   →", superAdmin.email, "| pw: SuperAdmin@LPA123");
  console.log("Admin Lokasi  →", adminLokasi.email, "| pw: AdminLokasi@LPA123");
  console.log("─────────────────────────────────────────");
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