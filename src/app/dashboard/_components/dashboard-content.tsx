"use client";

import { useState } from "react";
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
  CheckCircle2,
  ChevronDown,
  TrendingUp,
  Droplets,
  Thermometer,
  Zap,
  Activity,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───
interface Reading {
  id: string;
  deviceId: string;
  dateTime: string;
  waterLevel: number | null;
  rainMeter: number | null;
  soilMoisture: number | null;
  soilTemperature: number | null;
  soilConductivity: number | null;
  phValue: number | null;
  battery: number | null;
  device: {
    deviceName: string;
    status: string;
    station: { name: string } | null;
  };
}

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
  latestReadings: Reading[];
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
  { value: "soilMoisture", label: "Kelembapan Tanah", unit: "%", icon: Droplets, color: "#10b981" },
  { value: "soilTemperature", label: "Suhu Tanah", unit: "°C", icon: Thermometer, color: "#f59e0b" },
  { value: "waterLevel", label: "Tingkat Air", unit: "cm", icon: Activity, color: "#3b82f6" },
  { value: "soilConductivity", label: "Konduktivitas", unit: "µS/cm", icon: Zap, color: "#8b5cf6" },
  { value: "phValue", label: "Nilai pH", unit: "", icon: TrendingUp, color: "#ef4444" },
  { value: "rainMeter", label: "Curah Hujan", unit: "mm", icon: Droplets, color: "#06b6d4" },
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

function getPriorityStyle(p: string) {
  switch (p) {
    case "HIGH": return { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" };
    case "MEDIUM": return { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" };
    case "LOW": return { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" };
    default: return { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
  }
}

function getStatusLabel(s: string) {
  switch (s) {
    case "OPEN": return "Baru";
    case "PENDING": return "Pending";
    case "IN_PROGRESS": return "Proses";
    case "RESOLVED": return "Selesai";
    default: return s;
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
function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-slate-900">{label}</p>
      <p className="text-emerald-600 font-semibold">
        {payload[0].value != null ? `${payload[0].value.toFixed(1)} ${unit}` : "N/A"}
      </p>
    </div>
  );
}

// ─── Main Component ───
export function DashboardContent({ data }: { data: DashboardData }) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("soilMoisture");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentMetric = METRIC_OPTIONS.find((m) => m.value === selectedMetric)!;
  const MetricIcon = currentMetric.icon;

  // Build chart data from latest readings
  const chartData = data.latestReadings
    .filter((r) => r[selectedMetric] != null)
    .map((r) => ({
      name: r.device?.station?.name
        ? (r.device.station.name.split(" ").pop() || r.device.station.name)
        : r.device?.deviceName || "Unknown",
      value: r[selectedMetric] as number,
      fullName: r.device?.station?.name || r.device?.deviceName || "Unknown",
      device: r.device?.deviceName || "Unknown",
    }))
    .slice(0, 10);

  // Summary stats cards
  const statCards = [
    {
      label: "Stasiun Aktif",
      value: `${data.activeStations}/${data.totalStations}`,
      icon: MapPin,
      color: "bg-emerald-50 text-emerald-600",
      ringColor: "ring-emerald-500/10",
      description: `${data.inactiveStations} nonaktif`,
    },
    {
      label: "Perangkat Aktif",
      value: `${data.activeDevices}/${data.totalDevices}`,
      icon: Cpu,
      color: "bg-blue-50 text-blue-600",
      ringColor: "ring-blue-500/10",
      description: `${data.totalDevices - data.activeDevices} offline`,
    },
    {
      label: "Admin Lokasi",
      value: data.totalAdminLokasi,
      icon: Users,
      color: "bg-violet-50 text-violet-600",
      ringColor: "ring-violet-500/10",
      description: "Pengguna aktif",
    },
  ];

  // Peat land type distribution (front-end slicing)
  const totalPeatStations = data.totalStations + 7; // include mock stations
  const peatDistribution = [
    {
      label: "Fibric",
      description: "Gambut mentah, serat tinggi",
      value: Math.round(totalPeatStations * 0.35) || 3,
      color: "text-teal-600",
      bg: "bg-teal-50",
      barColor: "bg-teal-500",
      dotColor: "bg-teal-500",
    },
    {
      label: "Hemic",
      description: "Gambut setengah matang",
      value: Math.round(totalPeatStations * 0.4) || 4,
      color: "text-amber-600",
      bg: "bg-amber-50",
      barColor: "bg-amber-500",
      dotColor: "bg-amber-500",
    },
    {
      label: "Sapric",
      description: "Gambut matang, serat rendah",
      value: totalPeatStations - (Math.round(totalPeatStations * 0.35) || 3) - (Math.round(totalPeatStations * 0.4) || 4),
      color: "text-rose-800",
      bg: "bg-rose-50",
      barColor: "bg-rose-800",
      dotColor: "bg-rose-800",
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg`} style={{ backgroundColor: currentMetric.color + "15" }}>
                <MetricIcon className="size-5" style={{ color: currentMetric.color }} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Monitoring Data
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pembacaan terbaru per stasiun
                </p>
              </div>
            </div>

            {/* Dropdown Selector */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg bg-background hover:bg-accent transition-colors"
              >
                <MetricIcon className="size-4" style={{ color: currentMetric.color }} />
                <span>{currentMetric.label}</span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white border rounded-xl shadow-lg py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {METRIC_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSelectedMetric(option.value);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors ${
                            selectedMetric === option.value ? "bg-slate-50 font-medium" : ""
                          }`}
                        >
                          <Icon className="size-4" style={{ color: option.color }} />
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

          {/* Chart */}
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="dashboardGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  unit={currentMetric.unit ? ` ${currentMetric.unit}` : ""}
                />
                <Tooltip content={<ChartTooltip unit={currentMetric.unit} />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={currentMetric.color}
                  fill="url(#dashboardGradient)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: currentMetric.color, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, fill: currentMetric.color, strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80 text-muted-foreground text-sm">
              Belum ada data untuk {currentMetric.label}
            </div>
          )}
        </div>

        {/* Stats Sidebar — 1 col */}
        <div className="space-y-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border bg-card p-5 ring-1 ring-transparent hover:ring-slate-200 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-lg ${card.color}`}>
                  <card.icon className="size-5" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </p>
              </div>
              <p className="text-3xl font-bold font-heading text-foreground">
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
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
              <div className="p-2 rounded-lg bg-amber-50">
                <Bell className="size-5 text-amber-600" />
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
              className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-accent transition-colors"
            >
              Kelola
            </Link>
          </div>

          <div className="divide-y">
            {data.recentAlerts.length > 0 ? (
              data.recentAlerts.map((alert) => {
                const priority = getPriorityStyle(alert.priority);
                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${priority.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${priority.bg} ${priority.text}`}>
                          {getAlertTypeLabel(alert.alertType)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {getStatusLabel(alert.status)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground truncate">
                        {alert.message || "Tidak ada pesan"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {alert.station?.name || "—"} · {timeAgo(alert.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-10 text-center text-muted-foreground text-sm">
                <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-400" />
                <p>Tidak ada notifikasi</p>
                <p className="text-xs mt-1">Semua sistem berjalan normal</p>
              </div>
            )}
          </div>
        </div>

        {/* Peat Land Type Distribution */}
        <div className="xl:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Persebaran Jenis Lahan Gambut
            </h2>
          </div>
          <div className="space-y-3">
            {peatDistribution.map((peat) => {
              const percentage = totalPeatStations > 0 ? Math.round((peat.value / totalPeatStations) * 100) : 0;
              return (
                <div
                  key={peat.label}
                  className="rounded-xl border bg-card p-4"
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
                        className={`h-full rounded-full ${peat.barColor} transition-all duration-500`}
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
