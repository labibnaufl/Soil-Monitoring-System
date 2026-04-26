import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StationActions } from "./_components/station-actions";
import { StationFormModal } from "./_components/station-form-modal";
import {
  MapPin,
  Radio,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default async function StationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
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
  const page = parseInt(params.page || "1", 10);
  const perPage = 15;

  // Build where clause
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { provinsi: { contains: search, mode: "insensitive" } },
      { kabupaten: { contains: search, mode: "insensitive" } },
    ];
  }

  const [stations, total, statsData] = await Promise.all([
    prisma.station.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        _count: {
          select: { devices: true, admins: true },
        },
      },
    }),
    prisma.station.count({ where }),
    // Global stats
    Promise.all([
      prisma.station.count(),
      prisma.station.count({ where: { status: "AKTIF" } }),
      prisma.station.count({ where: { status: "NONAKTIF" } }),
      prisma.device.count(),
      prisma.user.count({ where: { role: "ADMIN_LOCATION" } }),
    ]),
  ]);

  const [
    totalStations,
    activeStations,
    inactiveStations,
    totalDevices,
    totalAdmins,
  ] = statsData;
  const totalPages = Math.ceil(total / perPage);

  const stats = [
    { label: "Total Stasiun", value: totalStations, icon: MapPin, color: "bg-blue-50 text-blue-600" },
    { label: "Total Perangkat", value: totalDevices, icon: Radio, color: "bg-green-50 text-green-600" },
    { label: "Total Admin", value: totalAdmins, icon: Users, color: "bg-orange-50 text-orange-600" },
  ];

  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "AKTIF", label: "Aktif" },
    { value: "NONAKTIF", label: "Nonaktif" },
  ];

  function getStatusColor(s: string) {
    return s === "AKTIF"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-red-100 text-red-700";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Kelola Stasiun
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manajemen lokasi stasiun pemantauan tanah
          </p>
        </div>
        <StationFormModal />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-4">
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
          placeholder="Cari nama, provinsi, atau kabupaten..."
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
            href="/dashboard/management/stations"
            className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-accent transition-colors"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Station Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Nama
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Lokasi
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Koordinat
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Perangkat
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Admin
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {stations.map((station) => (
                <tr
                  key={station.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{station.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {station.kabupaten}, {station.provinsi}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {station.latitude.toFixed(6)},{" "}
                    {station.longitude.toFixed(6)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(station.status)}`}
                    >
                      {station.status === "AKTIF" ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {station._count.devices}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {station._count.admins}
                  </td>
                  <td className="px-4 py-3">
                    <StationActions station={station} />
                  </td>
                </tr>
              ))}
              {stations.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Tidak ada stasiun ditemukan.
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
                href={`/dashboard/management/stations?page=${page - 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors"
              >
                Sebelumnya
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/management/stations?page=${page + 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
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
