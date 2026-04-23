"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createMockAlert } from "./actions/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Bell } from "lucide-react";

type Station = {
  id: string;
  name: string;
  provinsi: string;
  kabupaten: string;
};

type Device = {
  id: string;
  deviceId: string;
  deviceName: string;
};

export function MockAlertModal({ stations, devices }: { stations: Station[]; devices: Device[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    const alertType = formData.get("alertType") as "SOIL_MOISTURE" | "LOW_BATTERY" | "PEATLAND_LIFESPAN";
    const priority = formData.get("priority") as "LOW" | "MEDIUM" | "HIGH";
    const message = formData.get("message") as string;
    const stationId = formData.get("stationId") as string;
    const deviceId = formData.get("deviceId") as string;
    const thresholdValue = parseFloat(formData.get("thresholdValue") as string);
    const actualValue = parseFloat(formData.get("actualValue") as string);

    if (!alertType || !priority || !message || !stationId) {
      toast.error("Semua field wajib diisi");
      return;
    }

    startTransition(async () => {
      try {
        await createMockAlert({
          alertType,
          priority,
          message,
          stationId,
          deviceId: deviceId || undefined,
          thresholdValue: isNaN(thresholdValue) ? undefined : thresholdValue,
          actualValue: isNaN(actualValue) ? undefined : actualValue,
        });
        toast.success("Notifikasi uji coba berhasil dibuat");
        setIsOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Gagal membuat notifikasi");
      }
    });
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2">
        <Plus className="size-4" />
        Notifikasi Uji Coba
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-lg rounded-xl border shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Bell className="size-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Buat Notifikasi Uji Coba</h2>
                  <p className="text-sm text-muted-foreground">
                    Hanya untuk testing sistem
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

            <form action={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alertType">Tipe Notifikasi</Label>
                  <select
                    id="alertType"
                    name="alertType"
                    required
                    disabled={isPending}
                    className="w-full h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="SOIL_MOISTURE">Kelembapan Tanah</option>
                    <option value="LOW_BATTERY">Baterai Rendah</option>
                    <option value="PEATLAND_LIFESPAN">Masa Hidup Gambut</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioritas</Label>
                  <select
                    id="priority"
                    name="priority"
                    required
                    disabled={isPending}
                    className="w-full h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="LOW">Rendah</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">Tinggi</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stationId">Stasiun</Label>
                <select
                  id="stationId"
                  name="stationId"
                  required
                  disabled={isPending || stations.length === 0}
                  className="w-full h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm disabled:opacity-50"
                >
                  <option value="">Pilih stasiun...</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name} ({station.kabupaten}, {station.provinsi})
                    </option>
                  ))}
                </select>
                {stations.length === 0 && (
                  <p className="text-xs text-red-600">Tidak ada stasiun tersedia.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceId">Perangkat (Opsional)</Label>
                <select
                  id="deviceId"
                  name="deviceId"
                  disabled={isPending || devices.length === 0}
                  className="w-full h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm disabled:opacity-50"
                >
                  <option value="">Pilih perangkat...</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.deviceName} ({device.deviceId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Pesan Notifikasi</Label>
                <Input
                  id="message"
                  name="message"
                  placeholder="Contoh: Baterai perangkat kritis: 8.5%"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="thresholdValue">Nilai Ambang Batas (Opsional)</Label>
                  <Input
                    id="thresholdValue"
                    name="thresholdValue"
                    type="number"
                    step="any"
                    placeholder="Contoh: 10"
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualValue">Nilai Aktual (Opsional)</Label>
                  <Input
                    id="actualValue"
                    name="actualValue"
                    type="number"
                    step="any"
                    placeholder="Contoh: 8.5"
                    disabled={isPending}
                  />
                </div>
              </div>

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
                  disabled={isPending || stations.length === 0}
                >
                  {isPending ? "Membuat..." : "Buat Notifikasi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
