"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CartesianGrid, Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface StationDetailChartProps {
  chartData: { date: string; waterLevel: number }[];
  timeRange: string;
  stationId: string;
  totalReadings: number;
}

const rangeOptions = [
  { value: "week",  label: "7 Hari" },
  { value: "month", label: "30 Hari" },
  { value: "year",  label: "Tahun Ini" },
];

const chartConfig = {
  waterLevel: {
    label: "Tingkat Air (cm)",
    color: "#3b82f6", // blue-500
  },
} satisfies ChartConfig;

export function StationDetailChart({
  chartData,
  timeRange,
  stationId,
  totalReadings,
}: StationDetailChartProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRange = (value: string) => {
    const p = new URLSearchParams(searchParams);
    p.set("range", value);
    router.push(`/dashboard/monitoring/water-level/${stationId}?${p.toString()}`);
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      {/* Chart header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-sm font-semibold">Grafik Tingkat Air</p>
          <p className="text-xs text-muted-foreground mt-0.5">{totalReadings.toLocaleString()} data · rata-rata harian</p>
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
              <linearGradient id="fillWaterLevel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-waterLevel)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-waterLevel)" stopOpacity={0.1} />
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
              unit=" cm"
            />
            <ChartTooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              content={<ChartTooltipContent />}
            />
            <Area
              type="monotone"
              dataKey="waterLevel"
              stroke="var(--color-waterLevel)"
              fill="url(#fillWaterLevel)"
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--color-waterLevel)" }}
              activeDot={{ r: 6, fill: "var(--color-waterLevel)" }}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <div className="h-70 flex flex-col items-center justify-center text-muted-foreground gap-2">
          <p className="text-sm">Tidak ada data untuk periode ini</p>
          <p className="text-xs">Coba ubah rentang waktu</p>
        </div>
      )}
    </div>
  );
}
