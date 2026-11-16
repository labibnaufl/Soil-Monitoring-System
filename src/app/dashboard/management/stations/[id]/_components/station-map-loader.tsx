"use client";

import dynamic from "next/dynamic";

const StationMap = dynamic(
  () => import("./station-map").then((m) => m.StationMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] w-full animate-pulse rounded-xl border bg-muted/30 md:h-[320px] xl:h-[360px]" />
    ),
  }
);

interface StationMapLoaderProps {
  name: string;
  kabupaten: string;
  provinsi: string;
  latitude: number;
  longitude: number;
  mapsLink?: string | null;
}

export function StationMapLoader(props: StationMapLoaderProps) {
  return <StationMap {...props} />;
}
