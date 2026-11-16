import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeviceActions } from "./_components/device-actions";
import { DeviceFormModal } from "./_components/device-form-modal";
import { Cpu, Power, MapPin } from "@/components/icons";
import { StatusBadge } from "@/components/ui/status-badge";
import { getStatusBadge, getStatusLabel } from "@/lib/badge-helpers";

export default async function DevicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
    prefill?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const status = params.status || "";
  const search = params.search || "";
  const prefill = params.prefill || "";
  const page = parseInt(params.page || "1", 10);
  const perPage = 15;

  // Build where clause
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { deviceName: { contains: search, mode: "insensitive" } },
      { deviceId: { contains: search, mode: "insensitive" } },
      { station: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [devices, total, statsData, stations, recentRejected] = await Promise.all([
    prisma.device.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        station: { select: { name: true, provinsi: true, kabupaten: true } },
        _count: {
          select: { readings: true },
        },
        readings: {
          select: { dateTime: true },
          orderBy: { dateTime: "desc" },
          take: 1,
        },
      },
    }),
    prisma.device.count({ where }),
    // Global stats
    Promise.all([
      prisma.device.count(),
      prisma.device.count({ where: { status: "BEROPERASI" } }),
      prisma.device.count({ where: { status: "MAINTENANCE" } }),
      prisma.device.count({ where: { status: "MATI" } }),
      prisma.device.count({ where: { stationId: null } }),
    ]),
    // Fetch stations for the form
    prisma.station.findMany({
      where: { status: "AKTIF" },
      select: { id: true, name: true, provinsi: true, kabupaten: true },
      orderBy: { name: "asc" },
    }),
    // Recent rejected senders for the unclaimed inbox (latest 200, grouped below)
    prisma.rejectedReading.findMany({
      orderBy: { receivedAt: "desc" },
      take: 200,
      select: { deviceId: true, receivedAt: true },
    }),
  ]);

  const [
    totalDevices,
    operatingDevices,
    maintenanceDevices,
    offlineDevices,
    unassignedDevices,
  ] = statsData;
  const totalPages = Math.ceil(total / perPage);

  // Group rejected senders: unknown IDs with hit count + last seen.
  // Resolves against registered IDs so claimed senders drop out of the inbox.
  const registeredIds = new Set(devices.map((d) => d.deviceId));
  const unclaimed = new Map<string, { count: number; lastSeen: Date }>();
  for (const r of recentRejected) {
    if (registeredIds.has(r.deviceId)) continue;
    const entry = unclaimed.get(r.deviceId);
    if (entry) {
      entry.count += 1;
    } else {
      unclaimed.set(r.deviceId, { count: 1, lastSeen: r.receivedAt });
    }
  }
  const unclaimedList = [...unclaimed.entries()]
    .map(([deviceId, info]) => ({ deviceId, ...info }))
    .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
    .slice(0, 10);

  const stats = [
    { label: "Total Perangkat", value: totalDevices, icon: Cpu, color: "bg-blue-50 text-blue-600" },
    { label: "Mati/Offline", value: offlineDevices, icon: Power, color: "bg-red-50 text-red-600", urgent: offlineDevices > 0 },
    { label: "Belum Terpasang", value: unassignedDevices, icon: MapPin, color: "bg-orange-50 text-orange-600" },
  ];

  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "BEROPERASI", label: "Beroperasi" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "MATI", label: "Mati" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Kelola Perangkat
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manajemen perangkat IoT dan sensor pemantauan
          </p>
        </div>
        <DeviceFormModal stations={stations} prefillDeviceId={prefill} />
      </div>

      {/* Unclaimed senders inbox */}
      {unclaimedList.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 mb-6">
          <h2 className="text-sm font-semibold text-amber-800 mb-1">
            ID Tak Dikenal ({unclaimedList.length})
          </h2>
          <p className="text-xs text-amber-700 mb-3">
            Perangkat ini mengirim data tapi belum terdaftar — kemungkinan salah
            ketik ID atau hardware baru.
          </p>
          <div className="space-y-2">
            {unclaimedList.map((u) => (
              <div
                key={u.deviceId}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2"
              >
                <div>
                  <p className="text-sm font-mono font-medium">{u.deviceId}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.count}x ditolak · terakhir{" "}
                    {u.lastSeen.toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Link
                  href={`/dashboard/management/devices?prefill=${encodeURIComponent(u.deviceId)}`}
                  className="shrink-0 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  Daftarkan
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border p-4 ${stat.urgent ? "border-red-200 bg-red-50/50" : "bg-card"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg ${stat.color}`}>
                <stat.icon className="size-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-heading text-foreground">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-center gap-3 mb-6">
        <input
          name="search"
          type="text"
          placeholder="Cari nama, ID perangkat, atau stasiun..."
          defaultValue={search}
          className="flex-1 min-w-50 px-3 py-2 text-sm border rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          name="status"
          defaultValue={status}
          className="px-3 py-2 text-sm border rounded-lg bg-background"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Filter
        </button>
        {(search || status) && (
          <Link
            href="/dashboard/management/devices"
            className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-accent transition-colors"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Device Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Nama Perangkat
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  ID Perangkat
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Stasiun
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Interval (detik)
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Data
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr
                  key={device.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{device.deviceName}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                    {device.deviceId}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const statusBadge = getStatusBadge(device.status);
                      const label = getStatusLabel(device.status);
                      return (
                        <StatusBadge intent={statusBadge.intent} title={label}>
                          {label}
                        </StatusBadge>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {device.station ? (
                      <span>{device.station.name}</span>
                    ) : (
                      <span className="text-amber-600">Belum terpasang</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {device.samplingInterval}s
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {device._count.readings === 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                        Menunggu data pertama
                      </span>
                    ) : (
                      <>
                        {device._count.readings.toLocaleString()}
                        {(() => {
                          const lastSeen = device.readings[0]?.dateTime;
                          if (!lastSeen) return null;
                          const intervalMs =
                            (device.samplingInterval || 300) * 1000 * 2;
                          if (Date.now() - lastSeen.getTime() <= intervalMs) {
                            return null;
                          }
                          return (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              Offline? Tidak ada data baru
                            </span>
                          );
                        })()}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DeviceActions device={device} stations={stations} />
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Tidak ada perangkat ditemukan.
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
                href={`/dashboard/management/devices?page=${page - 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors"
              >
                Sebelumnya
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/management/devices?page=${page + 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
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
