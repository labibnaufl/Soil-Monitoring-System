import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertActions } from "./_components/alert-actions";
import { MockAlertModal } from "./_components/mock-alert-modal";
import { Bell, AlertTriangle, CheckCircle2, Clock, AlertCircle, Filter } from "lucide-react";

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    type?: string;
    page?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const userStationId = session.user.stationId;

  const params = await searchParams;

  const status = params.status || "";
  const priority = params.priority || "";
  const type = params.type || "";
  const page = parseInt(params.page || "1", 10);
  const perPage = 15;

  // Build where clause
  const where: Record<string, unknown> = {};
  
  // Non-super admins only see their station's alerts
  if (!isSuperAdmin && userStationId) {
    where.stationId = userStationId;
  }
  
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (type) where.alertType = type;

  const [alerts, total, statsData, stations, devices] = await Promise.all([
    prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        station: { select: { name: true, provinsi: true, kabupaten: true } },
        device: { select: { deviceName: true, deviceId: true } },
        resolvedBy: { select: { name: true } },
      },
    }),
    prisma.alert.count({ where }),
    // Global stats (filtered by station for non-super admin)
    Promise.all([
      prisma.alert.count({ where: isSuperAdmin ? {} : { stationId: userStationId || undefined } }),
      prisma.alert.count({ where: { ...(isSuperAdmin ? {} : { stationId: userStationId || undefined }), status: "OPEN" } }),
      prisma.alert.count({ where: { ...(isSuperAdmin ? {} : { stationId: userStationId || undefined }), priority: "HIGH" } }),
      prisma.alert.count({ where: { ...(isSuperAdmin ? {} : { stationId: userStationId || undefined }), priority: "MEDIUM" } }),
      prisma.alert.count({ where: { ...(isSuperAdmin ? {} : { stationId: userStationId || undefined }), status: "RESOLVED" } }),
    ]),
    // Fetch stations and devices for mock alert modal
    prisma.station.findMany({
      where: { status: "AKTIF" },
      select: { id: true, name: true, provinsi: true, kabupaten: true },
      orderBy: { name: "asc" },
    }),
    prisma.device.findMany({
      select: { id: true, deviceId: true, deviceName: true },
      orderBy: { deviceName: "asc" },
    }),
  ]);

  const [totalAlerts, openAlerts, highPriority, mediumPriority, resolvedAlerts] = statsData;
  const totalPages = Math.ceil(total / perPage);

  const stats = [
    { label: "Total Notifikasi", value: totalAlerts, icon: Bell, color: "bg-blue-50 text-blue-600" },
    { label: "Terbuka", value: openAlerts, icon: AlertCircle, color: "bg-amber-50 text-amber-600", urgent: openAlerts > 0 },
    { label: "Prioritas Tinggi", value: highPriority, icon: AlertTriangle, color: "bg-red-50 text-red-600", urgent: highPriority > 0 },
    { label: "Prioritas Medium", value: mediumPriority, icon: Clock, color: "bg-orange-50 text-orange-600" },
    { label: "Selesai", value: resolvedAlerts, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
  ];

  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "OPEN", label: "Terbuka" },
    { value: "PENDING", label: "Pending" },
    { value: "IN_PROGRESS", label: "Sedang Dikerjakan" },
    { value: "RESOLVED", label: "Selesai" },
  ];

  const priorityOptions = [
    { value: "", label: "Semua Prioritas" },
    { value: "HIGH", label: "Tinggi" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Rendah" },
  ];

  const typeOptions = [
    { value: "", label: "Semua Tipe" },
    { value: "SOIL_MOISTURE", label: "Kelembapan Tanah" },
    { value: "LOW_BATTERY", label: "Baterai Rendah" },
    { value: "PEATLAND_LIFESPAN", label: "Masa Hidup Gambut" },
  ];

  function getStatusBadge(s: string) {
    switch (s) {
      case "OPEN":
        return "bg-amber-100 text-amber-700";
      case "PENDING":
        return "bg-blue-100 text-blue-700";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-700";
      case "RESOLVED":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  function getStatusLabel(s: string) {
    switch (s) {
      case "OPEN":
        return "Terbuka";
      case "PENDING":
        return "Pending";
      case "IN_PROGRESS":
        return "Sedang Dikerjakan";
      case "RESOLVED":
        return "Selesai";
      default:
        return s;
    }
  }

  function getPriorityBadge(p: string) {
    switch (p) {
      case "HIGH":
        return "bg-red-100 text-red-700";
      case "MEDIUM":
        return "bg-orange-100 text-orange-700";
      case "LOW":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  function getPriorityLabel(p: string) {
    switch (p) {
      case "HIGH":
        return "Tinggi";
      case "MEDIUM":
        return "Medium";
      case "LOW":
        return "Rendah";
      default:
        return p;
    }
  }

  function getTypeLabel(t: string) {
    switch (t) {
      case "SOIL_MOISTURE":
        return "Kelembapan Tanah";
      case "LOW_BATTERY":
        return "Baterai Rendah";
      case "PEATLAND_LIFESPAN":
        return "Masa Hidup Gambut";
      default:
        return t;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Notifikasi & Peringatan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola peringatan sistem dan respon insiden
          </p>
        </div>
        {isSuperAdmin && <MockAlertModal stations={stations} devices={devices} />}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-4 ${stat.urgent ? "border-red-200 bg-red-50/50" : "bg-card"}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg ${stat.color}`}>
                <stat.icon className="size-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-heading text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-center gap-3 mb-6">
        <select
          name="status"
          defaultValue={status}
          className="px-3 py-2 text-sm border rounded-lg bg-background"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          name="priority"
          defaultValue={priority}
          className="px-3 py-2 text-sm border rounded-lg bg-background"
        >
          {priorityOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={type}
          className="px-3 py-2 text-sm border rounded-lg bg-background"
        >
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Filter className="size-4 inline mr-1" />
          Filter
        </button>
        {(status || priority || type) && (
          <Link
            href="/dashboard/alerts"
            className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-accent transition-colors"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Alerts Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Tipe</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Prioritas</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Pesan</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Stasiun</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Perangkat</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Waktu</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {getTypeLabel(alert.alertType)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(alert.priority)}`}>
                      {getPriorityLabel(alert.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(alert.status)}`}>
                      {getStatusLabel(alert.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate" title={alert.message || "-"}>
                      {alert.message || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {alert.station ? alert.station.name : "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {alert.device ? alert.device.deviceName : "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {alert.createdAt.toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <AlertActions alert={alert} />
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Tidak ada notifikasi ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/dashboard/alerts?page=${page - 1}${status ? `&status=${status}` : ""}${priority ? `&priority=${priority}` : ""}${type ? `&type=${type}` : ""}`}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors"
              >
                Sebelumnya
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/alerts?page=${page + 1}${status ? `&status=${status}` : ""}${priority ? `&priority=${priority}` : ""}${type ? `&type=${type}` : ""}`}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors"
              >
                Selanjutnya
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
