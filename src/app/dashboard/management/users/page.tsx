import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserActions } from "./_components/user-actions";
import { UserFormModal } from "./_components/user-form-modal";
import { Users, UserCheck, UserX, Shield, MapPin } from "lucide-react";

export default async function UsersPage({
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
      { email: { contains: search, mode: "insensitive" } },
      { station: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [users, total, statsData, stations] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        station: { select: { name: true } },
      },
    }),
    prisma.user.count({ where }),
    // Global stats (not filtered by searchParams)
    Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "AKTIF" } }),
      prisma.user.count({ where: { status: "NONAKTIF" } }),
      prisma.user.count({ where: { role: "ADMIN_LOCATION" } }),
    ]),
    // Fetch stations for the form
    prisma.station.findMany({
      where: { status: "AKTIF" },
      select: { id: true, name: true, provinsi: true, kabupaten: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const [totalUsers, activeUsers, inactiveUsers, adminLokasi] = statsData;
  const totalPages = Math.ceil(total / perPage);

  const stats = [
    { label: "Total Pengguna", value: totalUsers, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Pengguna Aktif", value: activeUsers, icon: UserCheck, color: "bg-emerald-50 text-emerald-600" },
    { label: "Nonaktif / Diblokir", value: inactiveUsers, icon: UserX, color: "bg-red-50 text-red-600", urgent: inactiveUsers > 0 },
    { label: "Admin Lokasi", value: adminLokasi, icon: MapPin, color: "bg-purple-50 text-purple-600" },
    { label: "Super Admin", value: totalUsers - adminLokasi, icon: Shield, color: "bg-indigo-50 text-indigo-600" },
  ];

  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "AKTIF", label: "Aktif" },
    { value: "NONAKTIF", label: "Nonaktif" },
  ];

  function getRoleBadge(r: string) {
    switch (r) {
      case "SUPER_ADMIN":
        return "bg-indigo-100 text-indigo-700";
      case "ADMIN_LOCATION":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Kelola Pengguna
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manajemen admin lokasi dan hak akses sistem
          </p>
        </div>
        <UserFormModal stations={stations} />
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
        <input
          name="search"
          type="text"
          placeholder="Cari nama, email, atau stasiun..."
          defaultValue={search}
          className="flex-1 min-w-[200px] px-3 py-2 text-sm border rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          name="status"
          defaultValue={status}
          className="px-3 py-2 text-sm border rounded-lg bg-background"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
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
            href="/dashboard/management/users"
            className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-accent transition-colors"
          >
            Reset
          </Link>
        )}
      </form>

      {/* User Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Nama</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Lokasi Stasiun</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Tgl Daftar</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                      {user.role === "SUPER_ADMIN" ? "Super Admin" : "Admin Lokasi"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.status === "AKTIF" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {user.status === "AKTIF" ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.station ? user.station.name : "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {user.createdAt.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <UserActions user={user} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Tidak ada pengguna ditemukan.
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
                href={`/dashboard/management/users?page=${page - 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors"
              >
                Sebelumnya
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/management/users?page=${page + 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
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
