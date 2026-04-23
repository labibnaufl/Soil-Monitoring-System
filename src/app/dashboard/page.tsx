import { Metadata } from "next";
import { DashboardLayout } from "./_components/dashboard-layout";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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

  // Get latest readings via device → station relation
  // First get all devices for these stations
  const devices = await prisma.device.findMany({
    where: { stationId: { in: stationIds } },
    select: { id: true, stationId: true },
  });
  const deviceIds = devices.map((d) => d.id);

  // Get latest readings for these devices
  const latestReadings = await prisma.readings.findMany({
    where: { deviceId: { in: deviceIds } },
    orderBy: { dateTime: "desc" },
    take: 100, // Limit and deduplicate in app layer
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
  const openAlerts = await prisma.alert.count({
    where: {
      status: "OPEN",
      stationId: { in: stationIds },
    },
  });

  const criticalAlerts = await prisma.alert.count({
    where: {
      status: "OPEN",
      priority: "HIGH",
      stationId: { in: stationIds },
    },
  });

  const warningAlerts = await prisma.alert.count({
    where: {
      status: "OPEN",
      priority: "MEDIUM",
      stationId: { in: stationIds },
    },
  });

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
    openAlerts,
    criticalAlerts,
    warningAlerts,
    totalStations,
    activeStations,
    inactiveStations: totalStations - activeStations,
    recentAlerts,
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

  return (
    <div>
      {/* Dashboard content goes here */}
    </div>
  );
}
