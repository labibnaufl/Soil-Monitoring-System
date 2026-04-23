"use client";

import { useState, useTransition } from "react";
import { assignAdminToStation, unassignAdminFromStation, getAvailableAdmins } from "../../actions/assignment";
import { Button } from "@/components/ui/button";
import { Plus, X, Users, UserCheck, UserX, Trash2 } from "lucide-react";

type Admin = {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  status: string;
};

export function AdminAssignmentSection({
  stationId,
  admins,
}: {
  stationId: string;
  admins: Admin[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [availableAdmins, setAvailableAdmins] = useState<Admin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  async function loadAvailableAdmins() {
    setIsOpen(true);
    setError(null);
    setLoadingAdmins(true);
    try {
      const admins = await getAvailableAdmins();
      setAvailableAdmins(admins);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAdmins(false);
    }
  }

  function handleAssign(adminId: string, adminName: string) {
    if (!confirm(`Tugaskan admin ${adminName} ke stasiun ini?`)) return;
    
    startTransition(async () => {
      try {
        await assignAdminToStation(stationId, adminId);
        setAvailableAdmins(prev => prev.filter(a => a.id !== adminId));
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  function handleUnassign(adminId: string, adminName: string) {
    if (!confirm(`Hapus admin ${adminName} dari stasiun ini?`)) return;
    
    startTransition(async () => {
      try {
        await unassignAdminFromStation(stationId, adminId);
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  function getStatusColor(status: string) {
    return status === "AKTIF"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-red-100 text-red-700";
  }

  function getStatusIcon(status: string) {
    return status === "AKTIF" ? <UserCheck className="size-3" /> : <UserX className="size-3" />;
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold font-heading text-foreground flex items-center gap-2">
          <Users className="size-4" />
          Admin Lokasi
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={loadAvailableAdmins}
          disabled={isPending}
          className="gap-1"
        >
          <Plus className="size-4" />
          Tambah Admin
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Assigned Admins List */}
      {admins.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="size-12 mx-auto mb-3 opacity-20" />
          <p>Belum ada admin tertugas</p>
          <p className="text-sm mt-1">
            Klik "Tambah Admin" untuk menugaskan admin lokasi
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-background"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                  {admin.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{admin.name}</p>
                  <p className="text-xs text-muted-foreground">{admin.email}</p>
                  {admin.companyName && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {admin.companyName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(admin.status)}`}>
                  {getStatusIcon(admin.status)}
                  {admin.status === "AKTIF" ? "Aktif" : "Nonaktif"}
                </span>
                <button
                  onClick={() => handleUnassign(admin.id, admin.name)}
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

      {/* Modal for Available Admins */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-lg rounded-xl border shadow-lg max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Pilih Admin Lokasi</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="size-8 rounded-md hover:bg-accent flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {loadingAdmins ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p>Memuat admin...</p>
                </div>
              ) : availableAdmins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="size-12 mx-auto mb-3 opacity-20" />
                  <p>Tidak ada admin tersedia</p>
                  <p className="text-sm mt-1">
                    Semua admin lokasi sudah ditugaskan ke stasiun.
                    <br />
                    <a
                      href="/dashboard/management/users"
                      className="text-primary hover:underline"
                    >
                      Buat admin lokasi baru
                    </a>
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableAdmins.map((admin) => (
                    <button
                      key={admin.id}
                      onClick={() => handleAssign(admin.id, admin.name)}
                      disabled={isPending}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{admin.name}</p>
                          <p className="text-xs text-muted-foreground">{admin.email}</p>
                          {admin.companyName && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {admin.companyName}
                            </p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(admin.status)}`}>
                          {getStatusIcon(admin.status)}
                          {admin.status === "AKTIF" ? "Aktif" : "Nonaktif"}
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
