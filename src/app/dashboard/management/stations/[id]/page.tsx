import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { StationMapLoader } from "./_components/station-map-loader";
import { StationDetailActions } from "./station-detail-actions";
import { DeviceAssignmentSection } from "./_components/device-assignment-section";
import { AdminAssignmentSection } from "./_components/admin-assignment-section";
import { EditStationModal } from "../_components/edit-station-modal";
import { ArrowLeft, MapPin, Radio, Users, Heartbeat, CheckCircle, XCircle, ArrowSquareOut, TrendUp } from "@/components/icons";

export default async function StationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const tab = (await searchParams)?.tab ?? "informasi";
  const validTab = ["informasi", "ai"].includes(tab) ? tab : "informasi";

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

  // Latest AI prediction snapshot per device (persisted by GET /api/ews/predict).
  const snapshots = await prisma.aIInsight.findMany({
    where: { stationId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      analysisEnd: true,
      riskAssessment: true,
    },
  });

  const deviceByHardwareId = new Map(devices.map((d) => [d.deviceId, d]));
  const perDeviceInsight: {
    key: string;
    deviceId: string;
    deviceName: string;
    detailId: string | null;
    availability: string;
    at: Date | null;
    methodSummary: string | null;
  }[] = [];
  const seenDevice = new Set<string>();
  for (const s of snapshots) {
    const r = s.riskAssessment as {
      deviceId?: unknown;
      availability?: unknown;
      methodPerSensor?: unknown;
    } | null;
    const hw = typeof r?.deviceId === "string" ? r.deviceId : null;
    if (!hw || seenDevice.has(hw)) continue;
    seenDevice.add(hw);
    const d = deviceByHardwareId.get(hw);
    const methods = r?.methodPerSensor;
    perDeviceInsight.push({
      key: s.id,
      deviceId: hw,
      deviceName: d?.deviceName ?? hw,
      detailId: d?.id ?? null,
      availability:
        typeof r?.availability === "string" ? r.availability : "unknown",
      at: s.analysisEnd,
      methodSummary:
        methods && typeof methods === "object"
          ? Object.entries(methods as Record<string, string>)
              .map(([k, v]) => `${k}=${v}`)
              .join(" · ")
          : null,
    });
  }

  function insightBadge(availability: string) {
    if (availability === "ready")
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (availability === "stale_data" || availability === "insufficient_history")
      return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  }

  const isActive = station.status === "AKTIF";

  function getStatusColor(status: string) {
    return status === "AKTIF"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : "bg-red-100 text-red-700 border-red-200";
  }

  const peatTypeLabel =
    station.peatType === "FIBRIC" ? "Fibric — gambut mentah, serat tinggi"
    : station.peatType === "HEMIC" ? "Hemic — gambut setengah matang"
    : station.peatType === "SAPRIC" ? "Sapric — gambut matang, serat rendah"
    : "Belum ditentukan";

  const stats = [
    {
      label: "Status",
      value: isActive ? "Aktif" : "Nonaktif",
      icon: isActive ? CheckCircle : XCircle,
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

  const tabs = [
    { key: "informasi", label: "Informasi" },
    { key: "ai", label: "AI Insight" },
  ];

  function tabHref(key: string) {
    return key === "informasi"
      ? `/dashboard/management/stations/${id}`
      : `/dashboard/management/stations/${id}?tab=${key}`;
  }

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
            {isActive ? <CheckCircle className="size-3 mr-1" /> : <XCircle className="size-3 mr-1" />}
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
              peatType: station.peatType,
            }}
          />
        </div>
      </div>

      <div className="space-y-4 lg:space-y-5">
        <nav className="border-b">
          <div className="flex overflow-x-auto -mb-px">
                {tabs.map((t) => {
                  const active = t.key === validTab;
                  return (
                    <Link
                      key={t.key}
                      href={tabHref(t.key)}
                      className={cn(
                        "inline-flex shrink-0 items-center px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                        active
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {validTab === "informasi" && (
              <div className="grid gap-4 lg:gap-5 xl:grid-cols-5">
                <div className="xl:col-span-3 space-y-4 lg:space-y-5">
                <section className="rounded-xl border bg-card p-5 md:p-6">
                  <h2 className="font-semibold font-heading text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="size-4" />
                    Wilayah
                  </h2>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Provinsi</p>
                      <p className="text-sm font-medium text-foreground">{station.provinsi}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Kabupaten/Kota</p>
                      <p className="text-sm font-medium text-foreground">{station.kabupaten}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Kecamatan</p>
                      <p className="text-sm font-medium text-foreground">{station.kecamatan}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Desa</p>
                      <p className="text-sm font-medium text-foreground">{station.desa || "-"}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border bg-card p-5 md:p-6">
                  <h2 className="font-semibold font-heading text-foreground mb-4 flex items-center gap-2">
                    <Heartbeat className="size-4" />
                    Lahan & Posisi
                  </h2>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Jenis Lahan Gambut</p>
                      <p className="text-sm font-medium text-foreground">{peatTypeLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Koordinat</p>
                      <p className="text-sm font-medium font-mono text-foreground">
                        {station.latitude.toFixed(6)}, {station.longitude.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Google Maps</p>
                      <p className="text-sm font-medium text-foreground">
                        {station.mapsLink ? (
                          <a
                            href={station.mapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            Buka di Maps <ArrowSquareOut className="size-3" />
                          </a>
                        ) : (
                          "-"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dibuat</p>
                      <p className="text-sm font-medium text-foreground">
                        {station.createdAt.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Diperbarui</p>
                      <p className="text-sm font-medium text-foreground">
                        {station.updatedAt.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </section>

                <DeviceAssignmentSection
                  stationId={station.id}
                  devices={devices}
                  isActive={isActive}
                />

                <AdminAssignmentSection
                  stationId={station.id}
                  admins={admins}
                />
              </div>

              <div className="xl:col-span-2 space-y-4 lg:space-y-5">
            <section className="rounded-xl border bg-card p-5 md:p-6">
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
              <div className="mt-4 border-t pt-4">
                <StationDetailActions
                  stationId={station.id}
                  name={station.name}
                  currentStatus={station.status}
                  deviceCount={station._count.devices}
                  adminCount={station._count.admins}
                />
              </div>
            </section>

            <section className="rounded-xl border bg-card p-5 md:p-6">
              <h2 className="font-semibold font-heading text-foreground mb-3 flex items-center gap-2">
                <MapPin className="size-4" />
                Lokasi Stasiun
              </h2>
              <StationMapLoader
                name={station.name}
                kabupaten={station.kabupaten}
                provinsi={station.provinsi}
                latitude={station.latitude}
                longitude={station.longitude}
                mapsLink={station.mapsLink}
              />
            </section>
          </div>
        </div>
        )}

        {validTab === "ai" && (
          <section className="rounded-xl border bg-card p-5 md:p-6">
            <h2 className="font-semibold font-heading text-foreground mb-4 flex items-center gap-2">
              <TrendUp className="size-4" />
              AI Insight
            </h2>
            {perDeviceInsight.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada snapshot prediksi untuk stasiun ini. Snapshot tersimpan
                otomatis setiap kali prediksi berhasil dimuat.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {perDeviceInsight.map((row) => (
                  <div
                    key={row.key}
                    className="p-3 rounded-lg border"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {row.deviceName}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {row.deviceId}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {row.at
                            ? row.at.toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </p>
                        {row.methodSummary && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {row.methodSummary}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${insightBadge(row.availability)}`}
                        >
                          {row.availability}
                        </span>
                        {row.detailId && (
                          <Link
                            href={`/dashboard/management/devices/${row.detailId}`}
                            className="text-xs text-primary hover:underline whitespace-nowrap"
                          >
                            Detail
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
