"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TrendingUp, Droplets, Calendar, MapPin } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, Bar, BarChart } from "recharts";
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
import { ResponsiveContainer } from "recharts";

interface StationData {
  id: string;
  name: string;
  provinsi: string;
  kabupaten: string;
  latitude: number;
  longitude: number;
  devices: {
    readings: {
      waterLevel: number | null;
      dateTime: Date;
    }[];
  }[];
}

interface WaterLevelChartProps {
  chartData: { period: string; average: number }[];
  overallAverage: number;
  totalReadings: number;
  stations: StationData[];
  startDate: Date;
  endDate: Date;
  timeRange: string;
}

const rangeOptions = [
  { value: "week", label: "Minggu Ini" },
  { value: "month", label: "Bulan Ini" },
  { value: "q1", label: "Q1 (Jan-Mar)" },
  { value: "q2", label: "Q2 (Apr-Jun)" },
  { value: "q3", label: "Q3 (Jul-Sep)" },
  { value: "q4", label: "Q4 (Okt-Des)" },
  { value: "year", label: "Tahun Ini" },
];

const summaryChartConfig = {
  average: {
    label: "Rata-rata (cm)",
    color: "#10b981", // emerald-500
  },
} satisfies ChartConfig;

const stationChartConfig = {
  waterLevel: {
    label: "Tingkat Air (cm)",
    color: "#10b981", // emerald-500
  },
} satisfies ChartConfig;

// Process readings for line chart
function getStationChartData(readings: { waterLevel: number | null; dateTime: Date }[]) {
  const validReadings = readings
    .filter((r): r is { waterLevel: number; dateTime: Date } => r.waterLevel !== null)
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  // Group by day for cleaner chart
  const groupedByDay = new Map<string, number[]>();
  validReadings.forEach((r) => {
    const dateKey = r.dateTime.toISOString().split("T")[0];
    if (!groupedByDay.has(dateKey)) {
      groupedByDay.set(dateKey, []);
    }
    groupedByDay.get(dateKey)?.push(r.waterLevel);
  });

  return Array.from(groupedByDay.entries()).map(([date, values]) => ({
    date: new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }),
    waterLevel: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
    fullDate: date,
  }));
}

export function WaterLevelChart({
  chartData,
  overallAverage,
  totalReadings,
  stations,
  startDate,
  endDate,
  timeRange,
}: WaterLevelChartProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("range", value);
    router.push(`/dashboard/monitoring/water-level?${params.toString()}`);
  };

  const currentLabel = rangeOptions.find((r) => r.value === timeRange)?.label || timeRange;

  // Calculate stats per station
  const stationStats = stations.map((station) => {
    const allReadings = station.devices.flatMap((d) => d.readings);
    const validReadings = allReadings.filter((r) => r.waterLevel !== null);
    const avgWaterLevel =
      validReadings.length > 0
        ? validReadings.reduce((sum, r) => sum + (r.waterLevel || 0), 0) / validReadings.length
        : 0;
    const maxWaterLevel =
      validReadings.length > 0
        ? Math.max(...validReadings.map((r) => r.waterLevel || 0))
        : 0;

    return {
      ...station,
      avgWaterLevel: Math.round(avgWaterLevel * 10) / 10,
      maxWaterLevel: Math.round(maxWaterLevel * 10) / 10,
      readingCount: validReadings.length,
      chartData: getStationChartData(allReadings),
    };
  });

  const selectedStationData = stationStats.find((s) => s.id === selectedStation);

  return (
    <div className="space-y-6">
      {/* Time Range Filter Dropdown */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">Periode:</span>
        <Select value={timeRange} onValueChange={handleRangeChange}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Pilih periode" />
          </SelectTrigger>
          <SelectContent>
            {rangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Tingkat Air</CardTitle>
          <CardDescription>
            {startDate.toLocaleDateString("id-ID")} -{" "}
            {endDate.toLocaleDateString("id-ID")} | {currentLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={summaryChartConfig}>
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="period"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="average"
                fill="var(--color-average)"
                radius={8}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 leading-none font-medium text-emerald-600">
            Rata-rata keseluruhan: {overallAverage} cm
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Menampilkan data dari {totalReadings.toLocaleString()} pembacaan sensor
          </div>
        </CardFooter>
      </Card>

      {/* Station Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Detail per Stasiun</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {stationStats.map((station) => {
            const isSelected = selectedStation === station.id;

            return (
              <Card
                key={station.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-emerald-500" : ""
                }`}
                onClick={() => setSelectedStation(isSelected ? null : station.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-start justify-between">
                    <span className="line-clamp-1">{station.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        station.avgWaterLevel > 50
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {station.avgWaterLevel} cm
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {station.kabupaten}, {station.provinsi}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Mini Line Chart */}
                  {station.chartData.length > 0 ? (
                    <div className="h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={station.chartData}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="date" tickLine={false} axisLine={false} hide />
                          <ChartTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-popover border rounded-lg px-2 py-1 text-xs shadow-lg">
                                    <p>{payload[0].payload.date}: {payload[0].payload.waterLevel} cm</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line
                            type="natural"
                            dataKey="waterLevel"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
                      Tidak ada data
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-emerald-600">{station.avgWaterLevel}</p>
                      <p className="text-[10px] text-muted-foreground">Rata-rata (cm)</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-blue-600">{station.maxWaterLevel}</p>
                      <p className="text-[10px] text-muted-foreground">Maks (cm)</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-amber-600">{station.readingCount}</p>
                      <p className="text-[10px] text-muted-foreground">Data</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Klik untuk detail lengkap
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Detailed View for Selected Station */}
      {selectedStationData && (
        <Card className="mt-6 border-emerald-200 bg-emerald-50/10">
          <CardHeader>
            <CardTitle className="text-lg">
              Detail: {selectedStationData.name}
            </CardTitle>
            <CardDescription>
              {selectedStationData.kabupaten}, {selectedStationData.provinsi} | Koordinat:{" "}
              {selectedStationData.latitude.toFixed(6)},{" "}
              {selectedStationData.longitude.toFixed(6)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={stationChartConfig} className="h-full">
                <LineChart
                  accessibilityLayer
                  data={selectedStationData.chartData}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Line
                    dataKey="waterLevel"
                    type="natural"
                    stroke="var(--color-waterLevel)"
                    strokeWidth={2}
                    dot={{
                      fill: "var(--color-waterLevel)",
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  />
                </LineChart>
              </ChartContainer>
            </div>

            <button
              onClick={() => setSelectedStation(null)}
              className="mt-4 px-4 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
            >
              Tutup Detail
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
