import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { publishDeviceConfig } from "@/lib/mqtt-config";

export interface DeviceSessionUser {
  id: string;
  role: string;
  stationId: string | null;
}

export interface DeviceSession {
  user: DeviceSessionUser;
}

export class DeviceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN"];

// Alphabet without lookalikes (no 0/O, 1/I) so field technicians
// can read the ID off a label without mistakes.
const DEVICE_ID_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomDeviceIdCandidate(): string {
  const part = (n: number) =>
    Array.from(
      { length: n },
      () =>
        DEVICE_ID_ALPHABET[
          Math.floor(Math.random() * DEVICE_ID_ALPHABET.length)
        ]
    ).join("");
  return `LPA-${part(4)}-${part(4)}`;
}

// Mint a website-side device ID, guaranteed unique at generation time.
// The final uniqueness guard is still the create-path 409 check.
export async function generateDeviceId(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const candidate = randomDeviceIdCandidate();
    const existing = await prisma.device.findUnique({
      where: { deviceId: candidate },
    });
    if (!existing) return candidate;
  }
  throw new DeviceError("Gagal membuat ID unik, coba lagi", 500);
}

export function assertCanManageDevices(
  session: DeviceSession | null
): asserts session is DeviceSession {
  if (!session?.user) {
    throw new DeviceError("Unauthorized", 401);
  }
  if (!MANAGER_ROLES.includes(session.user.role)) {
    throw new DeviceError("Anda Tidak Memiliki Izin Untuk Mengakses Halaman Ini", 403);
  }
}

export interface CreateDeviceInput {
  deviceId?: string;
  deviceName: string;
  stationId?: string;
  description?: string;
  samplingInterval?: number;
  batteryWarning?: number;
  batteryCritical?: number;
  pipeLength?: number | null;
  remainingPipe?: number | null;
  sensorConfig?: Prisma.InputJsonValue;
}

export async function createDeviceRecord(userId: string, input: CreateDeviceInput) {
  // Vice-versa provisioning: empty deviceId means the website mints one;
  // otherwise the firmware-defined ID is used as-is (uppercased).
  const deviceId = input.deviceId ? input.deviceId.toUpperCase() : await generateDeviceId();

  const existing = await prisma.device.findUnique({
    where: { deviceId },
  });
  if (existing) throw new DeviceError("ID Perangkat sudah terdaftar", 409);

  if (input.stationId) {
    const station = await prisma.station.findUnique({
      where: { id: input.stationId },
    });
    if (!station) throw new DeviceError("Stasiun tidak ditemukan", 404);
  }

  const device = await prisma.device.create({
    data: {
      deviceId,
      deviceName: input.deviceName,
      stationId: input.stationId || null,
      description: input.description,
      samplingInterval: input.samplingInterval || 300,
      batteryWarning: input.batteryWarning ?? 20,
      batteryCritical: input.batteryCritical ?? 10,
      pipeLength: input.pipeLength ?? null,
      remainingPipe: input.remainingPipe ?? null,
      sensorConfig: input.sensorConfig ?? undefined,
      status: "BEROPERASI",
    },
  });

  await prisma.adminLog.create({
    data: {
      action: "DEVICE_CREATED",
      entityType: "DEVICE",
      entityId: device.id,
      userId,
      newValues: {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        stationId: device.stationId,
      },
    },
  });

  // Push initial config so a pre-registered device picks it up on first boot.
  await publishDeviceConfig(device.deviceId);

  return device;
}

export async function assignDeviceRecord(
  userId: string,
  id: string,
  stationId: string | null
) {
  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) throw new DeviceError("Perangkat tidak ditemukan", 404);

  if (stationId) {
    const station = await prisma.station.findUnique({ where: { id: stationId } });
    if (!station) throw new DeviceError("Stasiun tidak ditemukan", 404);
  }

  const updated = await prisma.device.update({
    where: { id },
    data: { stationId },
  });

  await prisma.adminLog.create({
    data: {
      action: stationId ? "DEVICE_ASSIGNED" : "DEVICE_UNASSIGNED",
      entityType: "DEVICE",
      entityId: id,
      userId,
      newValues: stationId ? { stationId } : { stationId: null },
    },
  });

  // Station is part of the downlink payload: republish on (un)assign.
  await publishDeviceConfig(updated.deviceId);

  return updated;
}

export interface ListDevicesFilter {
  status?: "BEROPERASI" | "MAINTENANCE" | "MATI";
  stationId?: string | null;
}

export async function listDeviceRecords(
  session: DeviceSession | null,
  filters?: ListDevicesFilter
) {
  if (!session?.user) throw new DeviceError("Unauthorized", 401);

  const isManager = MANAGER_ROLES.includes(session.user.role);
  if (!isManager) {
    if (!session.user.stationId) throw new DeviceError("Forbidden", 403);
    return prisma.device.findMany({
      where: { stationId: session.user.stationId },
      include: {
        station: { select: { id: true, name: true } },
        _count: { select: { readings: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return prisma.device.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.stationId !== undefined && { stationId: filters.stationId }),
    },
    include: {
      station: { select: { id: true, name: true } },
      _count: { select: { readings: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
