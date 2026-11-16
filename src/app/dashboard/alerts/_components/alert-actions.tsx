"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { DotsThree, Eye, CheckCircle, Clock, ArrowRight, ArrowCounterClockwise } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateAlertStatus, resolveAlert } from "./actions/alert";
import { useState } from "react";

type Alert = {
  id: string;
  alertType: string;
  priority: string;
  status: string;
  message: string | null;
  station?: { name: string } | null;
  device?: { deviceName: string } | null;
  resolvedBy?: { name: string } | null;
};

export function AlertActions({ alert }: { alert: Alert }) {
  const [isPending, startTransition] = useTransition();
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");

  const isOpen = alert.status === "OPEN";
  const isPendingStatus = alert.status === "PENDING";
  const isInProgress = alert.status === "IN_PROGRESS";
  const isResolved = alert.status === "RESOLVED";

  function handleSetPending() {
    startTransition(async () => {
      try {
        await updateAlertStatus(alert.id, "PENDING");
        toast.success("Status notifikasi diubah ke Pending");
      } catch (err: any) {
        toast.error(err.message || "Gagal mengubah status");
      }
    });
  }

  function handleSetInProgress() {
    startTransition(async () => {
      try {
        await updateAlertStatus(alert.id, "IN_PROGRESS");
        toast.success("Status notifikasi diubah ke Sedang Dikerjakan");
      } catch (err: any) {
        toast.error(err.message || "Gagal mengubah status");
      }
    });
  }

  function handleSetOpen() {
    startTransition(async () => {
      try {
        await updateAlertStatus(alert.id, "OPEN");
        toast.success("Status notifikasi diubah ke Terbuka");
      } catch (err: any) {
        toast.error(err.message || "Gagal mengubah status");
      }
    });
  }

  function handleResolve() {
    if (!resolutionNote.trim()) {
      return;
    }
    startTransition(async () => {
      try {
        await resolveAlert(alert.id, resolutionNote);
        setShowResolveDialog(false);
        setResolutionNote("");
        toast.success("Notifikasi berhasil diselesaikan");
      } catch (err: any) {
        toast.error(err.message || "Gagal menyelesaikan notifikasi");
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Buka aksi notifikasi"
            className="inline-flex items-center justify-center size-8 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? (
              <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <DotsThree weight="regular" className="size-4" aria-hidden="true" />
            )}
            <span className="sr-only">Aksi</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Notifikasi
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Status Actions - Only for non-resolved alerts */}
          {!isResolved && (
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs">Ubah Status</DropdownMenuLabel>
              
              {!isOpen && (
                <DropdownMenuItem
                  onClick={handleSetOpen}
                  className="text-blue-600"
                >
                  <ArrowCounterClockwise weight="regular" className="size-4 mr-2" aria-hidden="true" />
                  Set Terbuka
                </DropdownMenuItem>
              )}
              
              {!isPendingStatus && (
                <DropdownMenuItem
                  onClick={handleSetPending}
                  className="text-amber-600"
                >
                  <Clock weight="regular" className="size-4 mr-2" aria-hidden="true" />
                  Set Pending
                </DropdownMenuItem>
              )}
              
              {!isInProgress && (
                <DropdownMenuItem
                  onClick={handleSetInProgress}
                  className="text-purple-600"
                >
                  <ArrowRight weight="regular" className="size-4 mr-2" aria-hidden="true" />
                  Sedang Dikerjakan
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
            </DropdownMenuGroup>
          )}

          {/* Resolve Action */}
          {!isResolved && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setShowResolveDialog(true);
              }}
              className="text-emerald-600"
            >
              <CheckCircle weight="regular" className="size-4 mr-2" aria-hidden="true" />
              Tandai Selesai
            </DropdownMenuItem>
          )}

          {/* View Detail */}
          <DropdownMenuItem asChild>
            <a href={`/dashboard/alerts/${alert.id}`}>
              <Eye weight="regular" className="size-4 mr-2" aria-hidden="true" />
              Lihat Detail
            </a>
          </DropdownMenuItem>

          {/* Resolved Info */}
          {isResolved && alert.resolvedBy && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-muted-foreground">
                Diselesaikan oleh: {alert.resolvedBy.name}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Resolve Dialog */}
      {showResolveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4 border">
            <h3 className="text-lg font-semibold mb-2">Selesaikan Notifikasi</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tambahkan catatan tentang bagaimana masalah ini diselesaikan.
            </p>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Contoh: Baterai telah diganti, sensor telah dibersihkan..."
              className="w-full px-3 py-2 text-sm border rounded-lg bg-background mb-4 min-h-[100px]"
              disabled={isPending}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowResolveDialog(false);
                  setResolutionNote("");
                }}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-accent transition-colors"
                disabled={isPending}
              >
                Batal
              </button>
              <button
                onClick={handleResolve}
                disabled={isPending || !resolutionNote.trim()}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isPending ? "Menyimpan..." : "Selesai"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
