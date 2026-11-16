import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StationCard } from "./_components/station-card";
import { SummaryChart } from "./_components/summary-chart";
import { Cpu, Heartbeat } from "@/components/icons";

export const metadata: Metadata = {
  title: "Monitoring Tingkat Air - NYAWIT",
  description: "Pemantauan tingkat air tanah dan permukaan",
};

export default async function WaterLevelPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const userStationId = session.user.stationId;

  const sp = await searchParams;
  const timeRange = sp.range || "week";

  const now = new Date();
  const startDateMap: Record<string, Date> = {
    week:  new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    year:  new Date(now.getFullYear(), 0, 1),
  };
  const startDate = startDateMap[timeRange] ?? startDateMap.week;

  const stationWhere = isSuperAdmin
    ? { status: "AKTIF" as const }
    : { status: "AKTIF" as const, id: userStationId ?? "__none__" };

  // Run both queries in parallel
  const [stations, deviceAvgs] = await Promise.all([
    prisma.station.findMany({
      where: stationWhere,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        provinsi: true,
        kabupaten: true,
        _count: { select: { devices: true } },
        alerts: {
          where: { status: { in: ["OPEN", "PENDING", "IN_PROGRESS"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { priority: true, alertType: true, createdAt: true },
        },
        devices: {
          select: {
            id: true,
            readings: {
              where: {
                dateTime: { gte: startDate },
                waterLevel: { not: null },
              },
              orderBy: { dateTime: "desc" },
              take: 100,
              select: { waterLevel: true, dateTime: true },
            },
          },
        },
      },
    }),
    // Summary numbers: DB-side per-device averages (one row per device,
    // not tens of thousands of readings shipped to the client).
    prisma.readings.groupBy({
      by: ["deviceId"],
      where: {
        dateTime: { gte: startDate },
        waterLevel: { not: null },
        ...(isSuperAdmin
          ? {}
          : { device: { stationId: userStationId ?? "__none__" } }),
      },
      _avg: { waterLevel: true },
      _count: { _all: true },
    }),
  ]);

  const deviceStation = new Map<string, string>();
  for (const s of stations) {
    for (const d of s.devices) deviceStation.set(d.id, s.id);
  }
  const stationAgg = new Map<string, { sum: number; count: number }>();
  let grandSum = 0;
  let grandCount = 0;
  for (const g of deviceAvgs) {
    const avg = g._avg.waterLevel ?? null;
    const stationId = deviceStation.get(g.deviceId);
    if (avg == null || !stationId) continue;
    const entry = stationAgg.get(stationId) ?? { sum: 0, count: 0 };
    entry.sum += avg * g._count._all;
    entry.count += g._count._all;
    stationAgg.set(stationId, entry);
    grandSum += avg * g._count._all;
    grandCount += g._count._all;
  }

  // Build summary chart data (per station average)
  const chartData = stations.map((s) => {
    const agg = stationAgg.get(s.id);
    const avg =
      agg && agg.count > 0 ? Math.round((agg.sum / agg.count) * 10) / 10 : 0;
    return {
      station: s.name.split(" ").pop() || s.name,
      fullName: s.name,
      average: avg,
      readingCount: agg?.count ?? 0,
    };
  });

  const overallAverage =
    grandCount > 0 ? Math.round((grandSum / grandCount) * 10) / 10 : 0;

  // Build station cards
  const stationCards = stations.map((s) => {
    const latestAlert = s.alerts[0] ?? null;
    const latestReadings = s.devices.flatMap((d) => d.readings).filter((r) => r.waterLevel !== null);
    const avgWaterLevel =
      latestReadings.length > 0
        ? Math.round(
            (latestReadings.reduce((sum, r) => sum + (r.waterLevel ?? 0), 0) / latestReadings.length) * 10
          ) / 10
        : 0;

    return {
      id: s.id,
      name: s.name,
      provinsi: s.provinsi,
      kabupaten: s.kabupaten,
      deviceCount: s._count.devices,
      wtpCount: 1,
      latestAlertPriority: latestAlert?.priority ?? null,
      latestAlertType: latestAlert?.alertType ?? null,
      latestAlertDate: latestAlert?.createdAt ?? null,
      avgWaterLevel,
      readingCount: latestReadings.length,
    };
  });

  const totalActiveDevices = stationCards.reduce((sum, s) => sum + s.deviceCount, 0);
  const totalActiveStations = stationCards.length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Monitoring Tingkat Air
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pemantauan kedalaman air tanah dan permukaan air — pilih stasiun untuk detail
        </p>
      </div>

      {/* Top Section: Chart and Stats */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <SummaryChart
            chartData={chartData}
            overallAverage={overallAverage}
            totalReadings={grandCount}
            timeRange={timeRange}
          />
        </div>
        <div className="flex flex-col gap-4 lg:w-70 shrink-0">
          {/* Active Devices Card */}
          <div className="rounded-xl border bg-card p-5 flex flex-col justify-center h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground font-medium">Active Devices</p>
              <Cpu weight="regular" className="size-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-3xl font-bold font-heading">{totalActiveDevices}</p>
          </div>

          {/* Location Points Card */}
          <div className="rounded-xl border bg-card p-5 flex flex-col justify-center h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground font-medium">Location Points</p>
              <Heartbeat weight="regular" className="size-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-3xl font-bold font-heading">{totalActiveStations}</p>
          </div>
        </div>
      </div>

      {/* Station card grid */}
      {stationCards.length === 0 ? (
        <div className="flex items-center justify-center h-48 rounded-xl border bg-card text-muted-foreground text-sm">
          Tidak ada stasiun aktif.
        </div>
      ) : (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3">
            {stationCards.length} stasiun aktif
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stationCards.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
