"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, Eye, ShieldCheck, ShieldX, UserCog, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { activateUser, deactivateUser, deleteUser } from "../actions/user";
import { useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  station?: { name: string } | null;
};

export function UserActions({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  function handleActivate() {
    startTransition(async () => {
      try {
        await activateUser(user.id);
        toast.success("Pengguna berhasil diaktifkan");
      } catch (err: any) {
        toast.error(err.message || "Gagal mengaktifkan pengguna");
      }
    });
  }

  function handleDeactivate() {
    startTransition(async () => {
      try {
        await deactivateUser(user.id);
        toast.success("Pengguna berhasil dinonaktifkan");
      } catch (err: any) {
        toast.error(err.message || "Gagal menonaktifkan pengguna");
      }
    });
  }

  function handleDelete() {
    if (user.status !== "NONAKTIF") {
      toast.error("Pengguna hanya dapat dihapus jika berstatus Nonaktif");
      return;
    }
    setShowDeleteDialog(true);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex items-center justify-center size-8 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? (
              <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <MoreHorizontal className="size-4" />
            )}
            <span className="sr-only">Aksi</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {user.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* View Detail */}
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/management/users/${user.id}`}>
              <Eye className="size-4 mr-2" />
              Lihat Detail
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Status Actions */}
          {!isSuperAdmin && (
            <DropdownMenuGroup>
              {user.status === "AKTIF" ? (
                <DropdownMenuItem
                  onClick={handleDeactivate}
                  className="text-amber-600"
                >
                  <ShieldX className="size-4 mr-2" />
                  Nonaktifkan
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={handleActivate}
                  className="text-emerald-600"
                >
                  <ShieldCheck className="size-4 mr-2" />
                  Aktifkan
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </DropdownMenuGroup>
          )}

          {/* Role Info (read-only display) */}
          <DropdownMenuItem disabled className="text-muted-foreground">
            <UserCog className="size-4 mr-2" />
            Role: {user.role === "SUPER_ADMIN" ? "Super Admin" : "Admin Lokasi"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Delete - only for NONAKTIF users */}
          {!isSuperAdmin && user.status === "NONAKTIF" && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="text-red-600"
            >
              <Trash2 className="size-4 mr-2" />
              Hapus Pengguna
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-sm w-full mx-4 border">
            <h3 className="text-lg font-semibold mb-2">Konfirmasi Hapus</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Apakah Anda yakin ingin menghapus pengguna <strong>{user.name}</strong>? 
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
                      await deleteUser(user.id);
                      setShowDeleteDialog(false);
                      toast.success("Pengguna berhasil dihapus");
                    } catch (err: any) {
                      toast.error(err.message || "Gagal menghapus pengguna");
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
