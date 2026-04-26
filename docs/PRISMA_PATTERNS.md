# PRISMA_PATTERNS.md — Database Query Rules

> **For AI models**: Follow these patterns exactly when writing Prisma queries.
> Every example is derived from actual usage in this codebase.
> **Stack**: Prisma 7.7.0 · PrismaPg driver adapter · Neon PostgreSQL (serverless)

---

## Connection & Client

### Singleton Pattern (already set up)

```typescript
// src/lib/prisma.ts — DO NOT create a second client elsewhere

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Rules**:
- Always import from `@/lib/prisma` — never instantiate `PrismaClient` elsewhere
- Never import `prisma` in `middleware.ts` — Edge Runtime can't run Prisma
- Never import `prisma` in files marked `"use client"` — it's server-only

---

## Query Patterns

### 1. Always use `select` for lists — never fetch full records

```typescript
// 🔴 Avoid: fetching entire record including password, all timestamps, etc.
const users = await prisma.user.findMany();
// Returns: id, name, email, PASSWORD, companyName, role, status,
//          stationId, lastLoginAt, createdAt, updatedAt
// Password hash is now in memory and could accidentally leak to the client
```

```typescript
// ✅ Good: select exactly what you need
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    companyName: true,
    stationId: true,
    lastLoginAt: true,
    createdAt: true,
    station: {
      select: { id: true, name: true },
    },
  },
  orderBy: { createdAt: "desc" },
});
```

**Why**: Security (never leak `password` hash), performance (less data
transferred from Neon), and clarity (you see exactly what data the page uses).

**Exception**: Use `include` (which returns all fields) only in Server Actions
where you need the full record for validation before updating/deleting.

---

### 2. Use `include: { _count }` for relation counts — never load relations just to count

```typescript
// 🔴 Avoid: loading all related records into memory to count them
const stations = await prisma.station.findMany({
  include: { devices: true, admins: true },
});
stations.forEach((s) => {
  console.log(s.devices.length);  // Loaded 500 device objects just to get "5"
  console.log(s.admins.length);
});
```

```typescript
// ✅ Good: let Postgres COUNT() — returns an integer, no data loaded
const stations = await prisma.station.findMany({
  include: {
    _count: {
      select: { devices: true, admins: true, alerts: true },
    },
  },
});
stations.forEach((s) => {
  console.log(s._count.devices);  // 5 — just a number
  console.log(s._count.admins);   // 2
});
```

---

### 3. Use `Promise.all` for parallel queries — never sequential waterfalls

```typescript
// 🔴 Avoid: each query waits for the previous one to finish
const totalStations = await prisma.station.count();
const activeStations = await prisma.station.count({ where: { status: "AKTIF" } });
const totalDevices = await prisma.device.count();
const openAlerts = await prisma.alert.count({ where: { status: "OPEN" } });
// Total time: sum of all 4 query round-trips to Neon
```

```typescript
// ✅ Good: all queries execute simultaneously
const [totalStations, activeStations, totalDevices, openAlerts] = await Promise.all([
  prisma.station.count(),
  prisma.station.count({ where: { status: "AKTIF" } }),
  prisma.device.count(),
  prisma.alert.count({ where: { status: "OPEN" } }),
]);
// Total time: max of the 4 round-trips (roughly 1 trip)
```

**When to use this**: Any page that runs 2+ independent queries (especially
dashboard pages with stat cards). Our device detail page already does this
pattern correctly for device + readings + alerts.

---

### 4. Use `select` with boolean toggles for conditional fields

```typescript
// ✅ Good: conditionally include raw sensor values
const includeRaw = searchParams.get("includeRaw") === "true";

const readings = await prisma.readings.findMany({
  select: {
    id: true,
    dateTime: true,
    waterLevel: true,
    soilMoisture: true,
    // Only include raw fields if requested
    rawWaterLevel: includeRaw,
    rawRainMeter: includeRaw,
    rawSoilMoisture: includeRaw,
  },
});
```

This is a real pattern from our `/api/readings` GET endpoint. It reduces
payload size when raw values aren't needed.

---

### 5. Build `where` clauses dynamically — never with ternary chains

```typescript
// 🔴 Avoid: messy nested ternaries
const users = await prisma.user.findMany({
  where: {
    role: filter.role ? filter.role : undefined,
    status: filter.status ? filter.status : undefined,
    stationId: filter.stationId ? filter.stationId : undefined,
  },
});
// Problem: `undefined` values are silently ignored by Prisma, but it's
// unclear whether that's intentional or a bug
```

```typescript
// ✅ Good: explicit spread pattern (our established convention)
const users = await prisma.user.findMany({
  where: {
    ...(filters?.role && { role: filters.role }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.stationId && { stationId: filters.stationId }),
  },
});
```

```typescript
// ✅ Also good: build where object step by step for complex logic
const where: Prisma.ReadingsWhereInput = {};

if (deviceId) {
  where.deviceId = deviceId;
}
if (stationId) {
  where.device = { stationId };
}
if (startDate || endDate) {
  where.dateTime = {};
  if (startDate) where.dateTime.gte = new Date(startDate);
  if (endDate) where.dateTime.lte = new Date(endDate);
}

const readings = await prisma.readings.findMany({ where });
```

**Import the type**: Always import `Prisma` namespace for typed where inputs:

```typescript
import { Prisma } from "@prisma/client";

const where: Prisma.AlertWhereInput = { ... };
```

---

### 6. Use `findUnique` for single lookups — never `findFirst` with a unique field

```typescript
// 🔴 Avoid: findFirst on a unique field
const user = await prisma.user.findFirst({
  where: { email: "admin@lpa.id" },
});
```

```typescript
// ✅ Good: findUnique — Prisma uses a direct index lookup
const user = await prisma.user.findUnique({
  where: { email: "admin@lpa.id" },
});
```

**When `findFirst` IS correct**:
- Filtering by non-unique fields: `prisma.alert.findFirst({ where: { stationId, alertType, status } })`
- The `SystemConfig` singleton: `prisma.systemConfig.findFirst()` (there's only one row, no unique beyond `id`)

---

### 7. Use `notFound()` for missing records in pages — `throw new Error` in Server Actions

```typescript
// ✅ Good: page — shows Next.js 404 page
import { notFound } from "next/navigation";

export default async function DeviceDetailPage({ params }) {
  const { id } = await params;

  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) {
    notFound(); // renders not-found.tsx, returns 404 status
  }

  return <div>...</div>;
}
```

```typescript
// ✅ Good: Server Action — throws error caught by client toast
export async function getDeviceById(deviceId: string) {
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) throw new Error("Perangkat tidak ditemukan");
  return device;
}
```

---

### 8. Always add `orderBy` — never rely on implicit ordering

```typescript
// 🔴 Avoid: no ordering (Postgres doesn't guarantee order without ORDER BY)
const readings = await prisma.readings.findMany({
  where: { deviceId },
  take: 5,
});
// Could return any 5 readings in any order
```

```typescript
// ✅ Good: explicit ordering
const readings = await prisma.readings.findMany({
  where: { deviceId },
  orderBy: { dateTime: "desc" },
  take: 5,
});
// Always returns the 5 most recent readings
```

**Standard orderings in this project**:
| Model    | Default Order            | Why                                |
|----------|--------------------------|-------------------------------------|
| User     | `{ createdAt: "desc" }`  | Newest users first                  |
| Station  | `{ createdAt: "desc" }`  | Newest stations first               |
| Device   | `{ createdAt: "desc" }`  | Newest devices first                |
| Readings | `{ dateTime: "desc" }`   | Most recent sensor data first       |
| Alert    | `{ createdAt: "desc" }`  | Newest alerts first                 |
| AdminLog | `{ createdAt: "desc" }`  | Most recent activity first          |

---

## Mutation Patterns

### 9. Use `upsert` for deduplication — not `findFirst` + `create`

```typescript
// 🔴 Avoid: race condition between check and insert
const existing = await prisma.readings.findFirst({
  where: { deviceId: device.id, unixTime: BigInt(data.unix_time) },
});
if (!existing) {
  await prisma.readings.create({ data: { ... } });
}
// If two requests arrive simultaneously, both pass the findFirst check
// and both try to create — one fails with a unique constraint error
```

```typescript
// ✅ Good: upsert is atomic — database handles the race condition
const reading = await prisma.readings.upsert({
  where: {
    deviceId_unixTime: {
      deviceId: device.id,
      unixTime: BigInt(data.unix_time),
    },
  },
  update: {},  // No update on conflict — first write wins
  create: {
    deviceId: device.id,
    unixTime: BigInt(data.unix_time),
    dateTime: new Date(data.unix_time * 1000),
    // ... all fields
  },
});
```

---

### 10. Safety-first deletion pattern

Every deletion in this project follows the same safety checklist:

```typescript
// ✅ Good: our established deletion pattern
export async function deleteStation(stationId: string) {
  const session = await requireSuperAdmin();

  // 1. Fetch with dependents
  const station = await prisma.station.findUnique({
    where: { id: stationId },
    include: {
      admins: { select: { id: true } },
      devices: { select: { id: true } },
    },
  });

  // 2. Existence check
  if (!station) throw new Error("Stasiun tidak ditemukan");

  // 3. Status check (must be deactivated first)
  if (station.status !== "NONAKTIF") {
    throw new Error("Stasiun hanya dapat dihapus jika berstatus Nonaktif");
  }

  // 4. Dependent check (can't delete if has children)
  if (station.admins.length > 0) {
    throw new Error("Tidak dapat menghapus stasiun yang masih memiliki admin");
  }
  if (station.devices.length > 0) {
    throw new Error("Tidak dapat menghapus stasiun yang masih memiliki perangkat");
  }

  // 5. Delete
  await prisma.station.delete({ where: { id: stationId } });

  // 6. Audit log
  await prisma.adminLog.create({ ... });

  // 7. Cache invalidation
  revalidatePath("/dashboard/management/stations");
}
```

**Deletion rules**:
| Model   | Precondition                          | Dependent check                   |
|---------|---------------------------------------|-----------------------------------|
| User    | `status === "NONAKTIF"`               | None (no children)                |
| Station | `status === "NONAKTIF"`               | No admins AND no devices          |
| Device  | None                                  | No readings (`readings.length > 0`) |
| Alert   | None                                  | None                              |

---

### 11. Prevent self-modification

```typescript
// ✅ Good: admins can't deactivate, delete, or modify themselves
export async function deactivateUser(userId: string) {
  const session = await requireSuperAdmin();

  if (userId === session.user.id) {
    throw new Error("Tidak bisa menonaktifkan diri sendiri");
  }

  // ... proceed with deactivation
}
```

This applies to: `updateUser`, `activateUser`, `deactivateUser`, `deleteUser`.

---

## BigInt Handling

### `unixTime` is BigInt — it needs special treatment

```typescript
// 🔴 Avoid: passing BigInt directly to JSON response
return NextResponse.json(reading);
// TypeError: Do not know how to serialize a BigInt

// 🔴 Avoid: comparing BigInt with regular number
if (reading.unixTime > 1713900000) { ... }
// TypeError: Cannot mix BigInt and other types
```

```typescript
// ✅ Good: convert BigInt when creating
const reading = await prisma.readings.upsert({
  where: {
    deviceId_unixTime: {
      deviceId: device.id,
      unixTime: BigInt(data.unix_time),  // number → BigInt
    },
  },
  create: {
    unixTime: BigInt(data.unix_time),    // Always wrap
    // ...
  },
});

// ✅ Good: convert BigInt to string/number for JSON serialization
return NextResponse.json({
  ...reading,
  unixTime: reading.unixTime.toString(),  // BigInt → string for JSON
});

// ✅ Good: use dateTime (DateTime) for comparisons instead of unixTime
const readings = await prisma.readings.findMany({
  where: {
    dateTime: { gte: new Date("2026-01-01") },  // Use dateTime, not unixTime
  },
});
```

**Rule**: Prefer `dateTime` (DateTime) for filtering and display. Use `unixTime`
(BigInt) only for the composite unique constraint and deduplication.

---

## Null Safety

### Sensor values can be null — never default to 0

```typescript
// 🔴 Avoid: defaulting null sensor values to 0
const calibrated = {
  waterLevel: applyCalibration(raw.rawWaterLevel ?? 0, formulas.waterLevel),
  // If the sensor didn't send water_level, this creates a fake "0 cm" reading
};
```

```typescript
// ✅ Good: preserve null — null means "sensor did not report this value"
const calibrated = {
  waterLevel: raw.rawWaterLevel != null
    ? applyCalibration(raw.rawWaterLevel, formulas.waterLevel)
    : null,
};
```

```typescript
// ✅ Good: handle null in display with fallback text
<td>{reading.waterLevel?.toFixed(1) ?? "-"} cm</td>
<td>{reading.soilMoisture?.toFixed(1) ?? "-"} %</td>
<td>{reading.battery?.toFixed(1) ?? "-"} %</td>
```

```typescript
// ✅ Good: check null before threshold comparison
if (reading.soilMoisture !== null) {
  if (reading.soilMoisture < config.soilMoistureMin) {
    // Create alert
  }
}
// Never compare null: `null < 20` is false — silently skipping the alert
```

---

## Relation Filters

### Filtering through relations

```typescript
// ✅ Good: filter readings by station (through device relation)
const readings = await prisma.readings.findMany({
  where: {
    device: {
      stationId: stationId,
    },
  },
});
```

```typescript
// ✅ Good: filter devices that have at least one open alert
const devicesWithAlerts = await prisma.device.findMany({
  where: {
    alerts: {
      some: {
        status: "OPEN",
      },
    },
  },
});
```

```typescript
// ✅ Good: filter stations that have NO devices
const emptyStations = await prisma.station.findMany({
  where: {
    devices: {
      none: {},
    },
  },
});
```

---

## Type-Safe Query Results

### Use `Prisma.EntityGetPayload` for typed results

```typescript
// ✅ Good: type the result of a query with specific includes
import { Prisma } from "@prisma/client";

type DeviceWithStation = Prisma.DeviceGetPayload<{
  include: {
    station: { select: { id: true; name: true } };
    _count: { select: { readings: true; alerts: true } };
  };
}>;

function renderDevice(device: DeviceWithStation) {
  console.log(device.station?.name);       // typed as string | undefined
  console.log(device._count.readings);     // typed as number
}
```

```typescript
// ✅ Good: type function parameters from query results
async function checkAndCreateAlerts(
  reading: Prisma.ReadingsGetPayload<{}>,
  device: Prisma.DeviceGetPayload<{ include: { station: true } }>
) {
  // reading.soilMoisture is typed as Float | null
  // device.station is typed as Station | null
  // device.batteryWarning is typed as number
}
```

---

## Pagination Pattern

```typescript
// ✅ Good: cursor-free offset pagination (our standard pattern)
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const perPage = 15;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { ...(params.status && { status: params.status }) },
      select: { id: true, name: true, email: true, role: true, status: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.user.count({
      where: { ...(params.status && { status: params.status }) },
    }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      <table>{/* render users */}</table>
      <Pagination current={page} total={totalPages} />
    </div>
  );
}
```

**Rules**:
- Always run `findMany` + `count` in `Promise.all` (parallel)
- Use `skip/take`, not cursor-based, unless you have 100K+ records
- Keep `perPage` consistent: **15** for management pages
- Clamp page to `Math.max(1, ...)` to prevent negative skip

---

## Indexing Awareness

Know which queries hit indexes and which do full table scans:

```typescript
// ✅ Uses index: @@index([deviceId, dateTime])
prisma.readings.findMany({
  where: { deviceId: "uuid", dateTime: { gte: startDate } },
  orderBy: { dateTime: "desc" },
});

// ✅ Uses unique index: @@unique([deviceId, unixTime])
prisma.readings.upsert({
  where: { deviceId_unixTime: { deviceId: "uuid", unixTime: BigInt(123) } },
});

// ✅ Uses index: @@index([stationId, status])
prisma.alert.findMany({
  where: { stationId: "uuid", status: "OPEN" },
});

// ⚠️ Full table scan: no index on message field
prisma.alert.findMany({
  where: { message: { contains: "baterai" } },
});
// Don't text-search on unindexed fields with large tables
```

---

## Quick Reference

| Pattern | Rule |
|---|---|
| Client import | Always `import { prisma } from "@/lib/prisma"` |
| List queries | Use `select` — never return `password` or unnecessary fields |
| Relation counts | Use `_count` — never load relations just to count |
| Multiple queries | Use `Promise.all` — never sequential waterfalls |
| Dynamic filters | Use `...(condition && { field: value })` spread pattern |
| Single record by unique | Use `findUnique` — not `findFirst` |
| Missing record (page) | Call `notFound()` from `next/navigation` |
| Missing record (action) | `throw new Error("... tidak ditemukan")` |
| Ordering | Always explicit `orderBy` — never rely on implicit order |
| Deduplication | Use `upsert` on composite unique — never find-then-create |
| Deletion | Check status → check dependents → delete → audit → revalidate |
| BigInt | Convert with `BigInt()` on write, `.toString()` on serialize |
| Null sensor values | Preserve `null` — never default to `0` |
| Type safety | Use `Prisma.EntityGetPayload<{...}>` for query result types |
| Pagination | `skip/take` + parallel `count` — 15 per page |
