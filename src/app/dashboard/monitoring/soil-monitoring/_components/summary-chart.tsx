"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TrendUp } from "@/components/icons";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";
import { SOIL_METRICS, type SoilMetricKey } from "./soil-metrics";

interface SummaryChartProps {
  chartData: { station: string; fullName: string; average: number; readingCount: number }[];
  overallAverage: number;
  totalReadings: number;
  timeRange: string;
  selectedMetric: SoilMetricKey;
}

const rangeOptions = [
  { value: "week",  label: "7 Hari" },
  { value: "month", label: "30 Hari" },
  { value: "year",  label: "Tahun Ini" },
];

// Custom tooltip for station bar chart
function StationTooltip({ active, payload, unit }: {
  active?: boolean;
  payload?: { payload?: { fullName?: string; average?: number; readingCount?: number }; fill?: string }[];
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-slate-900">{data.fullName}</p>
      <p className="font-semibold" style={{ color: payload[0].fill }}>
        {data.average} {unit}
      </p>
      <p className="text-xs text-slate-500">{data.readingCount} pembacaan</p>
    </div>
  );
}

export function SummaryChart({
  chartData,
  overallAverage,
  totalReadings,
  timeRange,
  selectedMetric,
}: SummaryChartProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const metricConfig = SOIL_METRICS[selectedMetric];
  // Bar chart always uses the Suhu Tanah color for a consistent look
  // across metrics; the label still follows the selected metric.
  const barColor = SOIL_METRICS.soilTemperature.color;

  const handleRange = (value: string) => {
    const p = new URLSearchParams(searchParams);
    p.set("range", value);
    router.push(`/dashboard/monitoring/soil-monitoring?${p.toString()}`);
  };

  const handleMetricChange = (value: string) => {
    const p = new URLSearchParams(searchParams);
    p.set("metric", value);
    router.push(`/dashboard/monitoring/soil-monitoring?${p.toString()}`);
  };

  const currentLabel = rangeOptions.find((r) => r.value === timeRange)?.label ?? "7 Hari";

  const chartConfig = {
    average: {
      label: `${metricConfig.label} (${metricConfig.unit})`,
      color: barColor,
    },
  } satisfies ChartConfig;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between pb-2">
        <div>
          <CardTitle>Ringkasan {metricConfig.label}</CardTitle>
          <CardDescription>
            {currentLabel} · Rata-rata per stasiun
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 text-xs">
            {(Object.keys(SOIL_METRICS) as SoilMetricKey[]).map((key) => (
              <button
                key={key}
                onClick={() => handleMetricChange(key)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  selectedMetric === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {SOIL_METRICS[key].label}
              </button>
            ))}
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 text-xs">
            {rangeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleRange(opt.value)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  timeRange === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="h-50 w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="station"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              unit={` ${metricConfig.unit}`}
              width={65}
            />
            <Tooltip
              content={<StationTooltip unit={metricConfig.unit} />}
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
            />
            <Bar
              dataKey="average"
              fill={barColor}
              radius={[8, 8, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm pt-4">
        <div className="flex gap-2 leading-none font-medium" style={{ color: barColor }}>
          Rata-rata keseluruhan: {overallAverage} {metricConfig.unit}
          <TrendUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          {chartData.length} stasiun · {totalReadings.toLocaleString()} pembacaan
        </div>
      </CardFooter>
    </Card>
  );
}
