"use client";

import { useState, useTransition, useCallback } from "react";
import { createStation } from "../actions/station";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, MapPin, LinkSimple } from "@phosphor-icons/react";

export function StationFormModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [mapsLink, setMapsLink] = useState("");

  // Parse Google Maps link to extract coordinates
  const parseMapsLink = useCallback((link: string): { lat: number | null; lng: number | null } => {
    try {
      const url = new URL(link);
      
      // Try query parameter 'q' (e.g., https://maps.google.com/?q=-6.9147,107.6098)
      const q = url.searchParams.get("q");
      if (q) {
        const [lat, lng] = q.split(",").map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
      
      // Try Google Maps short URL or /@lat,lng pattern
      const match = link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match) {
        return { lat: Number(match[1]), lng: Number(match[2]) };
      }
      
      // Try /place/lat,lng pattern
      const placeMatch = link.match(/\/place\/(-?\d+\.?\d*)[+,](-?\d+\.?\d*)/);
      if (placeMatch) {
        return { lat: Number(placeMatch[1]), lng: Number(placeMatch[2]) };
      }
      
      return { lat: null, lng: null };
    } catch {
      return { lat: null, lng: null };
    }
  }, []);

  // Update maps link when lat/lng changes
  const updateMapsLinkFromCoords = useCallback((lat: string, lng: string) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      setMapsLink(`https://maps.google.com/?q=${latNum},${lngNum}`);
    }
  }, []);

  // Handle maps link input
  const handleMapsLinkChange = (value: string) => {
    setMapsLink(value);
    const { lat, lng } = parseMapsLink(value);
    if (lat !== null && lng !== null) {
      setLatitude(lat.toString());
      setLongitude(lng.toString());
    }
  };

  // Handle latitude/longitude input
  const handleLatChange = (value: string) => {
    setLatitude(value);
    updateMapsLinkFromCoords(value, longitude);
  };

  const handleLngChange = (value: string) => {
    setLongitude(value);
    updateMapsLinkFromCoords(latitude, value);
  };

  async function handleSubmit(formData: FormData) {
    setError(null);
    
    const name = formData.get("name") as string;
    const peatTypeRaw = formData.get("peatType") as string;
    const peatType = (["FIBRIC", "HEMIC", "SAPRIC"] as const).includes(peatTypeRaw as "FIBRIC" | "HEMIC" | "SAPRIC")
      ? (peatTypeRaw as "FIBRIC" | "HEMIC" | "SAPRIC")
      : undefined;
    const provinsi = formData.get("provinsi") as string;
    const kabupaten = formData.get("kabupaten") as string;
    const kecamatan = formData.get("kecamatan") as string;
    const desa = formData.get("desa") as string;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!name || !provinsi || !kabupaten || !kecamatan || isNaN(lat) || isNaN(lng)) {
      setError("Semua field wajib diisi dengan benar");
      return;
    }

    startTransition(async () => {
      try {
        await createStation({
          name,
          provinsi,
          kabupaten,
          kecamatan,
          desa: desa || undefined,
          latitude: lat,
          longitude: lng,
          peatType,
        });
        setIsOpen(false);
        // Reset form
        setLatitude("");
        setLongitude("");
        setMapsLink("");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal membuat stasiun");
      }
    });
  }

  return (
    <>
      {/* Trigger Button */}
      <Button onClick={() => setIsOpen(true)} size="sm" className="gap-1.5">
        <Plus weight="regular" className="size-4" aria-hidden="true" />
        Tambah
      </Button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-lg rounded-xl border shadow-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin weight="regular" className="size-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Tambah Stasiun</h2>
                  <p className="text-sm text-muted-foreground">
                    Buat lokasi stasiun pemantauan baru
                  </p>
                </div>
              </div>
              <button
                aria-label="Tutup dialog"
                onClick={() => setIsOpen(false)}
                className="size-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
              >
                <X weight="regular" className="size-4" aria-hidden="true" />
              </button>
            </div>

            {/* Form */}
            <form action={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nama Stasiun</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Contoh: Stasiun Pemantauan Cibereum"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provinsi">Provinsi</Label>
                  <Input
                    id="provinsi"
                    name="provinsi"
                    placeholder="Contoh: Jawa Barat"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kabupaten">Kabupaten/Kota</Label>
                  <Input
                    id="kabupaten"
                    name="kabupaten"
                    placeholder="Contoh: Bandung"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kecamatan">Kecamatan</Label>
                  <Input
                    id="kecamatan"
                    name="kecamatan"
                    placeholder="Contoh: Lembang"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desa">Desa (Opsional)</Label>
                  <Input
                    id="desa"
                    name="desa"
                    placeholder="Contoh: Cibereum"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="peatType">Jenis Lahan Gambut</Label>
                <select
                  id="peatType"
                  name="peatType"
                  defaultValue=""
                  disabled={isPending}
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-base transition-colors outline-none focus-visible:border-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
                >
                  <option value="">Pilih jenis lahan gambut (opsional)</option>
                  <option value="FIBRIC">Fibric — gambut mentah, serat tinggi</option>
                  <option value="HEMIC">Hemic — gambut setengah matang</option>
                  <option value="SAPRIC">Sapric — gambut matang, serat rendah</option>
                </select>
              </div>

              <div className="border-t pt-4 mt-4 space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <LinkSimple weight="regular" className="size-4" aria-hidden="true" />
                  Lokasi Maps
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="mapsLink">Link Google Maps</Label>
                  <Input
                    id="mapsLink"
                    name="mapsLink"
                    type="url"
                    placeholder="https://maps.google.com/?q=-6.9147,107.6098"
                    value={mapsLink}
                    onChange={(e) => handleMapsLinkChange(e.target.value)}
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste link Google Maps atau masukkan koordinat manual di bawah.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">atau</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      type="number"
                      step="any"
                      placeholder="Contoh: -6.9147"
                      value={latitude}
                      onChange={(e) => handleLatChange(e.target.value)}
                      required
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      type="number"
                      step="any"
                      placeholder="Contoh: 107.6098"
                      value={longitude}
                      onChange={(e) => handleLngChange(e.target.value)}
                      required
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isPending}
                >
                  {isPending ? "Membuat..." : "Simpan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
