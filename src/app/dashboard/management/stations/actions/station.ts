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

// CREATE STATION
export async function createStation(data: {
  name: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa?: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
}) {
  const session = await requireSuperAdmin();

  const existing = await prisma.station.findFirst({
    where: { name: data.name },
  });
  if (existing) throw new Error("Nama stasiun sudah digunakan");

  const mapsLink = `https://maps.google.com/?q=${data.latitude},${data.longitude}`;

  const station = await prisma.station.create({
    data: {
      ...data,
      mapsLink,
      status: "AKTIF",
    },
  });

  await prisma.adminLog.create({
    data: {
      action: "STATION_CREATED",
      entityType: "STATION",
      entityId: station.id,
      userId: session.user.id,
      newValues: {
        name: station.name,
        provinsi: station.provinsi,
        kabupaten: station.kabupaten,
      },
    },
  });

  revalidatePath("/dashboard/management/stations");
  return station;
}

// UPDATE STATION
export async function updateStation(
  stationId: string,
  data: {
    name?: string;
    provinsi?: string;
    kabupaten?: string;
    kecamatan?: string;
    desa?: string;
    latitude?: number;
    longitude?: number;
    imageUrl?: string;
  }
) {
  const session = await requireSuperAdmin();

  const existing = await prisma.station.findUnique({ where: { id: stationId } });
  if (!existing) throw new Error("Stasiun tidak ditemukan");

  // If lat/lng changed, update mapsLink
  const newLat = data.latitude ?? existing.latitude;
  const newLng = data.longitude ?? existing.longitude;
  const mapsLink = `https://maps.google.com/?q=${newLat},${newLng}`;

  const station = await prisma.station.update({
    where: { id: stationId },
    data: {
      ...data,
      mapsLink,
    },
  });

  await prisma.adminLog.create({
    data: {
      action: "STATION_UPDATED",
      entityType: "STATION",
      entityId: stationId,
      userId: session.user.id,
      oldValues: {
        name: existing.name,
        provinsi: existing.provinsi,
        kabupaten: existing.kabupaten,
      },
      newValues: {
        name: station.name,
        provinsi: station.provinsi,
        kabupaten: station.kabupaten,
      },
    },
  });

  revalidatePath("/dashboard/management/stations");
  revalidatePath(`/dashboard/management/stations/${stationId}`);
  return station;
}

// ACTIVATE STATION
export async function activateStation(stationId: string) {
  const session = await requireSuperAdmin();

  const station = await prisma.station.update({
    where: { id: stationId },
    data: { status: "AKTIF" },
  });

  await prisma.adminLog.create({
    data: {
      action: "STATION_ACTIVATED",
      entityType: "STATION",
      entityId: stationId,
      userId: session.user.id,
      newValues: { status: "AKTIF" },
    },
  });

  revalidatePath("/dashboard/management/stations");
  revalidatePath(`/dashboard/management/stations/${stationId}`);
  return station;
}

// DEACTIVATE STATION
export async function deactivateStation(stationId: string) {
  const session = await requireSuperAdmin();

  const station = await prisma.station.update({
    where: { id: stationId },
    data: { status: "NONAKTIF" },
  });

  await prisma.adminLog.create({
    data: {
      action: "STATION_DEACTIVATED",
      entityType: "STATION",
      entityId: stationId,
      userId: session.user.id,
      newValues: { status: "NONAKTIF" },
    },
  });

  revalidatePath("/dashboard/management/stations");
  revalidatePath(`/dashboard/management/stations/${stationId}`);
  return station;
}

// DELETE STATION
export async function deleteStation(stationId: string) {
  const session = await requireSuperAdmin();

  const station = await prisma.station.findUnique({
    where: { id: stationId },
    include: { admins: { select: { id: true } }, devices: { select: { id: true } } },
  });
  if (!station) throw new Error("Stasiun tidak ditemukan");

  // Safety: can't delete if has admins or devices
  if (station.admins.length > 0) {
    throw new Error("Tidak dapat menghapus stasiun yang masih memiliki admin");
  }
  if (station.devices.length > 0) {
    throw new Error("Tidak dapat menghapus stasiun yang masih memiliki perangkat");
  }

  if (station.status !== "NONAKTIF") {
    throw new Error("Stasiun hanya dapat dihapus jika berstatus Nonaktif");
  }

  await prisma.station.delete({ where: { id: stationId } });

  await prisma.adminLog.create({
    data: {
      action: "STATION_DELETED",
      entityType: "STATION",
      entityId: stationId,
      userId: session.user.id,
      oldValues: { name: station.name, provinsi: station.provinsi },
    },
  });

  revalidatePath("/dashboard/management/stations");
}
