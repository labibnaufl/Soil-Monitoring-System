"use client";

import Link from "next/link";
import { Cpu, MapPin, Warning, Heartbeat, CheckCircle, CloudRain, Calendar } from "@phosphor-icons/react";
import { StatusBadge, getPriorityBadge, getPriorityLabel } from "@/components/ui/status-badge";

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
          (() => {
            const priorityBadge = getPriorityBadge(station.latestAlertPriority);
            return (
              <StatusBadge
                intent={priorityBadge.intent}
                icon={Warning}
                title={priorityBadge.label}
                className="text-[11px]"
              >
                {priorityBadge.label}
              </StatusBadge>
            );
          })()
        ) : (
          <StatusBadge intent="emerald" icon={CheckCircle} className="text-[11px]">
            Normal
          </StatusBadge>
        )}
      </div>

      {/* Location */}
      <p className="text-xs text-muted-foreground mb-3">
        {station.kabupaten}, {station.provinsi}
      </p>

      {/* Counts row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Cpu weight="regular" className="size-3" aria-hidden="true" />
          {station.deviceCount} Devices
        </span>
        <span className="flex items-center gap-1">
          <MapPin weight="regular" className="size-3" aria-hidden="true" />
          {station.wtpCount} WTPs
        </span>
      </div>

      {/* Rainfall stats */}
      <div className="flex items-center gap-3 text-xs mb-3">
        <span className="flex items-center gap-1 text-emerald-600 font-medium">
          <CloudRain weight="regular" className="size-3" aria-hidden="true" />
          {station.totalRain} mm
        </span>
        <span className="flex items-center gap-1 text-amber-600">
          <Calendar weight="regular" className="size-3" aria-hidden="true" />
          {station.rainyDaysCount} hari hujan
        </span>
      </div>

      {/* Latest alert detail */}
      {alertLabel && alertDate && (
        <div className="border-t pt-2.5 mt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Heartbeat weight="regular" className="size-3 shrink-0" aria-hidden="true" />
            <span className="font-medium text-foreground/70">{alertLabel}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 pl-4.5">{alertDate}</p>
        </div>
      )}
    </Link>
  );
}
