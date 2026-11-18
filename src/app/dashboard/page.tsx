import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardContent } from "./_components/dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard - NYAWIT",
  description: "Dashboard monitoring sistem gambut",
};

const METRIC_KEYS = [
  "soilMoisture",
  "soilTemperature",
  "waterLevel",
  "soilConductivity",
  "phValue",
  "rainMeter",
] as const;

type MetricKey = (typeof METRIC_KEYS)[number];

const RANGE_KEYS = ["week", "month", "year"] as const;

function getStartDate(range: string): Date {
  const now = new Date();
  if (range === "month") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (range === "year") return new Date(now.getFullYear(), 0, 1);
  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
}

async function deviceAverages(
  metric: Exclude<MetricKey, "rainMeter">,
  deviceIds: string[],
  startDate: Date
): Promise<{ deviceId: string; avg: number | null; count: number }[]> {
  switch (metric) {
    case "soilMoisture":
      return (await prisma.readings.groupBy({ by: ["deviceId"], where: { deviceId: { in: deviceIds }, dateTime: { gte: startDate }, soilMoisture: { not: null } }, _avg: { soilMoisture: true }, _count: { _all: true } })).map((g) => ({ deviceId: g.deviceId, avg: g._avg.soilMoisture, count: g._count._all }));
    case "soilTemperature":
      return (await prisma.readings.groupBy({ by: ["deviceId"], where: { deviceId: { in: deviceIds }, dateTime: { gte: startDate }, soilTemperature: { not: null } }, _avg: { soilTemperature: true }, _count: { _all: true } })).map((g) => ({ deviceId: g.deviceId, avg: g._avg.soilTemperature, count: g._count._all }));
    case "waterLevel":
      return (await prisma.readings.groupBy({ by: ["deviceId"], where: { deviceId: { in: deviceIds }, dateTime: { gte: startDate }, waterLevel: { not: null } }, _avg: { waterLevel: true }, _count: { _all: true } })).map((g) => ({ deviceId: g.deviceId, avg: g._avg.waterLevel, count: g._count._all }));
    case "soilConductivity":
      return (await prisma.readings.groupBy({ by: ["deviceId"], where: { deviceId: { in: deviceIds }, dateTime: { gte: startDate }, soilConductivity: { not: null } }, _avg: { soilConductivity: true }, _count: { _all: true } })).map((g) => ({ deviceId: g.deviceId, avg: g._avg.soilConductivity, count: g._count._all }));
    case "phValue":
      return (await prisma.readings.groupBy({ by: ["deviceId"], where: { deviceId: { in: deviceIds }, dateTime: { gte: startDate }, phValue: { not: null } }, _avg: { phValue: true }, _count: { _all: true } })).map((g) => ({ deviceId: g.deviceId, avg: g._avg.phValue, count: g._count._all }));
  }
}

async function getDashboardData(opts: {
  metric: MetricKey;
  range: string | null;
  stationId: string | null;
  isSuperAdmin: boolean;
  userStationId: string | null;
}) {
  const { metric, range, isSuperAdmin, userStationId } = opts;

  // Station scope: admin lokasi is locked to their station; super admin
  // may narrow via ?station= (validated), otherwise sees all.
  let stationIds: string[];
  let stations: { id: string; name: string }[];
  if (isSuperAdmin) {
    stations = await prisma.station.findMany({
      where: { status: "AKTIF" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    stationIds =
      opts.stationId && stations.some((s) => s.id === opts.stationId)
        ? [opts.stationId]
        : stations.map((s) => s.id);
  } else if (userStationId) {
    stations = [];
    stationIds = [userStationId];
  } else {
    stations = [];
    stationIds = [];
  }

  const devices = await prisma.device.findMany({
    where: { stationId: { in: stationIds } },
    select: { id: true, stationId: true, status: true },
  });
  const deviceIds = devices.map((d) => d.id);
  const deviceStation = new Map(devices.map((d) => [d.id, d.stationId] as const));

  const totalDevices = devices.length;
  const activeDevices = devices.filter((d) => d.status === "BEROPERASI").length;

  const newest = await prisma.readings.findFirst({
    where: { deviceId: { in: deviceIds } },
    orderBy: { dateTime: "desc" },
    select: { dateTime: true },
  });

  // Chart bars: DB-side per-station aggregation (never ship raw rows).
  const stationNameById = new Map(stations.map((s) => [s.id, s.name] as const));
  let chartBars: { station: string; fullName: string; average: number; readingCount: number }[] = [];
  let overallAverage = 0;
  let totalReadings = 0;
  let overallKind: "avg" | "total" = "avg";

  if (metric === "rainMeter") {
    const since = range ? getStartDate(range) : new Date(Date.now() - 24 * 3600 * 1000);
    const rows = await prisma.readings.findMany({
      where: { deviceId: { in: deviceIds }, dateTime: { gte: since }, rainMeter: { gt: 0 } },
      select: {
        rainMeter: true,
        device: { select: { station: { select: { name: true } } } },
      },
    });
    const byStation = new Map<string, { sum: number; count: number }>();
    for (const row of rows) {
      const name = row.device?.station?.name;
      if (!name || row.rainMeter == null) continue;
      const entry = byStation.get(name) ?? { sum: 0, count: 0 };
      entry.sum += row.rainMeter;
      entry.count += 1;
      byStation.set(name, entry);
    }
    chartBars = [...byStation.entries()]
      .map(([fullName, a]) => ({
        station: fullName.split(" ").pop() || fullName,
        fullName,
        average: Math.round(a.sum * 10) / 10,
        readingCount: a.count,
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
    overallAverage =
      Math.round([...byStation.values()].reduce((s, a) => s + a.sum, 0) * 10) / 10;
    totalReadings = rows.length;
    overallKind = "total";
  } else if (!range) {
    const latest = await prisma.readings.findMany({
      where: { deviceId: { in: deviceIds } },
      orderBy: { dateTime: "desc" },
      take: 100,
      include: {
        device: {
          select: { deviceName: true, status: true, station: { select: { name: true } } },
        },
      },
    });
    const seen = new Set<string>();
    const agg = new Map<string, { sum: number; count: number }>();
    for (const r of latest) {
      if (seen.has(r.deviceId)) continue;
      seen.add(r.deviceId);
      const v = r[metric];
      const name = r.device?.station?.name;
      if (typeof v !== "number" || !name) continue;
      const entry = agg.get(name) ?? { sum: 0, count: 0 };
      entry.sum += v;
      entry.count += 1;
      agg.set(name, entry);
    }
    chartBars = [...agg.entries()]
      .map(([fullName, a]) => ({
        station: fullName.split(" ").pop() || fullName,
        fullName,
        average: Math.round((a.sum / a.count) * 10) / 10,
        readingCount: a.count,
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
    const total = [...agg.values()].reduce((s, a) => s + a.sum, 0);
    const count = [...agg.values()].reduce((s, a) => s + a.count, 0);
    overallAverage = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
    totalReadings = count;
  } else {
    const groups = await deviceAverages(metric, deviceIds, getStartDate(range));
    const agg = new Map<string, { sum: number; count: number }>();
    for (const g of groups) {
      const stationId = deviceStation.get(g.deviceId);
      if (g.avg == null || !stationId) continue;
      const entry = agg.get(stationId) ?? { sum: 0, count: 0 };
      entry.sum += g.avg * g.count;
      entry.count += g.count;
      agg.set(stationId, entry);
    }
    // Station names for range mode (admin lokasi has no stations list).
    const names = new Map<string, string>(stationNameById);
    if (names.size === 0 && userStationId) {
      const s = await prisma.station.findUnique({
        where: { id: userStationId },
        select: { name: true },
      });
      if (s) names.set(userStationId, s.name);
    }
    chartBars = [...agg.entries()]
      .map(([sid, a]) => {
        const fullName = names.get(sid) ?? sid;
        return {
          station: fullName.split(" ").pop() || fullName,
          fullName,
          average: Math.round((a.sum / a.count) * 10) / 10,
          readingCount: a.count,
        };
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
    const total = [...agg.values()].reduce((s, a) => s + a.sum, 0);
    const count = [...agg.values()].reduce((s, a) => s + a.count, 0);
    overallAverage = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
    totalReadings = count;
  }

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

  // Real peat-type distribution for stations in scope
  const peatGroups = await prisma.station.groupBy({
    by: ["peatType"],
    where: { id: { in: stationIds } },
    _count: { _all: true },
  });
  const peatByType = peatGroups.map((g) => ({
    type: g.peatType,
    count: g._count._all,
  }));

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
    chartBars,
    overallAverage,
    overallKind,
    totalReadings,
    newestReadingAt: newest?.dateTime.toISOString() ?? null,
    stations,
    peatByType,
    activeMetric: metric,
    activeRange: range,
    activeStation: isSuperAdmin ? opts.stationId ?? null : null,
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ metric?: string; range?: string; station?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const sp = await searchParams;
  const metric: MetricKey = (METRIC_KEYS as readonly string[]).includes(sp.metric ?? "")
    ? (sp.metric as MetricKey)
    : "soilMoisture";
  const range = (RANGE_KEYS as readonly string[]).includes(sp.range ?? "") ? (sp.range as string) : null;

  const data = await getDashboardData({
    metric,
    range,
    stationId: sp.station || null,
    isSuperAdmin,
    userStationId: session.user.stationId,
  });

  // Serialize for client component (dates, BigInt, etc.)
  type RecentAlertRow = Awaited<ReturnType<typeof getDashboardData>>["recentAlerts"][number];
  const serializedData = {
    ...data,
    recentAlerts: data.recentAlerts.map((a: RecentAlertRow) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt?.toISOString?.() || null,
      resolvedAt: a.resolvedAt?.toISOString?.() || null,
    })),
  };

  return <DashboardContent data={serializedData} />;
}
