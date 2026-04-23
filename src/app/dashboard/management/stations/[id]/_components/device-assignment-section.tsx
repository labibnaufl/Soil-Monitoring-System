"use client";

import { useState, useTransition } from "react";
import { assignDeviceToStation, unassignDeviceFromStation, getAvailableDevices } from "../../actions/assignment";
import { Button } from "@/components/ui/button";
import { Plus, X, Radio, Trash2 } from "lucide-react";

type Device = {
  id: string;
  deviceId: string;
  deviceName: string;
  status: string;
  description: string | null;
  createdAt: Date;
};

export function DeviceAssignmentSection({
  stationId,
  devices,
  isActive,
}: {
  stationId: string;
  devices: Device[];
  isActive: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  async function loadAvailableDevices() {
    setIsOpen(true);
    setError(null);
    setLoadingDevices(true);
    try {
      const devices = await getAvailableDevices();
      setAvailableDevices(devices);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingDevices(false);
    }
  }

  function handleAssign(deviceId: string, deviceName: string) {
    if (!confirm(`Tugaskan perangkat ${deviceName} ke stasiun ini?`)) return;
    
    startTransition(async () => {
      try {
        await assignDeviceToStation(stationId, deviceId);
        setAvailableDevices(prev => prev.filter(d => d.id !== deviceId));
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  function handleUnassign(deviceId: string, deviceName: string) {
    if (!confirm(`Hapus perangkat ${deviceName} dari stasiun ini?`)) return;
    
    startTransition(async () => {
      try {
        await unassignDeviceFromStation(stationId, deviceId);
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "BEROPERASI":
        return "bg-emerald-100 text-emerald-700";
      case "MAINTENANCE":
        return "bg-amber-100 text-amber-700";
      case "MATI":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold font-heading text-foreground flex items-center gap-2">
          <Radio className="size-4" />
          Perangkat Tertugas
        </h2>
        {isActive && (
          <Button
            size="sm"
            variant="outline"
            onClick={loadAvailableDevices}
            disabled={isPending}
            className="gap-1"
          >
            <Plus className="size-4" />
            Tambah Perangkat
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Assigned Devices List */}
      {devices.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Radio className="size-12 mx-auto mb-3 opacity-20" />
          <p>Belum ada perangkat tertugas</p>
          {isActive && (
            <p className="text-sm mt-1">
              Klik "Tambah Perangkat" untuk menugaskan perangkat
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-background"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Radio className="size-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{device.deviceName}</p>
                  <p className="text-xs text-muted-foreground">{device.deviceId}</p>
                  {device.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {device.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                  {device.status}
                </span>
                <button
                  onClick={() => handleUnassign(device.id, device.deviceName)}
                  disabled={isPending}
                  className="size-8 rounded-md hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors disabled:opacity-50"
                  title="Hapus penugasan"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Available Devices */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-lg rounded-xl border shadow-lg max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Pilih Perangkat</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="size-8 rounded-md hover:bg-accent flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {loadingDevices ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p>Memuat perangkat...</p>
                </div>
              ) : availableDevices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Radio className="size-12 mx-auto mb-3 opacity-20" />
                  <p>Tidak ada perangkat tersedia</p>
                  <p className="text-sm mt-1">
                    Semua perangkat sudah ditugaskan ke stasiun
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableDevices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => handleAssign(device.id, device.deviceName)}
                      disabled={isPending}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center">
                          <Radio className="size-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{device.deviceName}</p>
                          <p className="text-xs text-muted-foreground">{device.deviceId}</p>
                          {device.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {device.description}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                          {device.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
