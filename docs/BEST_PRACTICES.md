# BEST_PRACTICES.md — Next.js App Router Patterns

> Opinionated rules for this codebase. Every ✅/🔴 example is based on
> patterns that actually exist (or should exist) in this project.
> **Stack**: Next.js 16 · React 19 · Prisma 7 · Server Actions · Auth.js v5

---

## You Might Not Need `"use client"`

Server Components are the default in the App Router. They run on the server,
can `await` Prisma queries directly, and send zero JavaScript to the browser.
Only add `"use client"` when you **must** — for interactivity (event handlers,
hooks, browser APIs).

```tsx
// 🔴 Avoid: making a page a Client Component just to show data
"use client";

import { useEffect, useState } from "react";

export default function StationsPage() {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then(setStations);
  }, []);

  return (
    <ul>
      {stations.map((s) => (
        <li key={s.id}>{s.name}</li>
      ))}
    </ul>
  );
}
```

```tsx
// ✅ Good: Server Component — queries Prisma directly, zero client JS
import { prisma } from "@/lib/prisma";

export default async function StationsPage() {
  const stations = await prisma.station.findMany();

  return (
    <ul>
      {stations.map((s) => (
        <li key={s.id}>{s.name}</li>
      ))}
    </ul>
  );
}
```

**The rule**: If a component only *displays* data and has no `onClick`,
`onChange`, `useState`, or `useEffect` — it should be a Server Component
(no `"use client"` directive).

### When you DO need `"use client"`

- Components with `useState`, `useEffect`, `useRef`
- Components with event handlers (`onClick`, `onChange`, `onSubmit`)
- Components using browser APIs (`window`, `navigator`, `localStorage`)
- Components using `useSession()` from `next-auth/react`
- Components using `useRouter()`, `usePathname()` from `next/navigation`
- Components using Radix UI primitives (Dialog, DropdownMenu, etc.)

### Minimise the Client boundary

When only a small part of a page needs interactivity, extract **just that
part** into a Client Component. Keep the parent as a Server Component.

```tsx
// 🔴 Avoid: entire page is "use client" because of one button
"use client";

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  // ... fetch, render table, etc.

  return (
    <div>
      {/* 300 lines of static table rendering */}
      <button onClick={() => setShowModal(true)}>Tambah Perangkat</button>
    </div>
  );
}
```

```tsx
// ✅ Good: page is Server Component, only the modal button is client
import { prisma } from "@/lib/prisma";
import { DeviceFormModal } from "./_components/device-form-modal"; // "use client"

export default async function DevicesPage() {
  const devices = await prisma.device.findMany({ ... });

  return (
    <div>
      {/* Static table rendered on server — zero JS shipped */}
      <table>...</table>
      {/* Only this component ships JS to the browser */}
      <DeviceFormModal stations={stations} />
    </div>
  );
}
```

---

## You Might Not Need an API Route

In this codebase, **Server Actions** are the primary way to mutate data from
the dashboard UI. API routes (`/api/*`) exist only for:

1. **IoT device communication** (`/api/readings`) — external devices push data
2. **Auth.js handler** (`/api/auth/[...nextauth]`) — framework requirement
3. **External integrations** — third-party systems that call your API

For everything else — creating users, updating stations, resolving alerts —
use Server Actions.

```tsx
// 🔴 Avoid: creating an API route for UI-driven mutations
// src/app/api/users/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await prisma.user.create({ data: body });
  return NextResponse.json(user);
}

// src/app/dashboard/management/users/_components/user-form.tsx
"use client";
async function handleSubmit() {
  await fetch("/api/users", {
    method: "POST",
    body: JSON.stringify(formData),
  });
}
```

```tsx
// ✅ Good: Server Action — type-safe, no manual serialization, no route file
// src/app/dashboard/management/users/actions/user.ts
"use server";

export async function createUser(data: { name: string; email: string; ... }) {
  const session = await requireSuperAdmin();
  const user = await prisma.user.create({ data: { ... } });
  await prisma.adminLog.create({ ... });
  revalidatePath("/dashboard/management/users");
  return user;
}

// src/app/dashboard/management/users/_components/user-form.tsx
"use client";
import { createUser } from "../actions/user";

async function handleSubmit() {
  await createUser(formData); // Direct function call, fully typed
}
```

**Why Server Actions win for UI mutations**:
- Type-safe end-to-end (no `fetch` + `JSON.parse` + `any`)
- No need to write route files, handle HTTP methods, or parse requests
- Automatic `revalidatePath()` cache invalidation
- Auth checks inline (`await auth()`)
- Audit logging colocated with the mutation

---

## You Might Not Need `useEffect`

This is the single most important rule. Most `useEffect` calls in a Next.js
App Router project are unnecessary. Ask: **"Is this synchronizing with an
external system?"** If not, you probably don't need it.

### Fetching data on mount

```tsx
// 🔴 Avoid: fetching data in useEffect on a dashboard page
"use client";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <Skeleton />;
  return <StatCards data={stats} />;
}
```

```tsx
// ✅ Good: Server Component fetches directly — no loading state needed
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [totalStations, activeDevices, openAlerts] = await Promise.all([
    prisma.station.count(),
    prisma.device.count({ where: { status: "BEROPERASI" } }),
    prisma.alert.count({ where: { status: "OPEN" } }),
  ]);

  return <StatCards totalStations={totalStations} activeDevices={activeDevices} openAlerts={openAlerts} />;
}
```

### Deriving state from props/state

```tsx
// 🔴 Avoid: useEffect to compute filtered list
"use client";

function AlertList({ alerts, statusFilter }) {
  const [filteredAlerts, setFilteredAlerts] = useState([]);

  useEffect(() => {
    setFilteredAlerts(alerts.filter((a) => a.status === statusFilter));
  }, [alerts, statusFilter]);

  return <ul>{filteredAlerts.map(...)}</ul>;
}
```

```tsx
// ✅ Good: calculate during rendering
function AlertList({ alerts, statusFilter }) {
  const filteredAlerts = alerts.filter((a) => a.status === statusFilter);
  return <ul>{filteredAlerts.map(...)}</ul>;
}
```

If the calculation is expensive (thousands of items), use `useMemo`:

```tsx
// ✅ Good: memoize expensive calculations
const filteredAlerts = useMemo(
  () => alerts.filter((a) => a.status === statusFilter),
  [alerts, statusFilter]
);
```

### Resetting state when a prop changes

```tsx
// 🔴 Avoid: resetting form state with useEffect
function DeviceDetail({ deviceId }) {
  const [formData, setFormData] = useState({ name: "" });

  useEffect(() => {
    // Reset form when device changes
    fetchDevice(deviceId).then(setFormData);
  }, [deviceId]);

  return <form>...</form>;
}
```

```tsx
// ✅ Good: use key to unmount/remount the entire form
function DeviceDetailPage({ params }) {
  const device = await prisma.device.findUnique({ where: { id: params.id } });
  return <DeviceForm device={device} key={device.id} />;
}

function DeviceForm({ device }) {
  // State initializes fresh for each device because key changes
  const [name, setName] = useState(device.deviceName);
  return <form>...</form>;
}
```

### Sending data on button click

```tsx
// 🔴 Avoid: triggering a side effect from state change via useEffect
"use client";

function ResolveAlertButton({ alertId }) {
  const [shouldResolve, setShouldResolve] = useState(false);

  useEffect(() => {
    if (shouldResolve) {
      resolveAlert(alertId, "Resolved");
      setShouldResolve(false);
    }
  }, [shouldResolve, alertId]);

  return <button onClick={() => setShouldResolve(true)}>Resolve</button>;
}
```

```tsx
// ✅ Good: call the action directly in the event handler
"use client";

function ResolveAlertButton({ alertId }) {
  async function handleClick() {
    await resolveAlert(alertId, "Resolved");
    toast.success("Alert resolved");
  }

  return <button onClick={handleClick}>Resolve</button>;
}
```

### When you DO need `useEffect`

- **Subscribing to external systems**: WebSocket connections, browser event
  listeners (`resize`, `online`/`offline`), third-party widget SDKs
- **Polling intervals**: The sidebar alert badge polls every 30 seconds — this
  IS a valid `useEffect` because it synchronizes with an external system (the
  database state changing over time)
- **Analytics on mount**: `useEffect(() => { trackPageView() }, [])` — because
  it should fire when the component is *displayed*, not when an event happens
- **Focus/scroll management**: `useEffect(() => { inputRef.current?.focus() }, [])`

---

## You Might Not Need `useState` for URL State

Filters, pagination, and search queries should live in the URL (searchParams),
not in React state. This makes pages bookmarkable, shareable, and
back-button-friendly.

```tsx
// 🔴 Avoid: filter state in useState
"use client";

function UsersPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch(`/api/users?status=${status}&search=${search}`)
      .then((r) => r.json())
      .then(setUsers);
  }, [status, search]);

  return (
    <div>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>...</select>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      <table>{/* render users */}</table>
    </div>
  );
}
```

```tsx
// ✅ Good: URL-driven filters in a Server Component (our actual pattern)
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = params.status || "";
  const search = params.search || "";
  const page = parseInt(params.page || "1", 10);

  const users = await prisma.user.findMany({
    where: {
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    skip: (page - 1) * 15,
    take: 15,
  });

  return (
    <div>
      {/* Native <form> submits to the same URL with query params */}
      <form>
        <input name="search" defaultValue={search} />
        <select name="status" defaultValue={status}>...</select>
        <button type="submit">Filter</button>
      </form>
      <table>{/* render users */}</table>
    </div>
  );
}
```

---

## You Might Not Need a Loading Spinner

Server Components render on the server and stream HTML. The user sees content
as soon as it's ready — no spinner, no skeleton, no flash of loading state.

```tsx
// 🔴 Avoid: loading state for initial data
"use client";

function StationsPage() {
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);

  useEffect(() => {
    fetchStations().then((data) => {
      setStations(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;
  return <StationTable data={stations} />;
}
```

```tsx
// ✅ Good: Server Component — no loading state, data is ready at render time
export default async function StationsPage() {
  const stations = await prisma.station.findMany({ ... });
  return <StationTable data={stations} />;
}
```

For slow queries, use `<Suspense>` with a fallback — but only when needed:

```tsx
// ✅ Good: Suspense for intentionally slow/streaming sections
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCards /> {/* async Server Component */}
      </Suspense>
      <Suspense fallback={<RecentAlertsSkeleton />}>
        <RecentAlerts /> {/* async Server Component */}
      </Suspense>
    </div>
  );
}
```

---

## Prisma Query Patterns

### Parallel queries with `Promise.all`

```tsx
// 🔴 Avoid: sequential queries (waterfall)
const stations = await prisma.station.findMany();
const users = await prisma.user.count();
const alerts = await prisma.alert.count({ where: { status: "OPEN" } });
// Total: stationTime + userTime + alertTime
```

```tsx
// ✅ Good: parallel queries
const [stations, userCount, openAlerts] = await Promise.all([
  prisma.station.findMany(),
  prisma.user.count(),
  prisma.alert.count({ where: { status: "OPEN" } }),
]);
// Total: max(stationTime, userTime, alertTime)
```

### Use `select` to limit returned fields

```tsx
// 🔴 Avoid: fetching entire user record when you only need name
const users = await prisma.user.findMany();
// Returns password, all timestamps, everything
```

```tsx
// ✅ Good: select only what you need
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    station: { select: { name: true } },
  },
});
```

### Use `include` with `_count` for relation counts

```tsx
// 🔴 Avoid: fetching all related records just to count them
const stations = await prisma.station.findMany({
  include: { devices: true, admins: true },
});
// Then: station.devices.length — loads ALL device data into memory
```

```tsx
// ✅ Good: let the database count
const stations = await prisma.station.findMany({
  include: {
    _count: {
      select: { devices: true, admins: true },
    },
  },
});
// Use: station._count.devices — single integer, no data loaded
```

### Handle nulls explicitly

```tsx
// 🔴 Avoid: calibrating null sensor values as 0
waterLevel: applyCalibration(raw.rawWaterLevel ?? 0, formulas.waterLevel, params)
// If sensor didn't send water_level, you now have a fake "0" reading
```

```tsx
// ✅ Good: preserve null — null means "no data"
waterLevel: raw.rawWaterLevel != null
  ? applyCalibration(raw.rawWaterLevel, formulas.waterLevel, params)
  : null
```

---

## Server Action Patterns

### Always validate, always audit

```tsx
// 🔴 Avoid: no auth check, no validation, no audit trail
"use server";

export async function deleteStation(id: string) {
  await prisma.station.delete({ where: { id } });
  revalidatePath("/dashboard/management/stations");
}
```

```tsx
// ✅ Good: auth + validation + safety checks + audit + revalidation
"use server";

export async function deleteStation(stationId: string) {
  const session = await requireSuperAdmin();

  const station = await prisma.station.findUnique({
    where: { id: stationId },
    include: {
      admins: { select: { id: true } },
      devices: { select: { id: true } },
    },
  });
  if (!station) throw new Error("Stasiun tidak ditemukan");
  if (station.status !== "NONAKTIF") {
    throw new Error("Stasiun harus dinonaktifkan terlebih dahulu");
  }
  if (station.admins.length > 0) {
    throw new Error("Tidak dapat menghapus stasiun yang masih memiliki admin");
  }
  if (station.devices.length > 0) {
    throw new Error("Tidak dapat menghapus stasiun yang masih memiliki perangkat");
  }

  await prisma.station.delete({ where: { id: stationId } });

  await prisma.adminLog.create({
    data: {
      action: "STATION_DELETED",
      entityType: "STATION",
      entityId: stationId,
      userId: session.user.id,
      oldValues: { name: station.name },
    },
  });

  revalidatePath("/dashboard/management/stations");
}
```

### Don't duplicate auth guard logic

```tsx
// 🔴 Avoid: copy-pasting auth checks in every action
export async function createDevice(data) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
  // ...
}

export async function updateDevice(id, data) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
  // ...
}
```

```tsx
// ✅ Good: shared guard function at top of file
async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Tidak terautentikasi");
  if (session.user.role !== "SUPER_ADMIN") {
    throw new Error("Tidak memiliki izin");
  }
  return session;
}

export async function createDevice(data) {
  const session = await requireSuperAdmin();
  // ...
}

export async function updateDevice(id, data) {
  const session = await requireSuperAdmin();
  // ...
}
```

---

## Auth Patterns

### Server vs Client auth access

```tsx
// 🔴 Avoid: using useSession() in a Server Component
// (This will error — hooks don't work in Server Components)
import { useSession } from "next-auth/react";

export default async function DashboardPage() {
  const { data: session } = useSession(); // ❌ Error!
}
```

```tsx
// ✅ Good: use auth() in Server Components
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  // session.user.role, session.user.stationId are available
}
```

```tsx
// ✅ Good: use useSession() only in Client Components
"use client";
import { useSession } from "next-auth/react";

function NavUser() {
  const { data: session } = useSession();
  return <span>{session?.user?.name}</span>;
}
```

### Role-scoped queries

```tsx
// 🔴 Avoid: returning all data regardless of role
export default async function AlertsPage() {
  const alerts = await prisma.alert.findMany(); // ADMIN_LOCATION sees everything!
}
```

```tsx
// ✅ Good: scope queries by user's station
export default async function AlertsPage() {
  const session = await auth();
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  const alerts = await prisma.alert.findMany({
    where: {
      // ADMIN_LOCATION only sees their station
      ...(!isSuperAdmin && { stationId: session.user.stationId }),
    },
  });
}
```

---

## Error Handling

### User-facing errors in Indonesian

```tsx
// 🔴 Avoid: English errors shown to Indonesian-speaking users
throw new Error("User not found");
throw new Error("Station must be deactivated first");
```

```tsx
// ✅ Good: Indonesian error messages
throw new Error("Pengguna tidak ditemukan");
throw new Error("Stasiun harus dinonaktifkan terlebih dahulu");
```

### Client-side error handling with toast

```tsx
// 🔴 Avoid: swallowing errors silently
async function handleDelete() {
  try {
    await deleteUser(userId);
  } catch {
    // error silently ignored
  }
}
```

```tsx
// 🔴 Avoid: showing raw error objects
async function handleDelete() {
  try {
    await deleteUser(userId);
  } catch (error) {
    alert(error); // Shows "[object Error]"
  }
}
```

```tsx
// ✅ Good: toast with the server's error message
async function handleDelete() {
  try {
    await deleteUser(userId);
    toast.success("Pengguna berhasil dihapus");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
  }
}
```

---

## Component Composition

### Pass Server data to Client components via props

```tsx
// 🔴 Avoid: Client Component fetches its own data
"use client";

function StationSelector() {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    fetch("/api/stations").then(r => r.json()).then(setStations);
  }, []);

  return <select>{stations.map(s => <option key={s.id}>{s.name}</option>)}</select>;
}
```

```tsx
// ✅ Good: Server Component fetches, passes data down as props
// page.tsx (Server Component)
export default async function UsersPage() {
  const stations = await prisma.station.findMany({
    where: { status: "AKTIF" },
    select: { id: true, name: true },
  });

  return <UserFormModal stations={stations} />;
}

// _components/user-form-modal.tsx (Client Component)
"use client";

function UserFormModal({ stations }: { stations: { id: string; name: string }[] }) {
  // stations are already available — no fetch needed
  return <select>{stations.map(s => <option key={s.id}>{s.name}</option>)}</select>;
}
```

---

## Quick Decision Checklist

| Question | Answer |
|---|---|
| Am I displaying data? | → Server Component |
| Am I handling a click/submit? | → Client Component, event handler |
| Am I mutating data from the UI? | → Server Action |
| Am I receiving data from IoT devices? | → API Route |
| Am I filtering/sorting existing data? | → Calculate during render |
| Am I storing filter/page/search state? | → URL searchParams |
| Am I doing something when the component appears? | → `useEffect` (valid) |
| Am I doing something when a button is clicked? | → Event handler (NOT `useEffect`) |
| Am I syncing with a WebSocket/timer/external API? | → `useEffect` (valid) |
| Do I need a loading spinner for a Server Component? | → `<Suspense fallback={...}>` |

---

## Recap

- Default to **Server Components**. Only add `"use client"` for interactivity.
- Use **Server Actions** for UI mutations. API routes are for external systems.
- **Never** use `useEffect` for data that can be fetched in a Server Component.
- **Calculate** derived values during render — don't store them in state.
- Put filter/pagination state in the **URL**, not `useState`.
- Always **auth-guard** Server Actions and **audit-log** every mutation.
- Write user-facing error messages in **Indonesian**.
- Use **`Promise.all`** for parallel Prisma queries.
- Use **`select`** to limit Prisma query payloads.
- Preserve **null** sensor values — don't default to 0.
