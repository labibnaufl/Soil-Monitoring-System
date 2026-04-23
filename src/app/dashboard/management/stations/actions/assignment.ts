"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Anda Tidak Memiliki Izin Untuk Mengakses Halaman Ini");
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    throw new Error("Anda Tidak Memiliki Izin Untuk Mengakses Halaman Ini");
  }
  return session;
}

// ASSIGN DEVICE TO STATION
export async function assignDeviceToStation(stationId: string, deviceId: string) {
  const session = await requireSuperAdmin();

  const station = await prisma.station.findUnique({
    where: { id: stationId },
  });
  if (!station) throw new Error("Stasiun tidak ditemukan");
  if (station.status !== "AKTIF") throw new Error("Stasiun harus aktif untuk menambah perangkat");

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
  });
  if (!device) throw new Error("Perangkat tidak ditemukan");
  if (device.stationId) throw new Error("Perangkat sudah ditugaskan ke stasiun lain");

  await prisma.device.update({
    where: { id: deviceId },
    data: { stationId },
  });

  await prisma.adminLog.create({
    data: {
      action: "DEVICE_ASSIGNED",
      entityType: "DEVICE",
      entityId: deviceId,
      userId: session.user.id,
      newValues: { stationId, stationName: station.name },
    },
  });

  revalidatePath(`/dashboard/management/stations/${stationId}`);
  revalidatePath("/dashboard/management/stations");
}

// UNASSIGN DEVICE FROM STATION
export async function unassignDeviceFromStation(stationId: string, deviceId: string) {
  const session = await requireSuperAdmin();

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
  });
  if (!device) throw new Error("Perangkat tidak ditemukan");
  if (device.stationId !== stationId) throw new Error("Perangkat tidak ditugaskan ke stasiun ini");

  await prisma.device.update({
    where: { id: deviceId },
    data: { stationId: null },
  });

  await prisma.adminLog.create({
    data: {
      action: "DEVICE_UNASSIGNED",
      entityType: "DEVICE",
      entityId: deviceId,
      userId: session.user.id,
      oldValues: { stationId },
    },
  });

  revalidatePath(`/dashboard/management/stations/${stationId}`);
  revalidatePath("/dashboard/management/stations");
}

// GET AVAILABLE DEVICES (not assigned to any station)
export async function getAvailableDevices() {
  await requireSuperAdmin();

  return prisma.device.findMany({
    where: { stationId: null },
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
}

// GET DEVICES AT STATION
export async function getDevicesAtStation(stationId: string) {
  await requireSuperAdmin();

  return prisma.device.findMany({
    where: { stationId },
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
}

// ASSIGN ADMIN TO STATION
export async function assignAdminToStation(stationId: string, userId: string) {
  const session = await requireSuperAdmin();

  const station = await prisma.station.findUnique({
    where: { id: stationId },
  });
  if (!station) throw new Error("Stasiun tidak ditemukan");

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) throw new Error("Pengguna tidak ditemukan");
  if (user.role !== "ADMIN_LOCATION") throw new Error("Pengguna harus berrole Admin Lokasi");
  if (user.stationId) throw new Error("Pengguna sudah ditugaskan ke stasiun lain");

  await prisma.user.update({
    where: { id: userId },
    data: { stationId },
  });

  await prisma.adminLog.create({
    data: {
      action: "ADMIN_ASSIGNED",
      entityType: "USER",
      entityId: userId,
      userId: session.user.id,
      newValues: { stationId, stationName: station.name },
    },
  });

  revalidatePath(`/dashboard/management/stations/${stationId}`);
  revalidatePath("/dashboard/management/stations");
}

// UNASSIGN ADMIN FROM STATION
export async function unassignAdminFromStation(stationId: string, userId: string) {
  const session = await requireSuperAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) throw new Error("Pengguna tidak ditemukan");
  if (user.stationId !== stationId) throw new Error("Pengguna tidak ditugaskan ke stasiun ini");

  await prisma.user.update({
    where: { id: userId },
    data: { stationId: null },
  });

  await prisma.adminLog.create({
    data: {
      action: "ADMIN_UNASSIGNED",
      entityType: "USER",
      entityId: userId,
      userId: session.user.id,
      oldValues: { stationId },
    },
  });

  revalidatePath(`/dashboard/management/stations/${stationId}`);
  revalidatePath("/dashboard/management/stations");
}

// GET AVAILABLE ADMINS (ADMIN_LOCATION without station)
export async function getAvailableAdmins() {
  await requireSuperAdmin();

  return prisma.user.findMany({
    where: {
      role: "ADMIN_LOCATION",
      stationId: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      companyName: true,
      status: true,
    },
    orderBy: { name: "asc" },
  });
}

// GET ADMINS AT STATION
export async function getAdminsAtStation(stationId: string) {
  await requireSuperAdmin();

  return prisma.user.findMany({
    where: {
      role: "ADMIN_LOCATION",
      stationId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      companyName: true,
      status: true,
    },
    orderBy: { name: "asc" },
  });
}
