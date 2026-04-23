"use client";

import { useState, useTransition } from "react";
import { createUser } from "../actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, UserPlus } from "lucide-react";

type Station = {
  id: string;
  name: string;
  provinsi: string;
  kabupaten: string;
};

export function UserFormModal({ stations }: { stations: Station[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const companyName = formData.get("companyName") as string;
    const stationId = formData.get("stationId") as string;

    if (!name || !email || !password || !stationId) {
      setError("Semua field wajib diisi");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    startTransition(async () => {
      try {
        await createUser({
          name,
          email,
          password,
          companyName: companyName || undefined,
          role: "ADMIN_LOCATION",
          stationId,
        });
        setIsOpen(false);
      } catch (err: any) {
        setError(err.message || "Gagal membuat pengguna");
      }
    });
  }

  return (
    <>
      {/* Trigger Button */}
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="size-4" />
        Tambah Pengguna
      </Button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-md rounded-xl border shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserPlus className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Tambah Pengguna</h2>
                  <p className="text-sm text-muted-foreground">
                    Buat akun admin lokasi baru
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
            <form action={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Masukkan nama lengkap"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  required
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Password minimal 8 karakter
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Nama Perusahaan (Opsional)</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="Nama perusahaan/organisasi"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stationId">Stasiun</Label>
                <select
                  id="stationId"
                  name="stationId"
                  required
                  disabled={isPending || stations.length === 0}
                  className="w-full h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                >
                  <option value="">Pilih stasiun...</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name} ({station.kabupaten}, {station.provinsi})
                    </option>
                  ))}
                </select>
                {stations.length === 0 && (
                  <p className="text-xs text-red-600">
                    Tidak ada stasiun tersedia. Silakan buat stasiun terlebih dahulu.
                  </p>
                )}
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
                  disabled={isPending || stations.length === 0}
                >
                  {isPending ? "Membuat..." : "Simpan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
