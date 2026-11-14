"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SensorKey = "SM" | "ST" | "ph" | "SEC" | "WL" | "RR";

export const FORECAST_METRICS: {
  key: SensorKey;
  label: string;
  unit: string;
  color: string;
}[] = [
  { key: "SM", label: "Kelembaban Tanah", unit: "%", color: "#3b82f6" },
  { key: "ST", label: "Suhu Tanah", unit: "°C", color: "#f97316" },
  { key: "ph", label: "pH Tanah", unit: "", color: "#10b981" },
  { key: "SEC", label: "Konduktivitas", unit: "µS/cm", color: "#8b5cf6" },
  { key: "WL", label: "Tingkat Air", unit: "cm", color: "#0ea5e9" },
  { key: "RR", label: "Curah Hujan", unit: "mm", color: "#6366f1" },
];

export interface ForecastPoint {
  date_time: string;
  horizon_jam: number;
  sensors: Record<SensorKey, number | null>;
  classification: { status: string; alasan: string };
}

export function formatHour(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const BANNER_STYLES: Record<string, string> = {
  ready:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  stale_data:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  insufficient_history:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
};

export function AvailabilityBanner({
  availability,
  message,
  forecastOrigin,
  evaluationWarning,
}: {
  availability: string;
  message: string;
  forecastOrigin?: string | null;
  evaluationWarning?: string | null;
}) {
  const bannerClass =
    BANNER_STYLES[availability] ?? BANNER_STYLES.ready;
  return (
    <div className={`rounded-xl border p-4 text-sm ${bannerClass}`}>
      <p className="font-semibold">
        Status: {availability}
        {forecastOrigin ? ` · Origin ${formatHour(forecastOrigin)}` : ""}
      </p>
      <p className="mt-1">{message}</p>
      {evaluationWarning && (
        <p className="mt-1 opacity-80">{evaluationWarning}</p>
      )}
    </div>
  );
}

export function ForecastChart({
  points,
  defaultMetric = "SM",
  title,
  description,
  heightClass = "h-64",
}: {
  points: ForecastPoint[];
  defaultMetric?: SensorKey;
  title?: string;
  description?: string;
  heightClass?: string;
}) {
  const [metric, setMetric] = useState<SensorKey>(defaultMetric);
  const meta =
    FORECAST_METRICS.find((m) => m.key === metric) ?? FORECAST_METRICS[0];
  const chartConfig = {
    [metric]: {
      label: `${meta.label}${meta.unit ? ` (${meta.unit})` : ""}`,
      color: meta.color,
    },
  } satisfies ChartConfig;

  const chartData = points.map((p) => ({
    jam: formatHour(p.date_time),
    nilai: p.sensors[metric],
    status: p.classification.status,
  }));

  if (chartData.length === 0) return null;

  const top = chartData.reduce<typeof chartData[number] | null>(
    (best, p) => (p.nilai != null && (!best || (best.nilai ?? -Infinity) < p.nilai) ? p : best),
    null
  );
  const summary = `Prakiraan ${meta.label}: ${chartData.length} titik per jam.${top && top.nilai != null ? ` Tertinggi ${top.nilai} pada ${top.jam}.` : ""}`;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between pb-2">
        <div>
          <CardTitle>{title ?? `Prakiraan 24 Jam — ${meta.label}`}</CardTitle>
          <CardDescription>
            {description ?? `${chartData.length} titik · per jam dari origin`}
          </CardDescription>
        </div>
        <Select value={metric} onValueChange={(v) => setMetric(v as SensorKey)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORECAST_METRICS.map((m) => (
              <SelectItem key={m.key} value={m.key}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div role="img" aria-label={summary}>
        <ChartContainer config={chartConfig} className={`${heightClass} w-full`}>
          <LineChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="jam"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: 10 }}
              interval={3}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              width={56}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              dataKey="nilai"
              type="monotone"
              stroke={`var(--color-${metric})`}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
