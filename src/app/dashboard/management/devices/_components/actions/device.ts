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

// CREATE DEVICE
export async function createDevice(data: {
  deviceId: string;
  deviceName: string;
  stationId?: string;
  description?: string;
  samplingInterval?: number;
  batteryWarning?: number;
  batteryCritical?: number;
}) {
  const session = await requireSuperAdmin();

  // Check if deviceId already exists
  const existing = await prisma.device.findUnique({
    where: { deviceId: data.deviceId },
  });
  if (existing) throw new Error("ID Perangkat sudah terdaftar");

  // If stationId provided, verify station exists
  if (data.stationId) {
    const station = await prisma.station.findUnique({
      where: { id: data.stationId },
    });
    if (!station) throw new Error("Stasiun tidak ditemukan");
  }

  const device = await prisma.device.create({
    data: {
      deviceId: data.deviceId,
      deviceName: data.deviceName,
      stationId: data.stationId || null,
      description: data.description,
      samplingInterval: data.samplingInterval || 300,
      batteryWarning: data.batteryWarning ?? 20,
      batteryCritical: data.batteryCritical ?? 10,
      status: "BEROPERASI",
    },
  });

  await prisma.adminLog.create({
    data: {
      action: "DEVICE_CREATED",
      entityType: "DEVICE",
      entityId: device.id,
      userId: session.user.id,
      newValues: {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        stationId: device.stationId,
      },
    },
  });

  revalidatePath("/dashboard/management/devices");
  return device;
}

// UPDATE DEVICE
export async function updateDevice(
  deviceId: string,
  data: {
    deviceName?: string;
    description?: string;
    samplingInterval?: number;
    batteryWarning?: number;
    batteryCritical?: number;
    pipeLength?: number;
    remainingPipe?: number;
  }
) {
  const session = await requireSuperAdmin();

  const existing = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!existing) throw new Error("Perangkat tidak ditemukan");

  const device = await prisma.device.update({
    where: { id: deviceId },
    data,
  });

  await prisma.adminLog.create({
    data: {
      action: "DEVICE_UPDATED",
      entityType: "DEVICE",
      entityId: deviceId,
      userId: session.user.id,
      oldValues: {
        deviceName: existing.deviceName,
        description: existing.description,
        samplingInterval: existing.samplingInterval,
      },
      newValues: {
        deviceName: device.deviceName,
        description: device.description,
        samplingInterval: device.samplingInterval,
      },
    },
  });

  revalidatePath("/dashboard/management/devices");
  revalidatePath(`/dashboard/management/devices/${deviceId}`);
  return device;
}

// UPDATE DEVICE STATUS
export async function updateDeviceStatus(deviceId: string, status: "BEROPERASI" | "MAINTENANCE" | "MATI") {
  const session = await requireSuperAdmin();

  const existing = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!existing) throw new Error("Perangkat tidak ditemukan");

  const device = await prisma.device.update({
    where: { id: deviceId },
    data: { status },
  });

  await prisma.adminLog.create({
    data: {
      action: `DEVICE_STATUS_${status}`,
      entityType: "DEVICE",
      entityId: deviceId,
      userId: session.user.id,
      oldValues: { status: existing.status },
      newValues: { status },
    },
  });

  revalidatePath("/dashboard/management/devices");
  revalidatePath(`/dashboard/management/devices/${deviceId}`);
  return device;
}

// ASSIGN DEVICE TO STATION
export async function assignDeviceToStation(deviceId: string, stationId: string) {
  const session = await requireSuperAdmin();

  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) throw new Error("Perangkat tidak ditemukan");

  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) throw new Error("Stasiun tidak ditemukan");

  const updated = await prisma.device.update({
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

  revalidatePath("/dashboard/management/devices");
  revalidatePath("/dashboard/management/stations");
  revalidatePath(`/dashboard/management/devices/${deviceId}`);
  return updated;
}

// UNASSIGN DEVICE FROM STATION
export async function unassignDevice(deviceId: string) {
  const session = await requireSuperAdmin();

  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) throw new Error("Perangkat tidak ditemukan");

  const updated = await prisma.device.update({
    where: { id: deviceId },
    data: { stationId: null },
  });

  await prisma.adminLog.create({
    data: {
      action: "DEVICE_UNASSIGNED",
      entityType: "DEVICE",
      entityId: deviceId,
      userId: session.user.id,
      oldValues: { stationId: device.stationId },
    },
  });

  revalidatePath("/dashboard/management/devices");
  revalidatePath("/dashboard/management/stations");
  revalidatePath(`/dashboard/management/devices/${deviceId}`);
  return updated;
}

// DELETE DEVICE
export async function deleteDevice(deviceId: string) {
  const session = await requireSuperAdmin();

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: { readings: { select: { id: true }, take: 1 } },
  });
  if (!device) throw new Error("Perangkat tidak ditemukan");

  // Safety: can't delete if has readings
  if (device.readings.length > 0) {
    throw new Error("Tidak dapat menghapus perangkat yang memiliki data");
  }

  await prisma.device.delete({ where: { id: deviceId } });

  await prisma.adminLog.create({
    data: {
      action: "DEVICE_DELETED",
      entityType: "DEVICE",
      entityId: deviceId,
      userId: session.user.id,
      oldValues: { deviceId: device.deviceId, deviceName: device.deviceName },
    },
  });

  revalidatePath("/dashboard/management/devices");
}

// GET DEVICE BY ID
export async function getDeviceById(deviceId: string) {
  await requireSuperAdmin();

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: {
      station: {
        select: { id: true, name: true, provinsi: true, kabupaten: true },
      },
      _count: {
        select: { readings: true, alerts: true },
      },
    },
  });

  if (!device) throw new Error("Perangkat tidak ditemukan");
  return device;
}

// GET ALL DEVICES
export async function getDevices(filters?: {
  status?: "BEROPERASI" | "MAINTENANCE" | "MATI";
  stationId?: string | null;
}) {
  await requireSuperAdmin();

  return prisma.device.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.stationId !== undefined && { stationId: filters.stationId }),
    },
    include: {
      station: {
        select: { id: true, name: true },
      },
      _count: {
        select: { readings: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
