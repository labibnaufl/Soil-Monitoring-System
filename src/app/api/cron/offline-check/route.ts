import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/cron/offline-check - Detect silent devices, open/resolve
// DEVICE_OFFLINE alerts, prune old rejected readings.
// Auth: Bearer <CRON_SECRET> (system cron), or a SUPER_ADMIN/ADMIN session
// for manual runs. Set CRON_SECRET in .env and the scheduler.
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer /i, "");
  const bearerOk = !!cronSecret && !!bearer && bearer === cronSecret;

  if (!bearerOk) {
    const session = await auth();
    const role = session?.user?.role;
    if (!session?.user || (role !== "SUPER_ADMIN" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const devices = await prisma.device.findMany({
    select: {
      id: true,
      deviceId: true,
      deviceName: true,
      stationId: true,
      samplingInterval: true,
      readings: {
        select: { dateTime: true },
        orderBy: { dateTime: "desc" },
        take: 1,
      },
      alerts: {
        where: {
          alertType: "DEVICE_OFFLINE",
          status: { in: ["OPEN", "PENDING", "IN_PROGRESS"] },
        },
        select: { id: true },
      },
    },
  });

  let newAlerts = 0;
  let resolved = 0;

  for (const device of devices) {
    const lastSeen = device.readings[0]?.dateTime ?? null;
    // Never-reported devices are "waiting first data", not offline.
    if (!lastSeen || !device.stationId) continue;

    const staleMs = now.getTime() - lastSeen.getTime();
    const stale = staleMs > (device.samplingInterval || 300) * 1000 * 2;
    const hasOpen = device.alerts.length > 0;

    if (stale && !hasOpen) {
      const staleHours = staleMs / 3600000;
      await prisma.alert.create({
        data: {
          stationId: device.stationId,
          deviceId: device.id,
          alertType: "DEVICE_OFFLINE",
          priority: staleHours > 24 ? "HIGH" : "MEDIUM",
          status: "OPEN",
          sourceType: "READING",
          message: `Perangkat ${device.deviceName} tidak mengirim data selama ${staleHours.toFixed(1)} jam (terakhir: ${lastSeen.toLocaleString("id-ID")})`,
          actualValue: staleHours,
        },
      });
      await prisma.adminLog.create({
        data: {
          action: "DEVICE_OFFLINE_DETECTED",
          entityType: "DEVICE",
          entityId: device.id,
          newValues: { lastSeen: lastSeen.toISOString() },
        },
      });
      newAlerts += 1;
    } else if (!stale && hasOpen) {
      for (const alert of device.alerts) {
        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            status: "RESOLVED",
            resolutionNote: "Perangkat kembali mengirim data",
            resolvedAt: new Date(),
          },
        });
        await prisma.adminLog.create({
          data: {
            action: "DEVICE_OFFLINE_RESOLVED",
            entityType: "ALERT",
            entityId: alert.id,
          },
        });
        resolved += 1;
      }
    }
  }

  // Prune rejected readings older than 30 days (inbox stays usable).
  const pruned = await prisma.rejectedReading.deleteMany({
    where: {
      receivedAt: { lt: new Date(now.getTime() - 30 * 24 * 3600 * 1000) },
    },
  });

  return NextResponse.json({
    checked: devices.length,
    newAlerts,
    resolved,
    prunedRejected: pruned.count,
  });
}
