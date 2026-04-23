"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { activateStation, deactivateStation, deleteStation } from "../actions/station";
import { useState } from "react";

export function StationDetailActions({
  stationId,
  name,
  currentStatus,
  deviceCount,
  adminCount,
}: {
  stationId: string;
  name: string;
  currentStatus: string;
  deviceCount: number;
  adminCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isActive = currentStatus === "AKTIF";
  const canDelete = deviceCount === 0 && adminCount === 0 && !isActive;

  function handleActivate() {
    if (!confirm(`Aktifkan stasiun ${name}?`)) return;
    startTransition(async () => {
      await activateStation(stationId);
    });
  }

  function handleDeactivate() {
    if (!confirm(`Nonaktifkan stasiun ${name}?`)) return;
    startTransition(async () => {
      await deactivateStation(stationId);
    });
  }

  function handleDelete() {
    if (!canDelete) {
      alert("Stasiun hanya dapat dihapus jika nonaktif, tanpa perangkat, dan tanpa admin");
      return;
    }
    setShowDeleteDialog(true);
  }

  return (
    <div className="space-y-3">
      {/* Status Toggle */}
      {isActive ? (
        <button
          disabled={isPending}
          onClick={handleDeactivate}
          className="w-full px-3 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          Nonaktifkan Stasiun
        </button>
      ) : (
        <button
          disabled={isPending}
          onClick={handleActivate}
          className="w-full px-3 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          Aktifkan Stasiun
        </button>
      )}

      {/* Delete - only for NONAKTIF stations with no devices/admins */}
      {canDelete && (
        <button
          disabled={isPending}
          onClick={handleDelete}
          className="w-full px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          Hapus Stasiun
        </button>
      )}

      {isPending && (
        <p className="text-xs text-muted-foreground text-center">Memproses...</p>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-sm w-full mx-4 border">
            <h3 className="text-lg font-semibold mb-2">Konfirmasi Hapus</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Apakah Anda yakin ingin menghapus stasiun <strong>{name}</strong>?
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
                    await deleteStation(stationId);
                  });
                  setShowDeleteDialog(false);
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
    </div>
  );
}
