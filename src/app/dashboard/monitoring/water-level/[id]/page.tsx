import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { StationDetailChart } from "../_components/station-detail-chart";
import Link from "next/link";
import { ArrowLeft, MapPin, Cpu, Activity, Droplets } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const station = await prisma.station.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: station ? `${station.name} — Tingkat Air | NYAWIT` : "Stasiun | NYAWIT",
  };
}

export default async function StationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const sp = await searchParams;
  const timeRange = sp.range || "week";

  // Role gate: ADMIN_LOCATION can only see their own station
  if (
    session.user.role !== "SUPER_ADMIN" &&
    session.user.stationId !== id
  ) {
    redirect("/dashboard/monitoring/water-level");
  }

  const now = new Date();
  const timeRangeMap: Record<string, Date> = {
    week:  new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    year:  new Date(now.getFullYear(), 0, 1),
  };
  const startDate = timeRangeMap[timeRange] ?? timeRangeMap.week;

  const station = await prisma.station.findUnique({
    where: { id },
    include: {
      _count: { select: { devices: true } },
      alerts: {
        where: { status: { in: ["OPEN", "PENDING", "IN_PROGRESS"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          priority: true,
          alertType: true,
          status: true,
          message: true,
          createdAt: true,
        },
      },
      devices: {
        include: {
          readings: {
            where: {
              dateTime: { gte: startDate },
              waterLevel: { not: null },
            },
            select: {
              waterLevel: true,
              dateTime: true,
              battery: true,
            },
            orderBy: { dateTime: "asc" },
          },
        },
      },
    },
  });

  if (!station) notFound();

  // Flatten readings from all devices
  const allReadings = station.devices
    .flatMap((d) =>
      d.readings.map((r) => ({
        waterLevel: r.waterLevel as number,
        dateTime: r.dateTime,
        battery: r.battery,
      }))
    )
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  const validReadings = allReadings.filter((r) => r.waterLevel !== null);
  const avg =
    validReadings.length > 0
      ? Math.round(
          (validReadings.reduce((s, r) => s + r.waterLevel, 0) / validReadings.length) * 10
        ) / 10
      : 0;
  const max =
    validReadings.length > 0
      ? Math.round(Math.max(...validReadings.map((r) => r.waterLevel)) * 10) / 10
      : 0;
  const min =
    validReadings.length > 0
      ? Math.round(Math.min(...validReadings.map((r) => r.waterLevel)) * 10) / 10
      : 0;
  const latest = validReadings.at(-1);

  // Group readings by day for chart
  const grouped = new Map<string, number[]>();
  validReadings.forEach((r) => {
    const key = r.dateTime.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r.waterLevel);
  });
  const chartData = Array.from(grouped.entries()).map(([date, vals]) => ({
    date,
    waterLevel:
      Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
  }));

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/dashboard/monitoring/water-level"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Semua Stasiun
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">{station.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {station.kabupaten}, {station.provinsi}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full">
              <Cpu className="size-3" /> {station._count.devices} perangkat
            </span>
            {station.alerts.length > 0 && (
              <span className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-medium">
                <Activity className="size-3" /> {station.alerts.length} alert aktif
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Terkini", value: latest ? `${latest.waterLevel} cm` : "—", sub: latest ? latest.dateTime.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "no data", color: "text-blue-600" },
          { label: "Rata-rata", value: `${avg} cm`, sub: "periode dipilih", color: "text-foreground" },
          { label: "Tertinggi", value: `${max} cm`, sub: "periode dipilih", color: "text-orange-600" },
          { label: "Terendah",  value: `${min} cm`, sub: "periode dipilih", color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <p className={`text-xl font-bold font-heading ${s.color}`}>{s.value}</p>
            <p className="text-xs font-medium text-foreground/70 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <StationDetailChart
        chartData={chartData}
        timeRange={timeRange}
        stationId={id}
        totalReadings={validReadings.length}
      />

      {/* Active alerts */}
      {station.alerts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Alert Aktif</h2>
          <div className="space-y-2">
            {station.alerts.map((alert) => {
              const priorityColor =
                alert.priority === "HIGH"
                  ? "border-red-200 bg-red-50/50"
                  : alert.priority === "MEDIUM"
                  ? "border-orange-200 bg-orange-50/50"
                  : "border-green-200 bg-green-50/50";
              const priorityText =
                alert.priority === "HIGH"
                  ? "text-red-600"
                  : alert.priority === "MEDIUM"
                  ? "text-orange-600"
                  : "text-green-600";
              return (
                <div key={alert.id} className={`rounded-lg border p-3 ${priorityColor}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-xs font-semibold ${priorityText}`}>
                        {alert.priority} · {alert.alertType.replace(/_/g, " ")}
                      </p>
                      {alert.message && (
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {alert.createdAt.toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
