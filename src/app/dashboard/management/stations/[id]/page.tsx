import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { StationDetailActions } from "./station-detail-actions";
import { DeviceAssignmentSection } from "./_components/device-assignment-section";
import { AdminAssignmentSection } from "./_components/admin-assignment-section";
import { EditStationModal } from "../_components/edit-station-modal";
import { ArrowLeft, MapPin, Radio, Users, Activity, CheckCircle2, XCircle, ExternalLink, Calendar, Clock } from "lucide-react";

export default async function StationDetailPage({
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

  const station = await prisma.station.findUnique({
    where: { id },
    include: {
      _count: {
        select: { devices: true, admins: true },
      },
    },
  });

  if (!station) {
    notFound();
  }

  const devices = await prisma.device.findMany({
    where: { stationId: id },
    select: {
      id: true,
      deviceId: true,
      deviceName: true,
      status: true,
      description: true,
      createdAt: true,
    },
    orderBy: { deviceName: "asc" },
  });

  const admins = await prisma.user.findMany({
    where: { stationId: id, role: "ADMIN_LOCATION" },
    select: {
      id: true,
      name: true,
      email: true,
      companyName: true,
      status: true,
    },
    orderBy: { name: "asc" },
  });

  const isActive = station.status === "AKTIF";

  function getStatusColor(status: string) {
    return status === "AKTIF"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : "bg-red-100 text-red-700 border-red-200";
  }

  const infoRows = [
    { label: "Provinsi", value: station.provinsi },
    { label: "Kabupaten/Kota", value: station.kabupaten },
    { label: "Kecamatan", value: station.kecamatan },
    { label: "Desa", value: station.desa || "-" },
    {
      label: "Koordinat",
      value: `${station.latitude.toFixed(6)}, ${station.longitude.toFixed(6)}`,
    },
    {
      label: "Google Maps",
      value: station.mapsLink ? (
        <a
          href={station.mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          Buka di Maps <ExternalLink className="size-3" />
        </a>
      ) : (
        "-"
      ),
    },
    {
      label: "Dibuat",
      value: station.createdAt.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    {
      label: "Diperbarui",
      value: station.updatedAt.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ];

  const stats = [
    {
      label: "Status",
      value: isActive ? "Aktif" : "Nonaktif",
      icon: isActive ? CheckCircle2 : XCircle,
      color: isActive ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50",
    },
    {
      label: "Perangkat",
      value: station._count.devices,
      icon: Radio,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Admin",
      value: station._count.admins,
      icon: Users,
      color: "text-indigo-600 bg-indigo-50",
    },
  ];

  return (
    <div>
      {/* Back */}
      <Link
        href="/dashboard/management/stations"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Kembali ke daftar stasiun
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            <MapPin className="size-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">
              {station.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {station.kabupaten}, {station.provinsi}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(station.status)}`}
          >
            {isActive ? <CheckCircle2 className="size-3 mr-1" /> : <XCircle className="size-3 mr-1" />}
            {station.status}
          </span>
          <EditStationModal 
            station={{
              id: station.id,
              name: station.name,
              provinsi: station.provinsi,
              kabupaten: station.kabupaten,
              kecamatan: station.kecamatan,
              desa: station.desa,
              latitude: station.latitude,
              longitude: station.longitude,
            }} 
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold font-heading text-foreground mb-4 flex items-center gap-2">
              <Activity className="size-4" />
              Informasi Stasiun
            </h2>
            <dl className="space-y-3">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-start gap-4">
                  <dt className="w-32 shrink-0 text-sm text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="text-sm font-medium text-foreground">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Devices Section */}
          <DeviceAssignmentSection
            stationId={station.id}
            devices={devices}
            isActive={isActive}
          />

          {/* Admins Section */}
          <AdminAssignmentSection
            stationId={station.id}
            admins={admins}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold font-heading text-foreground mb-4">
              Statistik
            </h2>
            <div className="space-y-3">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-semibold">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold font-heading text-foreground mb-4">
              Aksi
            </h2>
            <StationDetailActions
              stationId={station.id}
              name={station.name}
              currentStatus={station.status}
              deviceCount={station._count.devices}
              adminCount={station._count.admins}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
