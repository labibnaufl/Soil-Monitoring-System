"use client";

import { useState, useTransition } from "react";
import { updateDevice } from "../../_components/actions/device";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, X, Cpu, Settings } from "lucide-react";

type Device = {
  id: string;
  deviceId: string;
  deviceName: string;
  description: string | null;
  samplingInterval: number;
  batteryWarning: number;
  batteryCritical: number;
  pipeLength: number | null;
  remainingPipe: number | null;
};

export function EditDeviceModal({ device }: { device: Device }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    deviceName: device.deviceName,
    description: device.description || "",
    samplingInterval: device.samplingInterval.toString(),
    batteryWarning: device.batteryWarning.toString(),
    batteryCritical: device.batteryCritical.toString(),
    pipeLength: device.pipeLength?.toString() || "",
    remainingPipe: device.remainingPipe?.toString() || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const samplingInterval = parseInt(formData.samplingInterval);
    const batteryWarning = parseFloat(formData.batteryWarning);
    const batteryCritical = parseFloat(formData.batteryCritical);
    const pipeLength = formData.pipeLength ? parseFloat(formData.pipeLength) : undefined;
    const remainingPipe = formData.remainingPipe ? parseFloat(formData.remainingPipe) : undefined;

    if (!formData.deviceName || isNaN(samplingInterval) || isNaN(batteryWarning) || isNaN(batteryCritical)) {
      setError("Semua field wajib diisi dengan benar");
      return;
    }

    if (batteryCritical >= batteryWarning) {
      setError("Threshold kritis harus lebih rendah dari threshold warning");
      return;
    }

    startTransition(async () => {
      try {
        await updateDevice(device.id, {
          deviceName: formData.deviceName,
          description: formData.description || undefined,
          samplingInterval,
          batteryWarning,
          batteryCritical,
          pipeLength,
          remainingPipe,
        });
        setIsOpen(false);
      } catch (err: any) {
        setError(err.message || "Gagal memperbarui perangkat");
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
                  <h2 className="text-lg font-semibold">Edit Perangkat</h2>
                  <p className="text-sm text-muted-foreground">
                    Perbarui informasi {device.deviceName}
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

              {/* Device ID (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="edit-deviceId">ID Perangkat</Label>
                <Input
                  id="edit-deviceId"
                  value={device.deviceId}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  ID Perangkat tidak dapat diubah
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-deviceName">Nama Perangkat</Label>
                <Input
                  id="edit-deviceName"
                  value={formData.deviceName}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceName: e.target.value }))}
                  placeholder="Contoh: Sensor Cibereum Utama"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Deskripsi (Opsional)</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsi perangkat..."
                  disabled={isPending}
                />
              </div>

              <div className="border-t pt-4 mt-4 space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Settings className="size-4" />
                  Konfigurasi
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-samplingInterval">Interval Sampling (detik)</Label>
                    <Input
                      id="edit-samplingInterval"
                      type="number"
                      min="60"
                      value={formData.samplingInterval}
                      onChange={(e) => setFormData(prev => ({ ...prev, samplingInterval: e.target.value }))}
                      required
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-batteryWarning">Battery Warning (%)</Label>
                    <Input
                      id="edit-batteryWarning"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.batteryWarning}
                      onChange={(e) => setFormData(prev => ({ ...prev, batteryWarning: e.target.value }))}
                      required
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-batteryCritical">Battery Critical (%)</Label>
                  <Input
                    id="edit-batteryCritical"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.batteryCritical}
                    onChange={(e) => setFormData(prev => ({ ...prev, batteryCritical: e.target.value }))}
                    required
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Harus lebih rendah dari Battery Warning
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 mt-4 space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Cpu className="size-4" />
                  Kalibrasi (cm)
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-pipeLength">Panjang Pipa Total</Label>
                    <Input
                      id="edit-pipeLength"
                      type="number"
                      step="any"
                      value={formData.pipeLength}
                      onChange={(e) => setFormData(prev => ({ ...prev, pipeLength: e.target.value }))}
                      placeholder="Contoh: 200"
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-remainingPipe">Sisa Pipa</Label>
                    <Input
                      id="edit-remainingPipe"
                      type="number"
                      step="any"
                      value={formData.remainingPipe}
                      onChange={(e) => setFormData(prev => ({ ...prev, remainingPipe: e.target.value }))}
                      placeholder="Contoh: 50"
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
