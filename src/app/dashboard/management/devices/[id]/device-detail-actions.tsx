"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateDeviceStatus, deleteDevice } from "../_components/actions/device";
import { useState } from "react";
import { CheckCircle2, Wrench, Power, Trash2 } from "lucide-react";

export function DeviceDetailActions({
  deviceId,
  deviceName,
  currentStatus,
  hasReadings,
}: {
  deviceId: string;
  deviceName: string;
  currentStatus: string;
  hasReadings: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isOperating = currentStatus === "BEROPERASI";
  const isMaintenance = currentStatus === "MAINTENANCE";
  const isOffline = currentStatus === "MATI";
  const canDelete = !hasReadings;

  function handleSetOperating() {
    if (!confirm(`Ubah status ${deviceName} ke Beroperasi?`)) return;
    startTransition(async () => {
      try {
        await updateDeviceStatus(deviceId, "BEROPERASI");
        toast.success("Status perangkat diubah ke Beroperasi");
      } catch (err: any) {
        toast.error(err.message || "Gagal mengubah status");
      }
    });
  }

  function handleSetMaintenance() {
    if (!confirm(`Ubah status ${deviceName} ke Maintenance?`)) return;
    startTransition(async () => {
      try {
        await updateDeviceStatus(deviceId, "MAINTENANCE");
        toast.success("Status perangkat diubah ke Maintenance");
      } catch (err: any) {
        toast.error(err.message || "Gagal mengubah status");
      }
    });
  }

  function handleSetOffline() {
    if (!confirm(`Ubah status ${deviceName} ke Mati?`)) return;
    startTransition(async () => {
      try {
        await updateDeviceStatus(deviceId, "MATI");
        toast.success("Status perangkat diubah ke Mati");
      } catch (err: any) {
        toast.error(err.message || "Gagal mengubah status");
      }
    });
  }

  function handleDelete() {
    if (!canDelete) {
      toast.error("Perangkat dengan data tidak dapat dihapus");
      return;
    }
    setShowDeleteDialog(true);
  }

  return (
    <>
      <div className="space-y-3">
        {/* Status Toggle */}
        {!isOperating && (
          <button
            disabled={isPending}
            onClick={handleSetOperating}
            className="w-full px-3 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="size-4" />
            Set Beroperasi
          </button>
        )}

        {!isMaintenance && (
          <button
            disabled={isPending}
            onClick={handleSetMaintenance}
            className="w-full px-3 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Wrench className="size-4" />
            Set Maintenance
          </button>
        )}

        {!isOffline && (
          <button
            disabled={isPending}
            onClick={handleSetOffline}
            className="w-full px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Power className="size-4" />
            Set Mati
          </button>
        )}

        {/* Delete - only for devices with no readings */}
        {canDelete && (
          <>
            <hr className="border-t" />
            <button
              disabled={isPending}
              onClick={handleDelete}
              className="w-full px-3 py-2 text-sm font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Trash2 className="size-4" />
              Hapus Perangkat
            </button>
          </>
        )}

        {isPending && (
          <p className="text-xs text-muted-foreground text-center">Memproses...</p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-sm w-full mx-4 border">
            <h3 className="text-lg font-semibold mb-2">Konfirmasi Hapus</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Apakah Anda yakin ingin menghapus perangkat <strong>{deviceName}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-accent transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  startTransition(async () => {
                    try {
                      await deleteDevice(deviceId);
                      setShowDeleteDialog(false);
                      toast.success("Perangkat berhasil dihapus");
                      // Redirect to devices list
                      window.location.href = "/dashboard/management/devices";
                    } catch (err: any) {
                      toast.error(err.message || "Gagal menghapus perangkat");
                    }
                  });
                }}
                disabled={isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isPending ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
