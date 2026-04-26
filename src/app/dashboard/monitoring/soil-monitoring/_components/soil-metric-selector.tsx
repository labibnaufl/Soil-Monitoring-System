"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOIL_METRICS, type SoilMetricKey } from "./soil-metrics";
import { Droplets, Thermometer, Zap, Beaker } from "lucide-react";

const iconMap: Record<SoilMetricKey, React.ComponentType<{ className?: string }>> = {
  soilMoisture: Droplets,
  soilTemperature: Thermometer,
  soilConductivity: Zap,
  phValue: Beaker,
};

interface SoilMetricSelectorProps {
  selectedMetric: SoilMetricKey;
  timeRange: string;
}

export function SoilMetricSelector({ selectedMetric, timeRange }: SoilMetricSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleMetricChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("metric", value);
    // Keep the current time range
    params.set("range", timeRange);
    router.push(`/dashboard/monitoring/soil-monitoring?${params.toString()}`);
  };

  const currentMetric = SOIL_METRICS[selectedMetric];
  const Icon = iconMap[selectedMetric];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border bg-card">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${currentMetric.color}20` }}
        >
          <Icon className="size-5" style={{ color: currentMetric.color }} />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Parameter Tanah</p>
          <p className="text-lg font-bold">{currentMetric.label}</p>
        </div>
      </div>

      <div className="sm:ml-auto">
        <Select value={selectedMetric} onValueChange={handleMetricChange}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Pilih parameter" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SOIL_METRICS) as SoilMetricKey[]).map((key) => {
              const metric = SOIL_METRICS[key];
              const MetricIcon = iconMap[key];
              return (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${metric.color}20` }}
                    >
                      <MetricIcon className="size-3.5" style={{ color: metric.color }} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{metric.label}</span>
                      <span className="text-xs text-muted-foreground">{metric.description}</span>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
