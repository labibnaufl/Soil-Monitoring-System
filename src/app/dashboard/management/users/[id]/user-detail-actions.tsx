"use client";

import { useTransition } from "react";
import {
  activateUser,
  deactivateUser,
  deleteUser,
} from "../actions/user";
import { useState } from "react";

export function UserDetailActions({
  userId,
  name,
  currentRole,
  currentStatus,
  canModify,
}: {
  userId: string;
  name: string;
  currentRole: string;
  currentStatus: string;
  canModify: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const isActive = currentStatus === "AKTIF";

  if (!canModify || isSuperAdmin) {
    return (
      <div className="text-sm text-muted-foreground">
        {isSuperAdmin ? (
          <p className="p-3 rounded-lg bg-indigo-50 text-indigo-700">
            Super Admin tidak dapat dimodifikasi
          </p>
        ) : (
          <p>Tidak ada aksi yang tersedia untuk pengguna ini.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status Toggle */}
      {isActive ? (
        <button
          disabled={isPending}
          onClick={() => {
            if (confirm(`Nonaktifkan pengguna ${name}?`)) {
              startTransition(async () => {
                await deactivateUser(userId);
              });
            }
          }}
          className="w-full px-3 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          Nonaktifkan Pengguna
        </button>
      ) : (
        <button
          disabled={isPending}
          onClick={() => {
            if (confirm(`Aktifkan pengguna ${name}?`)) {
              startTransition(async () => {
                await activateUser(userId);
              });
            }
          }}
          className="w-full px-3 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          Aktifkan Pengguna
        </button>
      )}

      {/* Delete - only for NONAKTIF users */}
      {!isActive && (
        <button
          disabled={isPending}
          onClick={() => setShowDeleteDialog(true)}
          className="w-full px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          Hapus Pengguna
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
              Apakah Anda yakin ingin menghapus pengguna <strong>{name}</strong>?
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
                    await deleteUser(userId);
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
