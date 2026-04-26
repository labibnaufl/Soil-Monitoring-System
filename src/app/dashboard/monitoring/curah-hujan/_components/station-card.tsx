"use client";

import Link from "next/link";
import { Cpu, MapPin, AlertTriangle, Activity, CheckCircle2, CloudRain, Calendar } from "lucide-react";

interface StationCardProps {
  station: {
    id: string;
    name: string;
    provinsi: string;
    kabupaten: string;
    deviceCount: number;
    wtpCount: number;
    latestAlertPriority: string | null;
    totalRain: number;
    rainyDaysCount: number;
    latestAlertType: string | null;
    latestAlertDate: Date | null;
  };
}

function AlertBadge({ priority }: { priority: string | null }) {
  if (!priority) return null;
  const config: Record<string, { label: string; className: string }> = {
    HIGH:   { label: "urgent",  className: "bg-red-50 text-red-600 border border-red-200" },
    MEDIUM: { label: "medium",  className: "bg-orange-50 text-orange-600 border border-orange-200" },
    LOW:    { label: "low",     className: "bg-green-50 text-green-600 border border-green-200" },
  };
  const c = config[priority] ?? { label: priority.toLowerCase(), className: "bg-gray-100 text-gray-500 border border-gray-200" };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${c.className}`}>
      <AlertTriangle className="size-2.5" />
      {c.label}
    </span>
  );
}

function formatAlertType(type: string | null) {
  if (!type) return null;
  switch (type) {
    case "SOIL_MOISTURE":    return "soil_moisture_low";
    case "LOW_BATTERY":      return "low_battery";
    case "PEATLAND_LIFESPAN": return "peatland_lifespan";
    default: return type.toLowerCase();
  }
}

function formatAlertDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function StationCard({ station }: StationCardProps) {
  const alertLabel = formatAlertType(station.latestAlertType);
  const alertDate  = formatAlertDate(station.latestAlertDate);

  return (
    <Link
      href={`/dashboard/monitoring/curah-hujan/${station.id}`}
      className="group block rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-foreground/20 active:scale-[0.99]"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-bold text-foreground tracking-wide uppercase leading-tight">
          {station.name}
        </p>
        {station.latestAlertPriority ? (
          <AlertBadge priority={station.latestAlertPriority} />
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
            <CheckCircle2 className="size-2.5" />
            normal
          </span>
        )}
      </div>

      {/* Location */}
      <p className="text-xs text-muted-foreground mb-3">
        {station.kabupaten}, {station.provinsi}
      </p>

      {/* Counts row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Cpu className="size-3" />
          {station.deviceCount} Devices
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="size-3" />
          {station.wtpCount} WTPs
        </span>
      </div>

      {/* Rainfall stats */}
      <div className="flex items-center gap-3 text-xs mb-3">
        <span className="flex items-center gap-1 text-emerald-600 font-medium">
          <CloudRain className="size-3" />
          {station.totalRain} mm
        </span>
        <span className="flex items-center gap-1 text-amber-600">
          <Calendar className="size-3" />
          {station.rainyDaysCount} hari hujan
        </span>
      </div>

      {/* Latest alert detail */}
      {alertLabel && alertDate && (
        <div className="border-t pt-2.5 mt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Activity className="size-3 shrink-0" />
            <span className="font-medium text-foreground/70">{alertLabel}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 pl-4.5">{alertDate}</p>
        </div>
      )}
    </Link>
  );
}
