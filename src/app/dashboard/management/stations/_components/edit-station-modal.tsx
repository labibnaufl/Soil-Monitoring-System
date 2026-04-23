"use client";

import { useState, useTransition, useCallback } from "react";
import { updateStation } from "../actions/station";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, X, MapPin, Link2 } from "lucide-react";

type Station = {
  id: string;
  name: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string | null;
  latitude: number;
  longitude: number;
};

export function EditStationModal({ station }: { station: Station }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: station.name,
    provinsi: station.provinsi,
    kabupaten: station.kabupaten,
    kecamatan: station.kecamatan,
    desa: station.desa || "",
    latitude: station.latitude.toString(),
    longitude: station.longitude.toString(),
  });
  
  const [mapsLink, setMapsLink] = useState(
    `https://maps.google.com/?q=${station.latitude},${station.longitude}`
  );

  // Parse Google Maps link to extract coordinates
  const parseMapsLink = useCallback((link: string): { lat: number | null; lng: number | null } => {
    try {
      const url = new URL(link);
      
      const q = url.searchParams.get("q");
      if (q) {
        const [lat, lng] = q.split(",").map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
      
      const match = link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match) {
        return { lat: Number(match[1]), lng: Number(match[2]) };
      }
      
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
      setFormData(prev => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));
    }
  };

  // Handle latitude/longitude input
  const handleLatChange = (value: string) => {
    setFormData(prev => ({ ...prev, latitude: value }));
    updateMapsLinkFromCoords(value, formData.longitude);
  };

  const handleLngChange = (value: string) => {
    setFormData(prev => ({ ...prev, longitude: value }));
    updateMapsLinkFromCoords(formData.latitude, value);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (!formData.name || !formData.provinsi || !formData.kabupaten || !formData.kecamatan || isNaN(lat) || isNaN(lng)) {
      setError("Semua field wajib diisi dengan benar");
      return;
    }

    startTransition(async () => {
      try {
        await updateStation(station.id, {
          name: formData.name,
          provinsi: formData.provinsi,
          kabupaten: formData.kabupaten,
          kecamatan: formData.kecamatan,
          desa: formData.desa || undefined,
          latitude: lat,
          longitude: lng,
        });
        setIsOpen(false);
      } catch (err: any) {
        setError(err.message || "Gagal memperbarui stasiun");
      }
    });
  }

  return (
    <>
      {/* Trigger Button */}
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="gap-2">
        <Pencil className="size-4" />
        Edit
      </Button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-lg rounded-xl border shadow-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Pencil className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Edit Stasiun</h2>
                  <p className="text-sm text-muted-foreground">
                    Perbarui informasi stasiun {station.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="size-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama Stasiun</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Stasiun Pemantauan Cibereum"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-provinsi">Provinsi</Label>
                  <Input
                    id="edit-provinsi"
                    value={formData.provinsi}
                    onChange={(e) => setFormData(prev => ({ ...prev, provinsi: e.target.value }))}
                    placeholder="Contoh: Jawa Barat"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-kabupaten">Kabupaten/Kota</Label>
                  <Input
                    id="edit-kabupaten"
                    value={formData.kabupaten}
                    onChange={(e) => setFormData(prev => ({ ...prev, kabupaten: e.target.value }))}
                    placeholder="Contoh: Bandung"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-kecamatan">Kecamatan</Label>
                  <Input
                    id="edit-kecamatan"
                    value={formData.kecamatan}
                    onChange={(e) => setFormData(prev => ({ ...prev, kecamatan: e.target.value }))}
                    placeholder="Contoh: Lembang"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-desa">Desa (Opsional)</Label>
                  <Input
                    id="edit-desa"
                    value={formData.desa}
                    onChange={(e) => setFormData(prev => ({ ...prev, desa: e.target.value }))}
                    placeholder="Contoh: Cibereum"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4 space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Link2 className="size-4" />
                  Lokasi Maps
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-mapsLink">Link Google Maps</Label>
                  <Input
                    id="edit-mapsLink"
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-latitude">Latitude</Label>
                    <Input
                      id="edit-latitude"
                      type="number"
                      step="any"
                      placeholder="Contoh: -6.9147"
                      value={formData.latitude}
                      onChange={(e) => handleLatChange(e.target.value)}
                      required
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-longitude">Longitude</Label>
                    <Input
                      id="edit-longitude"
                      type="number"
                      step="any"
                      placeholder="Contoh: 107.6098"
                      value={formData.longitude}
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
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
