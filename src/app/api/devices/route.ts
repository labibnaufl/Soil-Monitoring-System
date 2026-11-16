import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  assertCanManageDevices,
  createDeviceRecord,
  listDeviceRecords,
  DeviceError,
} from "@/lib/devices";

const createDeviceSchema = z.object({
  deviceId: z.string().min(1).optional(),
  deviceName: z.string().min(1),
  stationId: z.string().optional(),
  description: z.string().optional(),
  samplingInterval: z.number().int().positive().optional(),
  batteryWarning: z.number().min(0).max(100).optional(),
  batteryCritical: z.number().min(0).max(100).optional(),
  pipeLength: z.number().optional(),
  remainingPipe: z.number().optional(),
  sensorConfig: z.record(z.string(), z.unknown()).optional(),
});

// GET /api/devices - List devices (SUPER_ADMIN sees all, ADMIN_LOCATION sees own station)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const stationId = searchParams.get("stationId");

    const validStatuses = ["BEROPERASI", "MAINTENANCE", "MATI"] as const;
    const devices = await listDeviceRecords(session, {
      ...(status && {
        status: validStatuses.includes(status as (typeof validStatuses)[number])
          ? (status as (typeof validStatuses)[number])
          : undefined,
      }),
      ...(stationId !== null && { stationId }),
    });

    return NextResponse.json(devices);
  } catch (error) {
    if (error instanceof DeviceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error fetching devices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/devices - Register a new device, NYT-23 createDevice (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    assertCanManageDevices(session);

    const body = await request.json();
    const result = createDeviceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data format", details: result.error.format() },
        { status: 400 }
      );
    }

    const device = await createDeviceRecord(session.user.id, {
      ...result.data,
      sensorConfig: result.data.sensorConfig as
        | import("@prisma/client").Prisma.InputJsonValue
        | undefined,
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    if (error instanceof DeviceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error creating device:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
