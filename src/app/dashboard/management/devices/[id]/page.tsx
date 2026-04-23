import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { DeviceDetailActions } from "./device-detail-actions";
import { EditDeviceModal } from "./_components/edit-device-modal";
import { ArrowLeft, Cpu, Radio, Battery, Signal, Activity, Calendar, Clock, CheckCircle2, XCircle, Wrench, Power, MapPin, Settings, Hash } from "lucide-react";

export default async function DeviceDetailPage({
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

  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      station: {
        select: {
          id: true,
          name: true,
          provinsi: true,
          kabupaten: true,
        },
      },
      _count: {
        select: { readings: true, alerts: true },
      },
    },
  });

  if (!device) {
    notFound();
  }

  // Get recent readings
  const recentReadings = await prisma.readings.findMany({
    where: { deviceId: id },
    orderBy: { dateTime: "desc" },
    take: 5,
    select: {
      id: true,
      dateTime: true,
      waterLevel: true,
      soilMoisture: true,
      soilTemperature: true,
      battery: true,
      signalStrength: true,
    },
  });

  // Get recent alerts
  const recentAlerts = await prisma.alert.findMany({
    where: { deviceId: id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      alertType: true,
      priority: true,
      status: true,
      message: true,
      createdAt: true,
    },
  });

  function getStatusColor(status: string) {
    switch (status) {
      case "BEROPERASI":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "MAINTENANCE":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "MATI":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "BEROPERASI":
        return CheckCircle2;
      case "MAINTENANCE":
        return Wrench;
      case "MATI":
        return Power;
      default:
        return XCircle;
    }
  }

  const infoRows = [
    { label: "ID Perangkat", value: device.deviceId, icon: Hash },
    { label: "Nama Perangkat", value: device.deviceName, icon: Cpu },
    {
      label: "Stasiun",
      value: device.station ? (
        <Link
          href={`/dashboard/management/stations/${device.station.id}`}
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          {device.station.name} <MapPin className="size-3" />
        </Link>
      ) : (
        <span className="text-amber-600">Belum terpasang</span>
      ),
      icon: MapPin,
    },
    { label: "Deskripsi", value: device.description || "-", icon: Settings },
    {
      label: "Interval Sampling",
      value: `${device.samplingInterval} detik (${(device.samplingInterval / 60).toFixed(0)} menit)`,
      icon: Clock,
    },
    {
      label: "Threshold Baterai Warning",
      value: `${device.batteryWarning}%`,
      icon: Battery,
    },
    {
      label: "Threshold Baterai Kritis",
      value: `${device.batteryCritical}%`,
      icon: Battery,
    },
    {
      label: "Panjang Pipa (cm)",
      value: device.pipeLength ? `${device.pipeLength} cm` : "-",
      icon: Settings,
    },
    {
      label: "Sisa Pipa (cm)",
      value: device.remainingPipe ? `${device.remainingPipe} cm` : "-",
      icon: Settings,
    },
    {
      label: "Dibuat",
      value: device.createdAt.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      icon: Calendar,
    },
    {
      label: "Diperbarui",
      value: device.updatedAt.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      icon: Calendar,
    },
  ];

  const stats = [
    {
      label: "Status",
      value: device.status === "BEROPERASI" ? "Beroperasi" : device.status === "MAINTENANCE" ? "Maintenance" : "Mati",
      icon: getStatusIcon(device.status),
      color: device.status === "BEROPERASI"
        ? "text-emerald-600 bg-emerald-50"
        : device.status === "MAINTENANCE"
        ? "text-amber-600 bg-amber-50"
        : "text-red-600 bg-red-50",
    },
    {
      label: "Total Data",
      value: device._count.readings.toLocaleString(),
      icon: Activity,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Notifikasi",
      value: device._count.alerts,
      icon: Signal,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div>
      {/* Back */}
      <Link
        href="/dashboard/management/devices"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Kembali ke daftar perangkat
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            <Cpu className="size-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">
              {device.deviceName}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-mono">
              {device.deviceId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}
          >
            {device.status === "BEROPERASI" && <CheckCircle2 className="size-3 mr-1" />}
            {device.status === "MAINTENANCE" && <Wrench className="size-3 mr-1" />}
            {device.status === "MATI" && <Power className="size-3 mr-1" />}
            {device.status}
          </span>
          <EditDeviceModal 
            device={{
              id: device.id,
              deviceId: device.deviceId,
              deviceName: device.deviceName,
              description: device.description,
              samplingInterval: device.samplingInterval,
              batteryWarning: device.batteryWarning,
              batteryCritical: device.batteryCritical,
              pipeLength: device.pipeLength,
              remainingPipe: device.remainingPipe,
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
              <Radio className="size-4" />
              Informasi Perangkat
            </h2>
            <dl className="space-y-3">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-start gap-4">
                  <dt className="w-40 shrink-0 text-sm text-muted-foreground flex items-center gap-2">
                    <row.icon className="size-4" />
                    {row.label}
                  </dt>
                  <dd className="text-sm font-medium text-foreground">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Recent Readings */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold font-heading text-foreground mb-4 flex items-center gap-2">
              <Activity className="size-4" />
              Data Terakhir (5 terbaru)
            </h2>
            {recentReadings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Waktu</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Water Level</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Soil Moisture</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Suhu Tanah</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Baterai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReadings.map((reading) => (
                      <tr key={reading.id} className="border-b last:border-0">
                        <td className="px-3 py-2 text-muted-foreground">
                          {reading.dateTime.toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-3 py-2">{reading.waterLevel?.toFixed(1) ?? "-"} cm</td>
                        <td className="px-3 py-2">{reading.soilMoisture?.toFixed(1) ?? "-"} %</td>
                        <td className="px-3 py-2">{reading.soilTemperature?.toFixed(1) ?? "-"} °C</td>
                        <td className="px-3 py-2">
                          <span className={`${(reading.battery ?? 100) < 20 ? "text-red-600" : "text-emerald-600"}`}>
                            {reading.battery?.toFixed(1) ?? "-"} %
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada data.</p>
            )}
            <div className="mt-4">
              <Link
                href={`/dashboard/devices/${device.id}/readings`}
                className="text-sm text-primary hover:underline"
              >
                Lihat semua data →
              </Link>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold font-heading text-foreground mb-4 flex items-center gap-2">
              <Signal className="size-4" />
              Notifikasi Terkait (5 terbaru)
            </h2>
            {recentAlerts.length > 0 ? (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.priority === "HIGH"
                        ? "border-red-200 bg-red-50"
                        : alert.priority === "MEDIUM"
                        ? "border-amber-200 bg-amber-50"
                        : "border-blue-200 bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {alert.alertType === "SOIL_MOISTURE"
                          ? "Kelembapan Tanah"
                          : alert.alertType === "LOW_BATTERY"
                          ? "Baterai Rendah"
                          : "Masa Hidup Gambut"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          alert.status === "OPEN"
                            ? "bg-amber-100 text-amber-700"
                            : alert.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {alert.status === "OPEN" ? "Terbuka" : alert.status === "RESOLVED" ? "Selesai" : alert.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.createdAt.toLocaleString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada notifikasi.</p>
            )}
            <div className="mt-4">
              <Link
                href={`/dashboard/alerts?deviceId=${device.id}`}
                className="text-sm text-primary hover:underline"
              >
                Lihat semua notifikasi →
              </Link>
            </div>
          </div>
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
            <DeviceDetailActions
              deviceId={device.id}
              deviceName={device.deviceName}
              currentStatus={device.status}
              hasReadings={device._count.readings > 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
