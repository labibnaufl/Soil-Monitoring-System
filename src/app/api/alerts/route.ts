import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// GET /api/alerts - Get alerts with filtering (requires login)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get("stationId");
    const status = searchParams.get("status");
    const alertType = searchParams.get("alertType");
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Prisma.AlertWhereInput = {};

    // ADMIN_LOCATION users are scoped to their own station
    if (session.user.role !== "SUPER_ADMIN") {
      if (!session.user.stationId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (stationId && stationId !== session.user.stationId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      where.stationId = session.user.stationId;
    } else if (stationId) {
      where.stationId = stationId;
    }

    if (status) where.status = status as Prisma.AlertWhereInput["status"];
    if (alertType) where.alertType = alertType as Prisma.AlertWhereInput["alertType"];
    if (priority) where.priority = priority as Prisma.AlertWhereInput["priority"];

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

// PATCH /api/alerts - Resolve an alert (for Admin Location)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { alertId, resolutionNote } = body;

    if (!alertId || !resolutionNote) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const existing = await prisma.alert.findUnique({
      where: { id: alertId },
      select: { stationId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }
    if (
      session.user.role !== "SUPER_ADMIN" &&
      existing.stationId !== session.user.stationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
