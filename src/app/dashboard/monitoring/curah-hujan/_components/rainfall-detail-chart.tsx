"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CartesianGrid, Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CloudRain } from "lucide-react";

interface StationDetailChartProps {
  chartData: { date: string; rainMeter: number }[];
  timeRange: string;
  stationId: string;
  totalReadings: number;
  rainyDaysCount: number;
}

const rangeOptions = [
  { value: "week",  label: "7 Hari" },
  { value: "month", label: "30 Hari" },
  { value: "year",  label: "Tahun Ini" },
];

const chartConfig = {
  rainMeter: {
    label: "Curah Hujan (mm)",
    color: "#0ea5e9", // sky-500
  },
} satisfies ChartConfig;

export function StationDetailChart({
  chartData,
  timeRange,
  stationId,
  totalReadings,
  rainyDaysCount,
}: StationDetailChartProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRange = (value: string) => {
    const p = new URLSearchParams(searchParams);
    p.set("range", value);
    router.push(`/dashboard/monitoring/curah-hujan/${stationId}?${p.toString()}`);
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      {/* Chart header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-sm font-semibold">Grafik Curah Hujan</p>
          <p className="text-xs text-muted-foreground mt-0.5">{totalReadings.toLocaleString()} pembacaan · {rainyDaysCount} hari hujan</p>
        </div>
        {/* Range tabs */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {rangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleRange(opt.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
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

      {chartData.length > 0 ? (
        <ChartContainer config={chartConfig} className="h-70 w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillRainMeter" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-rainMeter)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-rainMeter)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              unit=" mm"
            />
            <ChartTooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              content={<ChartTooltipContent />}
            />
            <Area
              type="monotone"
              dataKey="rainMeter"
              stroke="var(--color-rainMeter)"
              fill="url(#fillRainMeter)"
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--color-rainMeter)" }}
              activeDot={{ r: 6, fill: "var(--color-rainMeter)" }}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <div className="h-70 flex flex-col items-center justify-center text-muted-foreground gap-2">
          <CloudRain className="size-8 opacity-50" />
          <p className="text-sm">Tidak ada data curah hujan untuk periode ini</p>
          <p className="text-xs">Coba ubah rentang waktu</p>
        </div>
      )}
    </div>
  );
}
