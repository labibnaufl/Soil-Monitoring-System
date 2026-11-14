"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  MapPin,
  Cpu,
  Users,
  Bell,
  CheckCircle,
  CaretDown,
  Drop,
  CloudRain,
  Thermometer,
  Lightning,
  Heartbeat,
  TestTube,
} from "@phosphor-icons/react";
import Link from "next/link";
import {
  StatusBadge,
  getPriorityBadge,
  getPriorityDotClass,
  getStatusBadge,
  getStatusLabel,
} from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ───
interface RecentAlert {
  id: string;
  alertType: string;
  priority: string;
  status: string;
  message: string | null;
  createdAt: string;
  station: { name: string } | null;
}

interface DashboardData {
  chartBars: { station: string; fullName: string; average: number; readingCount: number }[];
  overallAverage: number;
  overallKind: "avg" | "total";
  totalReadings: number;
  newestReadingAt: string | null;
  stations: { id: string; name: string }[];
  peatByType: { type: string | null; count: number }[];
  activeMetric: MetricKey;
  activeRange: string | null;
  activeStation: string | null;
  resolvedAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  totalStations: number;
  activeStations: number;
  inactiveStations: number;
  recentAlerts: RecentAlert[];
  totalDevices: number;
  activeDevices: number;
  totalAdminLokasi: number;
}

// ─── Monitoring metric options ───
const METRIC_OPTIONS = [
  { value: "soilMoisture", label: "Kelembapan Tanah", unit: "%", icon: Drop, color: "var(--metric-moisture)" },
  { value: "soilTemperature", label: "Suhu Tanah", unit: "°C", icon: Thermometer, color: "var(--metric-temperature)" },
  { value: "waterLevel", label: "Tingkat Air", unit: "cm", icon: Heartbeat, color: "var(--metric-water)" },
  { value: "soilConductivity", label: "Konduktivitas", unit: "µS/cm", icon: Lightning, color: "var(--metric-conductivity)" },
  { value: "phValue", label: "Nilai pH", unit: "", icon: TestTube, color: "var(--metric-ph)" },
  { value: "rainMeter", label: "Curah Hujan", unit: "mm", icon: CloudRain, color: "var(--metric-rain)" },
] as const;

type MetricKey = typeof METRIC_OPTIONS[number]["value"];

// ─── Helpers ───
function getAlertTypeLabel(t: string) {
  switch (t) {
    case "SOIL_MOISTURE": return "Kelembapan Tanah";
    case "LOW_BATTERY": return "Baterai Rendah";
    case "PEATLAND_LIFESPAN": return "Masa Hidup Gambut";
    default: return t;
  }
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

// ─── Custom Tooltip ───
function ChartTooltip({ active, payload, label, unit }: {
  active?: boolean;
  payload?: { payload?: { fullName?: string }; value?: number | null }[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  const fullName = payload[0].payload?.fullName || label;
  return (
    <div className="bg-popover border border-border rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-popover-foreground">{fullName}</p>
      <p className="text-foreground font-semibold">
        {payload[0].value != null ? `${payload[0].value.toFixed(1)} ${unit}` : "N/A"}
      </p>
    </div>
  );
}

// ─── Main Component ───
const RANGE_OPTIONS = [
  { value: "", label: "Terkini" },
  { value: "week", label: "7 Hari" },
  { value: "month", label: "30 Hari" },
  { value: "year", label: "Tahun Ini" },
];

function rangeLabel(value: string | null): string {
  return RANGE_OPTIONS.find((o) => o.value === (value ?? ""))?.label ?? "";
}

export function DashboardContent({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentMetric = METRIC_OPTIONS.find((m) => m.value === data.activeMetric)!;
  const MetricIcon = currentMetric.icon;
  const chartData = data.chartBars.map((b) => ({
    name: b.station,
    value: b.average,
    fullName: b.fullName,
    readingCount: b.readingCount,
  }));
  const chartTop = chartData.reduce<typeof chartData[number] | null>(
    (top, p) => (!top || p.value > top.value ? p : top),
    null
  );
  const chartSummary =
    chartData.length > 0 && chartTop
      ? `Grafik ${currentMetric.label}: ${chartData.length} stasiun. Tertinggi ${chartTop.fullName} ${chartTop.value}${currentMetric.unit ? ` ${currentMetric.unit}` : ""}.`
      : "";

  // Controls write through to ?metric=&range=&station= so views stay shareable.
  const go = (patch: { metric?: string; range?: string | null; station?: string | null }) => {
    const params = new URLSearchParams();
    const metric = patch.metric ?? data.activeMetric;
    const range = patch.range !== undefined ? patch.range : data.activeRange;
    const station = patch.station !== undefined ? patch.station : data.activeStation;
    if (metric !== "soilMoisture") params.set("metric", metric);
    if (range) params.set("range", range);
    if (station) params.set("station", station);
    const qs = params.toString();
    router.push(`/dashboard${qs ? `?${qs}` : ""}`);
  };

  // Summary stats cards
  const statCards = [
    {
      label: "Stasiun Aktif",
      value: `${data.activeStations}/${data.totalStations}`,
      icon: MapPin,
      color: "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
      ringColor: "ring-[var(--status-success)]/10",
      description: `${data.inactiveStations} nonaktif`,
    },
    {
      label: "Perangkat Aktif",
      value: `${data.activeDevices}/${data.totalDevices}`,
      icon: Cpu,
      color: "bg-[var(--status-info-bg)] text-[var(--status-info-fg)]",
      ringColor: "ring-[var(--status-info)]/10",
      description: `${data.totalDevices - data.activeDevices} offline`,
    },
    {
      label: "Admin Lokasi",
      value: data.totalAdminLokasi,
      icon: Users,
      color: "bg-[var(--status-accent-bg)] text-[var(--status-accent-fg)]",
      ringColor: "ring-[var(--status-accent)]/10",
      description: "Pengguna aktif",
    },
  ];

  const peatCountByType = new Map(
    data.peatByType.map((p) => [p.type ?? "UNKNOWN", p.count])
  );
  const fibricCount = peatCountByType.get("FIBRIC") ?? 0;
  const hemicCount = peatCountByType.get("HEMIC") ?? 0;
  const sapricCount = peatCountByType.get("SAPRIC") ?? 0;
  const unknownPeatCount = peatCountByType.get("UNKNOWN") ?? 0;
  const totalPeatStations = fibricCount + hemicCount + sapricCount + unknownPeatCount;
  const peatDistribution = [
    {
      label: "Fibric",
      description: "Gambut mentah, serat tinggi",
      value: fibricCount,
      color: "text-[var(--status-success-fg)]",
      bg: "bg-[var(--status-success-bg)]",
      barColor: "bg-[var(--status-success)]",
      dotColor: "bg-[var(--status-success)]",
    },
    {
      label: "Hemic",
      description: "Gambut setengah matang",
      value: hemicCount,
      color: "text-[var(--status-warning-fg)]",
      bg: "bg-[var(--status-warning-bg)]",
      barColor: "bg-[var(--status-warning)]",
      dotColor: "bg-[var(--status-warning)]",
    },
    {
      label: "Sapric",
      description: "Gambut matang, serat rendah",
      value: sapricCount,
      color: "text-[var(--status-danger-fg)]",
      bg: "bg-[var(--status-danger-bg)]",
      barColor: "bg-[var(--status-danger)]",
      dotColor: "bg-[var(--status-danger)]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ringkasan kondisi terkini sistem monitoring gambut
        </p>
      </div>

      {/* ─── Main Grid: Chart + Stats Sidebar ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar Chart — takes 2 cols */}
        <div className="xl:col-span-2 rounded-xl border bg-card p-5">
          {/* Chart Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `color-mix(in oklab, ${currentMetric.color} 10%, transparent)` }}
              >
                <MetricIcon className="size-5" style={{ color: currentMetric.color }} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Monitoring Data
                </h2>
                <p className="text-xs text-muted-foreground">
                  {data.activeRange
                    ? data.activeMetric === "rainMeter"
                      ? `Akumulasi ${rangeLabel(data.activeRange)} per stasiun`
                      : `Rata-rata ${rangeLabel(data.activeRange)} per stasiun`
                    : data.activeMetric === "rainMeter"
                      ? "Akumulasi 24 jam terakhir per stasiun"
                      : "Pembacaan terbaru per stasiun"}
                  {data.newestReadingAt ? ` · Diperbarui ${timeAgo(data.newestReadingAt)}` : ""}
                </p>
              </div>
            </div>

            {/* Dropdown Selector */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg bg-background hover:bg-accent motion-safe:transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
              >
                <MetricIcon className="size-4" style={{ color: currentMetric.color }} />
                <span>{currentMetric.label}</span>
                <CaretDown className={`size-4 text-muted-foreground motion-safe:transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div role="listbox" aria-label="Pilih metrik" className="absolute right-0 top-full mt-1 z-50 w-56 bg-popover border border-border rounded-xl shadow-xl py-1 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-150">
                    {METRIC_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          role="option"
                          aria-selected={data.activeMetric === option.value}
                          onClick={() => {
                            go({ metric: option.value });
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted motion-safe:transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden ${
                            data.activeMetric === option.value ? "bg-muted font-medium" : ""
                          }`}
                        >
                          <span
                            className="p-1 rounded"
                            style={{ backgroundColor: `color-mix(in oklab, ${option.color} 10%, transparent)` }}
                          >
                            <Icon className="size-4" style={{ color: option.color }} />
                          </span>
                          <span>{option.label}</span>
                          {option.unit && (
                            <span className="ml-auto text-xs text-muted-foreground">{option.unit}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Range + station controls (URL-synced) */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 text-xs">
              {RANGE_OPTIONS.map((opt) => {
                const active = (data.activeRange ?? "") === opt.value;
                return (
                  <button
                    key={opt.value || "latest"}
                    onClick={() => go({ range: opt.value || null })}
                    className={`px-3 py-1 rounded-md font-medium motion-safe:transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden ${
                      active
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {data.stations.length > 0 && (
              <Select
                value={data.activeStation ?? "all"}
                onValueChange={(v) => go({ station: v === "all" ? null : v })}
              >
                <SelectTrigger className="w-full sm:w-[200px] h-8 text-xs">
                  <SelectValue placeholder="Semua stasiun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua stasiun</SelectItem>
                  {data.stations.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Chart */}
          {chartData.length > 0 ? (
            <div role="img" aria-label={chartSummary}>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="dashboardGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  unit={currentMetric.unit ? ` ${currentMetric.unit}` : ""}
                />
                <Tooltip content={<ChartTooltip unit={currentMetric.unit} />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={currentMetric.color}
                  fill="url(#dashboardGradient)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: currentMetric.color, strokeWidth: 2, stroke: "var(--background)" }}
                  activeDot={{ r: 6, fill: currentMetric.color, strokeWidth: 2, stroke: "var(--background)" }}
                />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground text-sm">
              {data.activeMetric === "rainMeter"
                ? `Tidak ada hujan ${data.activeRange ? `pada rentang ini` : `dalam 24 jam terakhir`}`
                : `Belum ada data untuk ${currentMetric.label}`}
            </div>
          )}
        </div>

        {/* Stats Sidebar — 1 col */}
        <div className="flex flex-col gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="flex flex-1 flex-col justify-center rounded-xl border bg-card p-5 ring-1 ring-transparent hover:ring-border motion-safe:transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg shrink-0 ${card.color}`}>
                  <card.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold font-heading text-foreground leading-none">
                    {card.value}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground mt-1.5">
                    {card.label}
                  </p>
                </div>
                <p className="ml-auto shrink-0 text-right text-xs text-muted-foreground leading-snug">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Notifications Section ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <div className="xl:col-span-2 rounded-xl border bg-card">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--status-warning-bg)]">
                <Bell weight="regular" className="size-5 text-[var(--status-warning-fg)]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Notifikasi Terbaru
                </h2>
                <p className="text-xs text-muted-foreground">
                  5 notifikasi terakhir
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/alerts"
              className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-accent motion-safe:transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            >
              Kelola
            </Link>
          </div>

          <div className="divide-y">
            {data.recentAlerts.length > 0 ? (
              data.recentAlerts.map((alert) => {
                const priorityBadge = getPriorityBadge(alert.priority);
                const statusBadge = getStatusBadge(alert.status);
                const typeLabel = getAlertTypeLabel(alert.alertType);
                const fallbackMessage = `Peringatan otomatis: ${typeLabel}${alert.station?.name ? ` — ${alert.station.name}` : ""}`;
                return (
                  <Link
                    key={alert.id}
                    href={`/dashboard/alerts?status=${alert.status}`}
                    aria-label={`Tindak lanjuti: ${typeLabel} — ${alert.station?.name ?? "semua stasiun"}`}
                    className="flex items-start gap-3 px-5 py-4 hover:bg-muted/30 motion-safe:transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                  >
                    <div aria-hidden="true" className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${getPriorityDotClass(priorityBadge.intent)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <StatusBadge intent={priorityBadge.intent} className="px-1.5 py-0.5 rounded text-[11px]">
                          {typeLabel}
                        </StatusBadge>
                        <StatusBadge intent={statusBadge.intent} className="text-[11px]">
                          {getStatusLabel(alert.status)}
                        </StatusBadge>
                      </div>
                      <p className="text-sm text-foreground truncate">
                        {alert.message || fallbackMessage}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {alert.station?.name || "—"} · {timeAgo(alert.createdAt)}
                      </p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="px-5 py-10 text-center text-muted-foreground text-sm">
                <CheckCircle weight="regular" className="size-5 mx-auto mb-2 text-[var(--status-success-fg)]" aria-hidden="true" />
                <p>Tidak ada notifikasi</p>
                <p className="text-xs mt-1">Semua sistem berjalan normal</p>
              </div>
            )}
          </div>
        </div>

        {/* Peat Land Type Distribution */}
        <div className="flex flex-col gap-4 xl:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Persebaran Jenis Lahan Gambut
            </h2>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            {peatDistribution.map((peat) => {
              const percentage = totalPeatStations > 0 ? Math.round((peat.value / totalPeatStations) * 100) : 0;
              return (
                <div
                  key={peat.label}
                  className="flex flex-1 flex-col justify-center rounded-xl border bg-card p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${peat.dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {peat.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {peat.description}
                      </p>
                    </div>
                    <span className={`text-2xl font-bold font-heading ${peat.color}`}>
                      {peat.value}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${peat.barColor} motion-safe:transition-all motion-safe:duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium w-9 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
