import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  assertCanManageDevices,
  assignDeviceRecord,
  DeviceError,
} from "@/lib/devices";

const assignSchema = z.object({
  stationId: z.string().nullable(),
});

// POST /api/devices/[id]/assign - Assign/unassign device to station,
// NYT-16 assignDeviceToStation (SUPER_ADMIN only, null unassigns)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    assertCanManageDevices(session);

    const { id } = await params;
    const body = await request.json();
    const result = assignSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data format", details: result.error.format() },
        { status: 400 }
      );
    }

    const device = await assignDeviceRecord(
      session.user.id,
      id,
      result.data.stationId
    );

    return NextResponse.json(device);
  } catch (error) {
    if (error instanceof DeviceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error assigning device:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
