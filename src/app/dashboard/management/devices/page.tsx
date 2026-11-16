import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeviceActions } from "./_components/device-actions";
import { DeviceFormModal } from "./_components/device-form-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { getStatusBadge, getStatusLabel } from "@/lib/badge-helpers";
import { Cpu, Power, MapPin } from "@/components/icons";

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

  const rawStatus = params.status || "";
  const search = params.search || "";
  const prefill = params.prefill || "";
  const page = parseInt(params.page || "1", 10);
  const perPage = 15;

  // Build where clause. The "UNASSIGNED" tab maps to devices without a station.
  const where: Record<string, unknown> = {};
  if (rawStatus === "UNASSIGNED") {
    where.stationId = null;
  } else if (rawStatus) {
    where.status = rawStatus;
  }
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
      },
    }),
    prisma.device.count({ where }),
    Promise.all([
      prisma.device.count(),
      prisma.device.count({ where: { status: "MATI" } }),
      prisma.device.count({ where: { stationId: null } }),
    ]),
    prisma.station.findMany({
      where: { status: "AKTIF" },
      select: { id: true, name: true, provinsi: true, kabupaten: true },
      orderBy: { name: "asc" },
    }),
    prisma.rejectedReading.findMany({
      orderBy: { receivedAt: "desc" },
      take: 200,
      select: { deviceId: true, receivedAt: true },
    }),
  ]);

  const [totalDevices, offlineDevices, unassignedDevices] = statsData;
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

  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "BEROPERASI", label: "Beroperasi" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "MATI", label: "Mati" },
    { value: "UNASSIGNED", label: "Belum Terpasang" },
  ];

  const stats = [
    { label: "Total Perangkat", value: totalDevices, icon: Cpu, color: "bg-blue-50 text-blue-600" },
    { label: "Mati/Offline", value: offlineDevices, icon: Power, color: "bg-red-50 text-red-600", urgent: offlineDevices > 0 },
    { label: "Belum Terpasang", value: unassignedDevices, icon: MapPin, color: "bg-orange-50 text-orange-600" },
  ];

  function pageHref(targetPage: number) {
    const qs = new URLSearchParams();
    if (targetPage > 1) qs.set("page", String(targetPage));
    if (rawStatus) qs.set("status", rawStatus);
    if (search) qs.set("search", search);
    const s = qs.toString();
    return `/dashboard/management/devices${s ? `?${s}` : ""}`;
  }

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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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

      {/* Unclaimed senders banner */}
      {unclaimedList.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 mb-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-medium text-amber-800">
              ID Tak Dikenal ({unclaimedList.length})
            </span>
            <div className="flex flex-wrap items-center gap-1 text-xs">
              {unclaimedList.slice(0, 5).map((u, i, arr) => (
                <span key={u.deviceId} className="inline-flex items-center gap-1">
                  <Link
                    href={`/dashboard/management/devices?prefill=${encodeURIComponent(u.deviceId)}`}
                    className="font-mono font-medium text-amber-700 hover:text-amber-900 hover:underline"
                  >
                    {u.deviceId}
                  </Link>
                  {i < arr.length - 1 && (
                    <span className="text-amber-400">·</span>
                  )}
                </span>
              ))}
              {unclaimedList.length > 5 && (
                <span className="text-amber-600">
                  +{unclaimedList.length - 5} lainnya
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <form className="flex flex-wrap items-center gap-2 mb-4">
        <input
          name="search"
          type="text"
          placeholder="Cari nama, ID, atau stasiun..."
          defaultValue={search}
          className="flex-1 min-w-[12rem] px-2.5 py-1.5 text-sm border rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          name="status"
          defaultValue={rawStatus}
          className="px-2.5 py-1.5 text-sm border rounded-lg bg-background"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input type="hidden" name="page" value="1" />
        <button
          type="submit"
          className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Filter
        </button>
        {(search || rawStatus) && (
          <Link
            href="/dashboard/management/devices"
            className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-accent transition-colors"
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
                <th className="px-3 py-2 font-medium text-muted-foreground">
                  Alat
                </th>
                <th className="px-3 py-2 font-medium text-muted-foreground">
                  Stasiun
                </th>
                <th className="px-3 py-2 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-3 py-2 font-medium text-muted-foreground">
                  Bacaan
                </th>
                <th className="px-3 py-2 font-medium text-muted-foreground">
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
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-foreground">
                      {device.deviceName}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {device.deviceId}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    {device.station ? (
                      <div>
                        <div className="font-medium text-foreground">
                          {device.station.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {device.station.kabupaten}, {device.station.provinsi}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600">
                        Belum terpasang
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
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
                  <td className="px-3 py-2.5">
                    {device._count.readings === 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                        Menunggu
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {device._count.readings.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <DeviceActions device={device} stations={stations} />
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-muted-foreground"
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
          <p className="text-xs text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="px-2.5 py-1 text-xs border rounded-lg hover:bg-accent transition-colors"
              >
                Sebelumnya
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="px-2.5 py-1 text-xs border rounded-lg hover:bg-accent transition-colors"
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
