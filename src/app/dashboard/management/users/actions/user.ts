"use server"

import {prisma} from "@/lib/prisma";
import {auth} from "@/lib/auth";
import {revalidatePath} from "next/cache";
import bcrypt from "bcryptjs";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error ("Anda Tidak Memiliki Izin Untuk Mengakses Halaman Ini");
  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== "ADMIN") {
    throw new Error ("Anda Tidak Memiliki Izin Untuk Mengakses Halaman Ini");
  }

  return session;

}

//CREATE USER

export async function createUser (data: {
  name: string;
  email: string;
  password: string;
  companyName?: string;
  role: 'ADMIN_LOCATION';
  stationId: string;
}) {
  const session = await requireSuperAdmin();
  if (data.role === "ADMIN_LOCATION" && !data.stationId) {
    throw new Error ("Admin Lokasi Harus Mempunyai Stasiun untuk Ditempatkan");
  }
  const existing = await prisma.user.findUnique({
    where:{email: data.email},
  });
  if (existing) throw new Error ("Email Sudah Terdaftar");

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data:{
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      companyName: data.companyName,
      stationId: data.role === "ADMIN_LOCATION" ? data.stationId : null,
      status: "AKTIF"
    },
  });

  await prisma.adminLog.create({
    data: {
      action: "USER_CREATED",
      entityType: "USER",
      entityId: user.id,
      userId: session.user.id,
      newValues: {
        name: user.name,
        email: user.email,
        role: user.role,
        stationId: user.stationId,
      },
    },
  });

  revalidatePath("/dashboard/management/users");
  return user;
}

// GET USERS

export async function getUsers(filters?: {
  role?: "SUPER_ADMIN" | "ADMIN_LOCATION";
  status?: "AKTIF" | "NONAKTIF";
}) {
  await requireSuperAdmin();

  return prisma.user.findMany({
    where: {
      ...(filters?.role && { role: filters.role }),
      ...(filters?.status && { status: filters.status }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      companyName: true,
      role: true,
      status: true,
      stationId: true,
      lastLoginAt: true,
      createdAt: true,
      station: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// GET USER BY ID

export async function getUserById(userId: string) {
  await requireSuperAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      companyName: true,
      role: true,
      status: true,
      stationId: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      station: {
        select: { id: true, name: true, provinsi: true, kabupaten: true },
      },
    },
  });

  if (!user) throw new Error("Pengguna tidak ditemukan");
  return user;
}

// UPDATE USER

export async function updateUser(
  userId: string,
  data: {
    name?: string;
    email?: string;
    companyName?: string;
    role?: "SUPER_ADMIN" | "ADMIN_LOCATION";
    stationId?: string | null;
    status?: "AKTIF" | "NONAKTIF";
  }
) {
  const session = await requireSuperAdmin();

  // Prevent modifying yourself
  if (userId === session.user.id) {
    throw new Error("Tidak bisa mengubah data diri sendiri");
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) throw new Error("Pengguna tidak ditemukan");

  // Validasi role & stationId
  const newRole = data.role ?? existing.role;
  const newStationId = data.stationId !== undefined ? data.stationId : existing.stationId;

  if (newRole === "ADMIN_LOCATION" && !newStationId) {
    throw new Error("Admin Lokasi harus memiliki stasiun yang ditugaskan");
  }
  if (newRole === "SUPER_ADMIN" && newStationId) {
    throw new Error("Super Admin tidak boleh ditugaskan ke stasiun tertentu");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      stationId: newRole === "SUPER_ADMIN" ? null : newStationId,
    },
  });

  await prisma.adminLog.create({
    data: {
      action: "USER_UPDATED",
      entityType: "USER",
      entityId: userId,
      userId: session.user.id,
      oldValues: {
        name: existing.name,
        email: existing.email,
        role: existing.role,
        status: existing.status,
        stationId: existing.stationId,
      },
      newValues: {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        stationId: user.stationId,
      },
    },
  });

  revalidatePath("/dashboard/management/users");
  revalidatePath(`/dashboard/management/users/${userId}`);
  return user;
}

// ACTIVATE / DEACTIVATE USER

export async function activateUser(userId: string) {
  const session = await requireSuperAdmin();

  if (userId === session.user.id) throw new Error("Tidak bisa mengubah status diri sendiri");

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "AKTIF" },
  });

  await prisma.adminLog.create({
    data: {
      action: "USER_ACTIVATED",
      entityType: "USER",
      entityId: userId,
      userId: session.user.id,
      newValues: { status: "AKTIF" },
    },
  });

  revalidatePath("/dashboard/management/users");
  revalidatePath(`/dashboard/management/users/${userId}`);
  return user;
}

export async function deactivateUser(userId: string) {
  const session = await requireSuperAdmin();

  if (userId === session.user.id) throw new Error("Tidak bisa menonaktifkan diri sendiri");

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "NONAKTIF" },
  });

  await prisma.adminLog.create({
    data: {
      action: "USER_DEACTIVATED",
      entityType: "USER",
      entityId: userId,
      userId: session.user.id,
      newValues: { status: "NONAKTIF" },
    },
  });

  revalidatePath("/dashboard/management/users");
  revalidatePath(`/dashboard/management/users/${userId}`);
  return user;
}


// DELETE USER

export async function deleteUser(userId: string) {
  const session = await requireSuperAdmin();

  if (userId === session.user.id) throw new Error("Tidak bisa menghapus diri sendiri");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, status: true },
  });

  if (!user) throw new Error("Pengguna tidak ditemukan");

  // Safety: hanya bisa hapus user yang NONAKTIF
  if (user.status !== "NONAKTIF") {
    throw new Error("Pengguna hanya dapat dihapus jika berstatus Nonaktif");
  }

  await prisma.user.delete({ where: { id: userId } });

  await prisma.adminLog.create({
    data: {
      action: "USER_DELETED",
      entityType: "USER",
      entityId: userId,
      userId: session.user.id,
      oldValues: { name: user.name, email: user.email },
    },
  });

  revalidatePath("/dashboard/management/users");
}

// CHANGE PASSWORD (Self-service)

export async function changePassword(data: {
  oldPassword: string;
  newPassword: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Tidak terautentikasi");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user) throw new Error("Pengguna tidak ditemukan");

  const isValid = await bcrypt.compare(data.oldPassword, user.password);
  if (!isValid) throw new Error("Password lama tidak sesuai");

  if (data.newPassword.length < 8) {
    throw new Error("Password baru minimal 8 karakter");
  }

  const hashed = await bcrypt.hash(data.newPassword, 12);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });
}

// UPDATE PROFILE (Self-service)

export async function updateProfile(data: {
  name?: string;
  companyName?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Tidak terautentikasi");

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.companyName !== undefined && { companyName: data.companyName }),
    },
    select: { id: true, name: true, companyName: true },
  });

  revalidatePath("/dashboard/profile");
  return user;
}