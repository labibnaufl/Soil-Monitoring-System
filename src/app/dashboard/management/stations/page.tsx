import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StationActions } from "./_components/station-actions";
import { StationFormModal } from "./_components/station-form-modal";
import { MapPin, Radio, Users } from "@/components/icons";

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
    Promise.all([
      prisma.station.count(),
      prisma.device.count(),
      prisma.user.count({ where: { role: "ADMIN_LOCATION" } }),
    ]),
  ]);

  const [totalStations, totalDevices, totalAdmins] = statsData;

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

  function buildPageHref(targetPage: number) {
    const qs = new URLSearchParams();
    if (targetPage > 1) qs.set("page", String(targetPage));
    if (status) qs.set("status", status);
    if (search) qs.set("search", search);
    const q = qs.toString();
    return `/dashboard/management/stations${q ? `?${q}` : ""}`;
  }

  const startItem = total === 0 ? 0 : (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, total);

  return (
    <div>
      {/* Header */}
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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

      {/* Toolbar */}
      <form className="flex flex-wrap items-center gap-2 mb-4">
        <input
          name="search"
          type="text"
          placeholder="Cari nama, provinsi, kabupaten..."
          defaultValue={search}
          className="flex-1 min-w-0 px-3 py-2 text-sm border rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring"
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
            className="px-3 py-2 text-sm font-medium border rounded-lg hover:bg-accent transition-colors"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Count line */}
      <p className="text-sm text-muted-foreground mb-2">
        {total} stasiun
      </p>

      {/* Station Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[44rem]">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                  Nama
                </th>
                <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                  Koordinat
                </th>
                <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                  Perangkat
                </th>
                <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                  Admin
                </th>
                <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
                  Status
                </th>
                <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">
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
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{station.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {station.kabupaten}, {station.provinsi}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-xs font-mono text-muted-foreground">
                      {station.latitude.toFixed(6)},{" "}
                      {station.longitude.toFixed(6)}
                    </div>
                    <a
                      href={`https://maps.google.com/?q=${station.latitude},${station.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Lihat peta
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {station._count.devices}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {station._count.admins}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(station.status)}`}
                    >
                      {station.status === "AKTIF" ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <StationActions station={station} />
                  </td>
                </tr>
              ))}
              {stations.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-muted-foreground"
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
      {total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {startItem}-{endItem} dari {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildPageHref(page - 1)}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors"
              >
                Sebelumnya
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildPageHref(page + 1)}
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
