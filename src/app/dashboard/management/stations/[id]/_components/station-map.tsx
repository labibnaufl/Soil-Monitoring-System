"use client";

import { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import { Icon, divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";

interface StationMapProps {
  name: string;
  kabupaten: string;
  provinsi: string;
  latitude: number;
  longitude: number;
  mapsLink?: string | null;
}

function fixLeafletDefaultIcon() {
  // Leaflet's default marker URLs break under Next.js bundler.
  // Re-point them to a reliable CDN copy or fall back to a divIcon below.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (Icon.Default.prototype as any)._getIconUrl;
  Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function getMarkerIcon() {
  fixLeafletDefaultIcon();
  // Prefer a small custom divIcon so it always renders regardless of CDN state.
  return divIcon({
    className: "custom-station-marker",
    html: `<svg viewBox="0 0 24 24" fill="#16a34a" width="28" height="28" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

function isValidCoordinate(lat: number, lng: number) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function StationMap({
  name,
  kabupaten,
  provinsi,
  latitude,
  longitude,
  mapsLink,
}: StationMapProps) {
  const valid = isValidCoordinate(latitude, longitude);
  const position: [number, number] = useMemo(
    () => (valid ? [latitude, longitude] : [0, 0]),
    [valid, latitude, longitude]
  );
  const markerIcon = useMemo(() => getMarkerIcon(), []);

  if (!valid) {
    return (
      <div className="h-[260px] md:h-[320px] xl:h-[360px] w-full rounded-xl border bg-muted/30 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
        <p className="text-sm font-medium">Lokasi stasiun tidak tersedia</p>
        <p className="text-xs mt-1">
          Koordinat tidak valid ({latitude}, {longitude})
        </p>
      </div>
    );
  }

  return (
    <div className="h-[260px] md:h-[320px] xl:h-[360px] w-full rounded-xl overflow-hidden border z-0">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={markerIcon}>
          <Popup>
            <div className="space-y-0.5 min-w-[10rem]">
              <p className="font-semibold text-sm">{name}</p>
              <p className="text-xs text-muted-foreground">
                {kabupaten}, {provinsi}
              </p>
              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-primary hover:underline mt-1"
                >
                  Buka di Google Maps
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
