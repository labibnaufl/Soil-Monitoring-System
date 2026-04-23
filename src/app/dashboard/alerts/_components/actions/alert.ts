"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Tidak terautentikasi");
  return session;
}

// GET ALERTS
export async function getAlerts(filters?: {
  status?: "OPEN" | "PENDING" | "IN_PROGRESS" | "RESOLVED";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  alertType?: "SOIL_MOISTURE" | "LOW_BATTERY" | "PEATLAND_LIFESPAN";
  stationId?: string;
}) {
  const session = await requireAuth();
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const userStationId = session.user.stationId;

  // Non-super admins can only see their station's alerts
  const stationFilter = !isSuperAdmin && userStationId ? { stationId: userStationId } : undefined;

  return prisma.alert.findMany({
    where: {
      ...stationFilter,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.priority && { priority: filters.priority }),
      ...(filters?.alertType && { alertType: filters.alertType }),
    },
    include: {
      station: { select: { id: true, name: true, provinsi: true, kabupaten: true } },
      device: { select: { id: true, deviceName: true, deviceId: true } },
      resolvedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// GET ALERT BY ID
export async function getAlertById(alertId: string) {
  const session = await requireAuth();
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const userStationId = session.user.stationId;

  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: {
      station: { select: { id: true, name: true, provinsi: true, kabupaten: true } },
      device: { select: { id: true, deviceName: true, deviceId: true } },
      resolvedBy: { select: { id: true, name: true } },
      reading: {
        select: {
          id: true,
          dateTime: true,
          waterLevel: true,
          soilMoisture: true,
          battery: true,
        },
      },
    },
  });

  if (!alert) throw new Error("Notifikasi tidak ditemukan");

  // Check authorization
  if (!isSuperAdmin && alert.stationId !== userStationId) {
    throw new Error("Anda tidak memiliki akses ke notifikasi ini");
  }

  return alert;
}

// UPDATE ALERT STATUS
export async function updateAlertStatus(
  alertId: string,
  status: "OPEN" | "PENDING" | "IN_PROGRESS" | "RESOLVED"
) {
  const session = await requireAuth();

  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert) throw new Error("Notifikasi tidak ditemukan");

  // Non-super admins can only update alerts from their station
  if (session.user.role !== "SUPER_ADMIN" && alert.stationId !== session.user.stationId) {
    throw new Error("Anda tidak memiliki akses ke notifikasi ini");
  }

  const updated = await prisma.alert.update({
    where: { id: alertId },
    data: { status },
  });

  await prisma.adminLog.create({
    data: {
      userId: session.user.id,
      stationId: alert.stationId,
      action: `ALERT_STATUS_${status}`,
      entityType: "ALERT",
      entityId: alertId,
      oldValues: { status: alert.status },
      newValues: { status },
    },
  });

  revalidatePath("/dashboard/alerts");
  revalidatePath(`/dashboard/alerts/${alertId}`);
  return updated;
}

// RESOLVE ALERT
export async function resolveAlert(alertId: string, resolutionNote: string) {
  const session = await requireAuth();

  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert) throw new Error("Notifikasi tidak ditemukan");

  // Non-super admins can only resolve alerts from their station
  if (session.user.role !== "SUPER_ADMIN" && alert.stationId !== session.user.stationId) {
    throw new Error("Anda tidak memiliki akses ke notifikasi ini");
  }

  const updated = await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: "RESOLVED",
      resolutionNote,
      resolvedById: session.user.id,
      resolvedAt: new Date(),
    },
  });

  await prisma.adminLog.create({
    data: {
      userId: session.user.id,
      stationId: alert.stationId,
      action: "ALERT_RESOLVED",
      entityType: "ALERT",
      entityId: alertId,
      newValues: { status: "RESOLVED", resolutionNote },
    },
  });

  revalidatePath("/dashboard/alerts");
  revalidatePath(`/dashboard/alerts/${alertId}`);
  return updated;
}

// GET ALERT COUNTS (for sidebar badge)
export async function getAlertCounts() {
  const session = await auth();
  if (!session?.user) return { open: 0, high: 0, total: 0 };

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const userStationId = session.user.stationId;

  const stationFilter = !isSuperAdmin && userStationId ? { stationId: userStationId } : undefined;

  const [open, high, total] = await Promise.all([
    prisma.alert.count({
      where: { ...stationFilter, status: "OPEN" },
    }),
    prisma.alert.count({
      where: { ...stationFilter, status: "OPEN", priority: "HIGH" },
    }),
    prisma.alert.count({
      where: stationFilter,
    }),
  ]);

  return { open, high, total };
}

// CREATE MOCK ALERT (for testing - Super Admin only)
export async function createMockAlert(data: {
  alertType: "SOIL_MOISTURE" | "LOW_BATTERY" | "PEATLAND_LIFESPAN";
  priority: "LOW" | "MEDIUM" | "HIGH";
  message: string;
  stationId: string;
  deviceId?: string;
  thresholdValue?: number;
  actualValue?: number;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Hanya Super Admin yang dapat membuat notifikasi uji coba");
  }

  // Verify station exists
  const station = await prisma.station.findUnique({
    where: { id: data.stationId },
  });
  if (!station) throw new Error("Stasiun tidak ditemukan");

  // Verify device if provided
  if (data.deviceId) {
    const device = await prisma.device.findUnique({
      where: { id: data.deviceId },
    });
    if (!device) throw new Error("Perangkat tidak ditemukan");
  }

  const alert = await prisma.alert.create({
    data: {
      alertType: data.alertType,
      priority: data.priority,
      status: "OPEN",
      message: data.message,
      stationId: data.stationId,
      deviceId: data.deviceId || null,
      thresholdValue: data.thresholdValue || null,
      actualValue: data.actualValue || null,
      sourceType: "READING",
    },
  });

  await prisma.adminLog.create({
    data: {
      userId: session.user.id,
      stationId: data.stationId,
      action: "ALERT_CREATED_MOCK",
      entityType: "ALERT",
      entityId: alert.id,
      newValues: {
        alertType: data.alertType,
        priority: data.priority,
        message: data.message,
        mock: true,
      },
    },
  });

  revalidatePath("/dashboard/alerts");
  return alert;
}
