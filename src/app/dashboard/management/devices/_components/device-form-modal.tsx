"use client";

import { useState, useTransition } from "react";
import { createDevice } from "./actions/device";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Cpu } from "lucide-react";

type Station = {
  id: string;
  name: string;
  provinsi: string;
  kabupaten: string;
};

export function DeviceFormModal({ stations }: { stations: Station[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    
    const deviceId = formData.get("deviceId") as string;
    const deviceName = formData.get("deviceName") as string;
    const stationId = formData.get("stationId") as string;
    const description = formData.get("description") as string;
    const samplingInterval = parseInt(formData.get("samplingInterval") as string) || 300;
    const batteryWarning = parseFloat(formData.get("batteryWarning") as string) || 20;
    const batteryCritical = parseFloat(formData.get("batteryCritical") as string) || 10;

    if (!deviceId || !deviceName) {
      setError("ID Perangkat dan Nama Perangkat wajib diisi");
      return;
    }

    if (deviceId.length < 5) {
      setError("ID Perangkat minimal 5 karakter");
      return;
    }

    startTransition(async () => {
      try {
        await createDevice({
          deviceId: deviceId.toUpperCase(),
          deviceName,
          stationId: stationId || undefined,
          description: description || undefined,
          samplingInterval,
          batteryWarning,
          batteryCritical,
        });
        setIsOpen(false);
      } catch (err: any) {
        setError(err.message || "Gagal membuat perangkat");
      }
    });
  }

  return (
    <>
      {/* Trigger Button */}
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="size-4" />
        Tambah Perangkat
      </Button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-lg rounded-xl border shadow-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Cpu className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Tambah Perangkat</h2>
                  <p className="text-sm text-muted-foreground">
                    Daftarkan perangkat IoT baru
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
            <form action={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="deviceId">ID Perangkat (Hardware ID)</Label>
                <Input
                  id="deviceId"
                  name="deviceId"
                  placeholder="Contoh: LPA-ESP3201-P1234"
                  required
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  ID unik dari hardware perangkat
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceName">Nama Perangkat</Label>
                <Input
                  id="deviceName"
                  name="deviceName"
                  placeholder="Contoh: Sensor Cibereum Utama"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stationId">Stasiun (Opsional)</Label>
                <select
                  id="stationId"
                  name="stationId"
                  disabled={isPending || stations.length === 0}
                  className="w-full h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                >
                  <option value="">Pilih stasiun...</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name} ({station.kabupaten}, {station.provinsi})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Deskripsi perangkat..."
                  disabled={isPending}
                />
              </div>

              <div className="border-t pt-4 mt-4 space-y-4">
                <h3 className="text-sm font-medium">Konfigurasi</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="samplingInterval">Interval Sampling (detik)</Label>
                    <Input
                      id="samplingInterval"
                      name="samplingInterval"
                      type="number"
                      min="60"
                      defaultValue="300"
                      disabled={isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                      Default: 300s (5 menit)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batteryWarning">Threshold Baterai Warning (%)</Label>
                    <Input
                      id="batteryWarning"
                      name="batteryWarning"
                      type="number"
                      min="0"
                      max="100"
                      defaultValue="20"
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batteryCritical">Threshold Baterai Kritis (%)</Label>
                  <Input
                    id="batteryCritical"
                    name="batteryCritical"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="10"
                    disabled={isPending}
                  />
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
