import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StationCard } from "./_components/station-card";
import { SummaryChart } from "./_components/summary-chart";

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
  const [stations, allReadings] = await Promise.all([
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
    // Summary chart data
    prisma.readings.findMany({
      where: {
        dateTime: { gte: startDate },
        waterLevel: { not: null },
        ...(isSuperAdmin
          ? {}
          : { device: { stationId: userStationId ?? "__none__" } }),
      },
      select: { waterLevel: true, dateTime: true },
      orderBy: { dateTime: "asc" },
    }),
  ]);

  // Build summary chart data (per station average)
  const chartData = stations.map((s) => {
    const stationReadings = s.devices
      .flatMap((d) => d.readings)
      .filter((r) => r.waterLevel !== null);
    const avg =
      stationReadings.length > 0
        ? Math.round(
            (stationReadings.reduce((sum, r) => sum + (r.waterLevel as number), 0) / stationReadings.length) * 10
          ) / 10
        : 0;
    return {
      station: s.name.split(" ").pop() || s.name,
      fullName: s.name,
      average: avg,
      readingCount: stationReadings.length,
    };
  });

  const validReadings = allReadings.filter((r) => r.waterLevel !== null);
  const overallAverage =
    validReadings.length > 0
      ? Math.round(
          (validReadings.reduce((s, r) => s + (r.waterLevel as number), 0) / validReadings.length) * 10
        ) / 10
      : 0;

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
            totalReadings={validReadings.length}
            timeRange={timeRange}
          />
        </div>
        <div className="flex flex-col gap-4 lg:w-70 shrink-0">
          {/* Active Devices Card */}
          <div className="rounded-xl border bg-card p-5 flex flex-col justify-center h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground font-medium">Active Devices</p>
              <svg className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                <rect x="9" y="9" width="6" height="6"></rect>
                <line x1="9" y1="1" x2="9" y2="4"></line>
                <line x1="15" y1="1" x2="15" y2="4"></line>
                <line x1="9" y1="20" x2="9" y2="23"></line>
                <line x1="15" y1="20" x2="15" y2="23"></line>
                <line x1="20" y1="9" x2="23" y2="9"></line>
                <line x1="20" y1="14" x2="23" y2="14"></line>
                <line x1="1" y1="9" x2="4" y2="9"></line>
                <line x1="1" y1="14" x2="4" y2="14"></line>
              </svg>
            </div>
            <p className="text-3xl font-bold font-heading">{totalActiveDevices}</p>
          </div>

          {/* Location Points Card */}
          <div className="rounded-xl border bg-card p-5 flex flex-col justify-center h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground font-medium">Location Points</p>
              <svg className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
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
