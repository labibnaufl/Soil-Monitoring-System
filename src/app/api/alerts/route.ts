import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/alerts - Get alerts with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get("stationId");
    const status = searchParams.get("status");
    const alertType = searchParams.get("alertType");
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (stationId) where.stationId = stationId;
    if (status) where.status = status;
    if (alertType) where.alertType = alertType;
    if (priority) where.priority = priority;

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        station: {
          select: {
            name: true,
            provinsi: true,
            kabupaten: true,
          },
        },
        resolvedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/alerts/resolve - Resolve an alert (for Admin Location)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, resolutionNote, userId } = body;

    if (!alertId || !resolutionNote || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: "RESOLVED",
        resolutionNote,
        resolvedById: userId,
        resolvedAt: new Date(),
      },
      include: {
        station: {
          select: {
            name: true,
          },
        },
      },
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        userId,
        stationId: alert.stationId,
        action: "ALERT_RESOLVED",
        entityType: "ALERT",
        entityId: alert.id,
        newValues: { status: "RESOLVED", resolutionNote },
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error resolving alert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
