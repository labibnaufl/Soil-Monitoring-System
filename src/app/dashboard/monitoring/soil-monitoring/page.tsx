import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StationCard } from "./_components/station-card";
import { SummaryChart } from "./_components/summary-chart";
import { SOIL_METRICS } from "./_components/soil-metrics";
import { Cpu, Heartbeat } from "@/components/icons";

export const metadata: Metadata = {
  title: "Monitoring Tanah - NYAWIT",
  description: "Pemantauan kondisi tanah",
};

export default async function SoilMonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; metric?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const userStationId = session.user.stationId;

  const sp = await searchParams;
  const timeRange = sp.range || "week";
  const selectedMetric = (sp.metric as keyof typeof SOIL_METRICS) || "soilMoisture";
  const metricConfig = SOIL_METRICS[selectedMetric] || SOIL_METRICS.soilMoisture;

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

  // Build the where clause for readings based on selected metric
  const readingWhere: Record<string, any> = {
    soilMoisture: { soilMoisture: { not: null } },
    soilTemperature: { soilTemperature: { not: null } },
    soilConductivity: { soilConductivity: { not: null } },
    phValue: { phValue: { not: null } },
  };

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
                ...readingWhere[selectedMetric],
              },
              orderBy: { dateTime: "desc" },
              take: 100,
              select: {
                soilMoisture: true,
                soilTemperature: true,
                soilConductivity: true,
                phValue: true,
                dateTime: true,
              },
            },
          },
        },
      },
    }),
    // Summary chart data: DB-side per-device averages (one row per device,
    // not tens of thousands of readings shipped to the client).
    prisma.readings.groupBy({
      by: ["deviceId"],
      where: {
        dateTime: { gte: startDate },
        ...readingWhere[selectedMetric],
        ...(isSuperAdmin
          ? {}
          : { device: { stationId: userStationId ?? "__none__" } }),
      },
      _avg: {
        [selectedMetric]: true,
      } as {
        soilMoisture?: true;
        soilTemperature?: true;
        soilConductivity?: true;
        phValue?: true;
      },
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
    const avg = g._avg[selectedMetric] ?? null;
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
    const latestReadings = s.devices
      .flatMap((d) => d.readings)
      .filter((r) => r[selectedMetric] !== null && r[selectedMetric] !== undefined);
    
    const avgValue =
      latestReadings.length > 0
        ? Math.round(
            (latestReadings.reduce((sum, r) => sum + ((r[selectedMetric] as number) ?? 0), 0) / latestReadings.length) * 10
          ) / 10
        : 0;

    // Get last reading for each metric
    const lastReading = latestReadings[0];
    const lastValues = {
      soilMoisture: lastReading?.soilMoisture ?? null,
      soilTemperature: lastReading?.soilTemperature ?? null,
      soilConductivity: lastReading?.soilConductivity ?? null,
      phValue: lastReading?.phValue ?? null,
    };

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
      avgValue,
      readingCount: latestReadings.length,
      lastValues,
    };
  });

  const totalActiveDevices = stationCards.reduce((sum, s) => sum + s.deviceCount, 0);
  const totalActiveStations = stationCards.length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Monitoring Kondisi Tanah
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pemantauan parameter tanah — pilih stasiun untuk detail
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
            selectedMetric={selectedMetric}
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
        <div className="flex items-center justify-center h-48 rounded-xl border bg-card text-muted-foreground text-sm mb-6">
          Tidak ada stasiun aktif.
        </div>
      ) : (
        <div className="mb-6">
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
