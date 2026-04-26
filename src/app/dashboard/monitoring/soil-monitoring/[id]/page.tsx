import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { SoilDetailChart } from "../_components/soil-detail-chart";
import Link from "next/link";
import { ArrowLeft, MapPin, Cpu, Activity, Droplets, Thermometer, Zap, Beaker } from "lucide-react";
import { SOIL_METRICS, type SoilMetricKey } from "../_components/soil-metrics";

const iconMap: Record<SoilMetricKey, React.ComponentType<{ className?: string }>> = {
  soilMoisture: Droplets,
  soilTemperature: Thermometer,
  soilConductivity: Zap,
  phValue: Beaker,
};

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
    title: station ? `${station.name} — Tanah | NYAWIT` : "Stasiun | NYAWIT",
  };
}

export default async function StationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string; metric?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const sp = await searchParams;
  const timeRange = sp.range || "week";
  const selectedMetric = (sp.metric as SoilMetricKey) || "soilMoisture";
  const metricConfig = SOIL_METRICS[selectedMetric];

  // Role gate: ADMIN_LOCATION can only see their own station
  if (
    session.user.role !== "SUPER_ADMIN" &&
    session.user.stationId !== id
  ) {
    redirect("/dashboard/monitoring/soil-monitoring");
  }

  const now = new Date();
  const timeRangeMap: Record<string, Date> = {
    week:  new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    year:  new Date(now.getFullYear(), 0, 1),
  };
  const startDate = timeRangeMap[timeRange] ?? timeRangeMap.week;

  // Build the where clause for readings based on selected metric
  const readingWhere: Record<string, { not: null } | undefined> = {
    soilMoisture: { soilMoisture: { not: null } },
    soilTemperature: { soilTemperature: { not: null } },
    soilConductivity: { soilConductivity: { not: null } },
    phValue: { phValue: { not: null } },
  };

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
              ...readingWhere[selectedMetric],
            },
            select: {
              soilMoisture: true,
              soilTemperature: true,
              soilConductivity: true,
              phValue: true,
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
        soilMoisture: r.soilMoisture,
        soilTemperature: r.soilTemperature,
        soilConductivity: r.soilConductivity,
        phValue: r.phValue,
        dateTime: r.dateTime,
        battery: r.battery,
      }))
    )
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  const validReadings = allReadings.filter((r) => r[selectedMetric] !== null && r[selectedMetric] !== undefined);
  
  const values = validReadings.map((r) => r[selectedMetric] as number);
  const avg = values.length > 0 ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 : 0;
  const max = values.length > 0 ? Math.round(Math.max(...values) * 10) / 10 : 0;
  const min = values.length > 0 ? Math.round(Math.min(...values) * 10) / 10 : 0;
  const latest = validReadings.at(-1);

  // Group readings by day for chart
  const grouped = new Map<string, number[]>();
  validReadings.forEach((r) => {
    const key = r.dateTime.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r[selectedMetric] as number);
  });
  const chartData = Array.from(grouped.entries()).map(([date, vals]) => ({
    date,
    value: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
  }));

  // Get last values for all metrics
  const lastReading = validReadings.at(-1);
  const lastValues = {
    soilMoisture: lastReading?.soilMoisture ?? null,
    soilTemperature: lastReading?.soilTemperature ?? null,
    soilConductivity: lastReading?.soilConductivity ?? null,
    phValue: lastReading?.phValue ?? null,
  };

  const SelectedIcon = iconMap[selectedMetric];

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href={`/dashboard/monitoring/soil-monitoring?metric=${selectedMetric}`}
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

      {/* Metric selector pills */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(SOIL_METRICS) as SoilMetricKey[]).map((key) => {
          const metric = SOIL_METRICS[key];
          const MetricIcon = iconMap[key];
          const isActive = key === selectedMetric;
          const lastValue = lastValues[key];
          
          return (
            <Link
              key={key}
              href={`/dashboard/monitoring/soil-monitoring/${id}?metric=${key}&range=${timeRange}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <MetricIcon className="size-3.5" />
              <span>{metric.label}</span>
              {lastValue !== null && (
                <span className={`ml-1 px-1.5 py-0.5 rounded ${isActive ? "bg-background/20" : "bg-background"}`}>
                  {lastValue}{metric.unit}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Terkini", value: latest ? `${(latest[selectedMetric] as number).toFixed(1)}${metricConfig.unit}` : "—", sub: latest ? latest.dateTime.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "no data", color: metricConfig.color },
          { label: "Rata-rata", value: `${avg}${metricConfig.unit}`, sub: "periode dipilih", color: "text-foreground" },
          { label: "Tertinggi", value: `${max}${metricConfig.unit}`, sub: "periode dipilih", color: "text-orange-600" },
          { label: "Terendah",  value: `${min}${metricConfig.unit}`, sub: "periode dipilih", color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <p className="text-xl font-bold font-heading" style={{ color: s.color.startsWith("text-") ? undefined : s.color }} className={s.color.startsWith("text-") ? s.color : undefined}>{s.value}</p>
            <p className="text-xs font-medium text-foreground/70 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <SoilDetailChart
        chartData={chartData}
        timeRange={timeRange}
        stationId={id}
        totalReadings={validReadings.length}
        selectedMetric={selectedMetric}
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
