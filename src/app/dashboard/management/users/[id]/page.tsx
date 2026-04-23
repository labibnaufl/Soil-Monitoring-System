import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { UserDetailActions } from "./user-detail-actions";
import { ArrowLeft, Shield, Activity, CheckCircle2, XCircle } from "lucide-react";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      companyName: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      station: {
        select: {
          id: true,
          name: true,
          provinsi: true,
          kabupaten: true,
          kecamatan: true,
          desa: true,
        },
      },
    },
  });

  if (!user) notFound();

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isActive = user.status === "AKTIF";

  function getStatusColor(status: string) {
    switch (status) {
      case "AKTIF":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "NONAKTIF":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  }

  function getRoleColor(role: string) {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "ADMIN_LOCATION":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  }

  const infoRows = [
    { label: "Email", value: user.email },
    { label: "Nama Perusahaan", value: user.companyName || "-" },
    {
      label: "Lokasi Stasiun",
      value: user.station ? user.station.name : "Belum ditugaskan",
    },
    {
      label: "Tanggal Daftar",
      value: user.createdAt.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    {
      label: "Terakhir Diperbarui",
      value: user.updatedAt.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    user.lastLoginAt
      ? {
          label: "Login Terakhir",
          value: user.lastLoginAt.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }
      : { label: "Login Terakhir", value: "Belum pernah login" },
  ];

  return (
    <div>
      {/* Back */}
      <Link
        href="/dashboard/management/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Kembali ke daftar pengguna
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">
              {user.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}
          >
            {isActive ? (
              <CheckCircle2 className="size-3 mr-1" />
            ) : (
              <XCircle className="size-3 mr-1" />
            )}
            {user.status}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}
          >
            <Shield className="size-3 mr-1" />
            {user.role === "SUPER_ADMIN" ? "Super Admin" : "Admin Lokasi"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info Card */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-6">
          <h2 className="font-semibold font-heading text-foreground mb-4 flex items-center gap-2">
            <Activity className="size-4" />
            Informasi Pengguna
          </h2>
          <dl className="space-y-3">
            {infoRows.map((row) => (
              <div key={row.label} className="flex items-start gap-4">
                <dt className="w-40 shrink-0 text-sm text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* Station Detail */}
          {user.station && (
            <div className="mt-6 p-4 rounded-lg bg-muted/50">
              <h3 className="text-sm font-medium mb-2">Detail Stasiun</h3>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Provinsi:</span>{" "}
                  {user.station.provinsi}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Kabupaten:</span>{" "}
                  {user.station.kabupaten}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Kecamatan:</span>{" "}
                  {user.station.kecamatan}
                </p>
                {user.station.desa && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Desa:</span>{" "}
                    {user.station.desa}
                  </p>
                )}
              </div>
            </div>
          )}

          {!user.station && user.role === "ADMIN_LOCATION" && (
            <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm font-medium text-amber-800">
                Belum Ditugaskan ke Stasiun
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Admin lokasi ini belum ditugaskan ke stasiun mana pun.
              </p>
            </div>
          )}
        </div>

        {/* Actions Card */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold font-heading text-foreground mb-4">
            Aksi
          </h2>
          <UserDetailActions
            userId={user.id}
            name={user.name}
            currentRole={user.role}
            currentStatus={user.status}
            canModify={user.role !== "SUPER_ADMIN"}
          />
        </div>
      </div>
    </div>
  );
}
