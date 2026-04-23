"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, Eye, ShieldCheck, ShieldX, Trash2, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { activateStation, deactivateStation, deleteStation } from "../actions/station";
import { useState } from "react";

type Station = {
  id: string;
  name: string;
  status: string;
  _count: {
    devices: number;
    admins: number;
  };
};

export function StationActions({ station }: { station: Station }) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isActive = station.status === "AKTIF";
  const canDelete = station._count.devices === 0 && station._count.admins === 0 && station.status === "NONAKTIF";

  function handleActivate() {
    startTransition(async () => {
      try {
        await activateStation(station.id);
        toast.success("Stasiun berhasil diaktifkan");
      } catch (err: any) {
        toast.error(err.message || "Gagal mengaktifkan stasiun");
      }
    });
  }

  function handleDeactivate() {
    startTransition(async () => {
      try {
        await deactivateStation(station.id);
        toast.success("Stasiun berhasil dinonaktifkan");
      } catch (err: any) {
        toast.error(err.message || "Gagal menonaktifkan stasiun");
      }
    });
  }

  function handleDelete() {
    if (!canDelete) {
      toast.error("Stasiun hanya dapat dihapus jika nonaktif, tanpa perangkat, dan tanpa admin");
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
            {station.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* View Detail */}
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/management/stations/${station.id}`}>
              <Eye className="size-4 mr-2" />
              Lihat Detail
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={`/dashboard/management/stations/${station.id}?edit=true`}>
              <Pencil className="size-4 mr-2" />
              Edit Stasiun
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Status Actions */}
          <DropdownMenuGroup>
            {isActive ? (
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

          {/* Info */}
          <DropdownMenuItem disabled className="text-muted-foreground">
            Perangkat: {station._count.devices}
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="text-muted-foreground">
            Admin: {station._count.admins}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Delete - only if no devices/admins and NONAKTIF */}
          {canDelete && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="text-red-600"
            >
              <Trash2 className="size-4 mr-2" />
              Hapus Stasiun
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
              Apakah Anda yakin ingin menghapus stasiun <strong>{station.name}</strong>? 
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
                      await deleteStation(station.id);
                      setShowDeleteDialog(false);
                      toast.success("Stasiun berhasil dihapus");
                    } catch (err: any) {
                      toast.error(err.message || "Gagal menghapus stasiun");
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
