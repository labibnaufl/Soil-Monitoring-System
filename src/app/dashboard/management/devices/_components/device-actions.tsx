"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, Eye, CheckCircle2, Wrench, Power, Trash2, Pencil, MapPin, MapPinOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateDeviceStatus, deleteDevice, assignDeviceToStation, unassignDevice } from "./actions/device";
import { useState } from "react";

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
  status: string;
  stationId: string | null;
  station?: { name: string } | null;
  _count?: {
    readings: number;
  };
};

export function DeviceActions({ device, stations }: { device: Device; stations: Station[] }) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  function handleSetOperating() {
    startTransition(async () => {
      try {
        await updateDeviceStatus(device.id, "BEROPERASI");
        toast.success("Status perangkat diubah ke Beroperasi");
      } catch (err: any) {
        toast.error(err.message || "Gagal mengubah status");
      }
    });
  }

  function handleSetMaintenance() {
    startTransition(async () => {
      try {
        await updateDeviceStatus(device.id, "MAINTENANCE");
        toast.success("Status perangkat diubah ke Maintenance");
      } catch (err: any) {
        toast.error(err.message || "Gagal mengubah status");
      }
    });
  }

  function handleSetOffline() {
    startTransition(async () => {
      try {
        await updateDeviceStatus(device.id, "MATI");
        toast.success("Status perangkat diubah ke Mati");
      } catch (err: any) {
        toast.error(err.message || "Gagal mengubah status");
      }
    });
  }

  function handleDelete() {
    if ((device._count?.readings ?? 0) > 0) {
      toast.error("Perangkat dengan data tidak dapat dihapus");
      return;
    }
    setShowDeleteDialog(true);
  }

  function handleUnassign() {
    startTransition(async () => {
      try {
        await unassignDevice(device.id);
        toast.success("Perangkat dilepas dari stasiun");
      } catch (err: any) {
        toast.error(err.message || "Gagal melepas dari stasiun");
      }
    });
  }

  function handleAssign(stationId: string) {
    startTransition(async () => {
      try {
        await assignDeviceToStation(device.id, stationId);
        setShowAssignDialog(false);
        toast.success("Perangkat berhasil dipasang ke stasiun");
      } catch (err: any) {
        toast.error(err.message || "Gagal memasang ke stasiun");
      }
    });
  }

  const hasData = (device._count?.readings ?? 0) > 0;

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
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {device.deviceName}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* View Detail */}
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/management/devices/${device.id}`}>
              <Eye className="size-4 mr-2" />
              Lihat Detail
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={`/dashboard/management/devices/${device.id}?edit=true`}>
              <Pencil className="size-4 mr-2" />
              Edit Perangkat
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Status Actions */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs">Ubah Status</DropdownMenuLabel>
            {device.status !== "BEROPERASI" && (
              <DropdownMenuItem
                onClick={handleSetOperating}
                className="text-emerald-600"
              >
                <CheckCircle2 className="size-4 mr-2" />
                Set Beroperasi
              </DropdownMenuItem>
            )}
            {device.status !== "MAINTENANCE" && (
              <DropdownMenuItem
                onClick={handleSetMaintenance}
                className="text-amber-600"
              >
                <Wrench className="size-4 mr-2" />
                Set Maintenance
              </DropdownMenuItem>
            )}
            {device.status !== "MATI" && (
              <DropdownMenuItem
                onClick={handleSetOffline}
                className="text-red-600"
              >
                <Power className="size-4 mr-2" />
                Set Mati
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Assignment Actions */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs">Penempatan</DropdownMenuLabel>
            {device.stationId ? (
              <DropdownMenuItem
                onClick={handleUnassign}
                className="text-amber-600"
              >
                <MapPinOff className="size-4 mr-2" />
                Lepas dari Stasiun
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setShowAssignDialog(true);
                }}
                className="text-blue-600"
              >
                <MapPin className="size-4 mr-2" />
                Pasang ke Stasiun
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Info */}
          <DropdownMenuItem disabled className="text-muted-foreground">
            ID: {device.deviceId}
          </DropdownMenuItem>

          {/* Delete - only if no readings */}
          {!hasData && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                className="text-red-600"
              >
                <Trash2 className="size-4 mr-2" />
                Hapus Perangkat
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-sm w-full mx-4 border">
            <h3 className="text-lg font-semibold mb-2">Konfirmasi Hapus</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Apakah Anda yakin ingin menghapus perangkat <strong>{device.deviceName}</strong>? 
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
                      await deleteDevice(device.id);
                      setShowDeleteDialog(false);
                      toast.success("Perangkat berhasil dihapus");
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

      {/* Assign to Station Dialog */}
      {showAssignDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4 border">
            <h3 className="text-lg font-semibold mb-2">Pasang ke Stasiun</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Pilih stasiun untuk menempatkan perangkat <strong>{device.deviceName}</strong>.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {stations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada stasiun tersedia.</p>
              ) : (
                stations.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => handleAssign(station.id)}
                    disabled={isPending}
                    className="w-full text-left px-4 py-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <p className="font-medium">{station.name}</p>
                    <p className="text-xs text-muted-foreground">{station.kabupaten}, {station.provinsi}</p>
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowAssignDialog(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-accent transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
