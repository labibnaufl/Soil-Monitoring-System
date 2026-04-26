import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardContent } from "./_components/dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard - NYAWIT",
  description: "Dashboard monitoring sistem gambut",
};

async function getDashboardData(userId: string, isSuperAdmin: boolean, userStationId: string | null) {
  // Get accessible station IDs
  let stationIds: string[] = [];

  if (isSuperAdmin) {
    const stations = await prisma.station.findMany({
      select: { id: true },
    });
    stationIds = stations.map((s) => s.id);
  } else if (userStationId) {
    // Admin Lokasi has single station via direct FK
    stationIds = [userStationId];
  }

  // Get all devices for these stations
  const devices = await prisma.device.findMany({
    where: { stationId: { in: stationIds } },
    select: { id: true, stationId: true, status: true },
  });
  const deviceIds = devices.map((d) => d.id);

  // Device counts
  const totalDevices = devices.length;
  const activeDevices = devices.filter((d) => d.status === "BEROPERASI").length;

  // Get latest readings for these devices
  const latestReadings = await prisma.readings.findMany({
    where: { deviceId: { in: deviceIds } },
    orderBy: { dateTime: "desc" },
    take: 100,
    include: {
      device: {
        select: { deviceName: true, status: true, station: { select: { name: true } } },
      },
    },
  });

  // Deduplicate to get latest reading per device
  const latestByDevice = new Map();
  for (const reading of latestReadings) {
    if (!latestByDevice.has(reading.deviceId)) {
      latestByDevice.set(reading.deviceId, reading);
    }
  }
  const uniqueLatestReadings = Array.from(latestByDevice.values());

  // Get alert counts
  const stationFilter = { stationId: { in: stationIds } };

  const [resolvedAlerts, criticalAlerts, warningAlerts] = await Promise.all([
    prisma.alert.count({ where: { status: "RESOLVED", ...stationFilter } }),
    prisma.alert.count({ where: { status: "OPEN", priority: "HIGH", ...stationFilter } }),
    prisma.alert.count({ where: { status: "OPEN", priority: "MEDIUM", ...stationFilter } }),
  ]);

  // Get station counts
  const totalStations = stationIds.length;
  const activeStations = await prisma.station.count({
    where: {
      id: { in: stationIds },
      devices: {
        some: { status: "BEROPERASI" },
      },
    },
  });

  // Get admin lokasi count
  const totalAdminLokasi = await prisma.user.count({
    where: { role: "ADMIN_LOCATION", status: "AKTIF" },
  });

  // Get recent alerts with station name
  const recentAlerts = await prisma.alert.findMany({
    where: { stationId: { in: stationIds } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      station: {
        select: { name: true },
      },
    },
  });

  return {
    latestReadings: uniqueLatestReadings,
    resolvedAlerts,
    criticalAlerts,
    warningAlerts,
    totalStations,
    activeStations,
    inactiveStations: totalStations - activeStations,
    recentAlerts,
    totalDevices,
    activeDevices,
    totalAdminLokasi,
  };
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const data = await getDashboardData(
    session.user.id,
    isSuperAdmin,
    session.user.stationId
  );

  // Serialize for client component (dates, BigInt, etc.)
  const serializedData = {
    ...data,
    latestReadings: data.latestReadings.map((r: any) => ({
      ...r,
      dateTime: r.dateTime.toISOString(),
      createdAt: r.createdAt?.toISOString?.() || null,
      unixTime: Number(r.unixTime),
    })),
    recentAlerts: data.recentAlerts.map((a: any) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt?.toISOString?.() || null,
      resolvedAt: a.resolvedAt?.toISOString?.() || null,
    })),
  };

  return <DashboardContent data={serializedData} />;
}
