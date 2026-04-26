# CONVENTIONS.md — Code Style & Patterns

> **For AI models**: Follow these conventions exactly. Do NOT deviate — consistency is more important than personal preference.

---

## Language & Locale

- **UI Language**: Indonesian (Bahasa Indonesia) for all user-facing strings
  - Button labels: "Simpan", "Hapus", "Filter", "Reset", "Masuk"
  - Error messages: "Pengguna tidak ditemukan", "Email sudah terdaftar"
  - Page titles: "Kelola Pengguna", "Kelola Stasiun", "Notifikasi & Peringatan"
- **Code Language**: English for all code identifiers (variable names, function names, comments)
- **Date Format**: Indonesian locale (`"id-ID"`) for display
  ```typescript
  date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
  ```

---

## File Naming

| Type                   | Pattern                | Example                          |
|------------------------|------------------------|----------------------------------|
| Page component         | `page.tsx`             | `src/app/dashboard/page.tsx`     |
| Layout component       | `layout.tsx`           | `src/app/dashboard/layout.tsx`   |
| Client component       | `kebab-case.tsx`       | `user-actions.tsx`               |
| Server Action file     | `kebab-case.ts`        | `user.ts`, `station.ts`         |
| Library/utility        | `kebab-case.ts`        | `calibration.ts`, `prisma.ts`   |
| Hook                   | `use-kebab-case.ts`    | `use-mobile.ts`                  |
| Shadcn component       | `kebab-case.tsx`       | `dropdown-menu.tsx`              |
| API route              | `route.ts`             | `src/app/api/readings/route.ts`  |

---

## Directory Naming

| Pattern                      | Meaning                                    |
|------------------------------|--------------------------------------------|
| `kebab-case/`                | Route segment (URL-mapped)                 |
| `_components/`               | Private directory (not a route), page-local components |
| `_lib/`                      | Private directory, page-local utilities    |
| `actions/`                   | Server Action files for that module        |
| `[param]/`                   | Dynamic route segment                      |
| `[...param]/`                | Catch-all route segment                    |

---

## Component Patterns

### Server Components (Default)

Pages are async Server Components by default. No `"use client"` directive.

```typescript
// page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SomePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const data = await prisma.someModel.findMany({ ... });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Page Title
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Page description
          </p>
        </div>
        {/* Action button (e.g., Create modal) */}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {/* Stat cards */}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-center gap-3 mb-6">
        {/* Filter controls */}
      </form>

      {/* Data Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Table */}
      </div>

      {/* Pagination */}
    </div>
  );
}
```

### Client Components

Only use `"use client"` when you need interactivity (onClick, useState, useEffect, etc.).

```typescript
"use client";

import { useState } from "react";
import { toast } from "sonner";

export function SomeClientComponent({ data }: { data: SomeType }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleAction() {
    setIsLoading(true);
    try {
      await someServerAction(data.id);
      toast.success("Berhasil!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }

  return <button onClick={handleAction} disabled={isLoading}>...</button>;
}
```

---

## Server Action Patterns

### File Structure

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// 1. Auth guard function (top of file)
async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Tidak terautentikasi");
  if (session.user.role !== "SUPER_ADMIN") {
    throw new Error("Tidak memiliki izin");
  }
  return session;
}

// 2. Action functions follow CRUD order: Create, Read, Update, Delete
export async function createEntity(data: { ... }) {
  const session = await requireSuperAdmin();

  // Validate input
  // Check for duplicates
  // Create entity
  // Create audit log
  // Revalidate cache

  revalidatePath("/dashboard/management/...");
  return entity;
}
```

### Audit Log Convention

Every mutation creates an `AdminLog` entry:

```typescript
await prisma.adminLog.create({
  data: {
    action: "ENTITY_ACTION",    // e.g., "USER_CREATED", "DEVICE_DELETED"
    entityType: "ENTITY",        // e.g., "USER", "DEVICE", "STATION", "ALERT"
    entityId: entity.id,
    userId: session.user.id,
    stationId: entity.stationId, // if applicable
    oldValues: { ... },          // previous state (for updates/deletes)
    newValues: { ... },          // new state (for creates/updates)
  },
});
```

**Action naming format**: `ENTITY_VERB` in SCREAMING_SNAKE_CASE.

Examples: `USER_CREATED`, `USER_UPDATED`, `USER_ACTIVATED`, `USER_DEACTIVATED`, `USER_DELETED`, `DEVICE_ASSIGNED`, `ALERT_RESOLVED`, `ALERT_CREATED_MOCK`.

---

## Error Handling

### Server Actions

Throw descriptive `Error` objects in Indonesian:

```typescript
throw new Error("Pengguna tidak ditemukan");
throw new Error("Email sudah terdaftar");
throw new Error("Stasiun harus aktif untuk menambah perangkat");
throw new Error("Tidak dapat menghapus stasiun yang masih memiliki admin");
```

### Client-Side Error Display

Use `toast` from Sonner, catching the error message:

```typescript
try {
  await serverAction();
  toast.success("Berhasil diperbarui");
} catch (error) {
  toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
}
```

### API Routes

Return structured JSON errors:

```typescript
return NextResponse.json(
  { error: "Device not found" },
  { status: 404 }
);
```

---

## Styling Conventions

### Framework

- **Tailwind CSS v4** with `@theme` system (see `globals.css`)
- **Shadcn UI** (radix-nova style) for accessible components
- **No custom CSS files** — everything via Tailwind utility classes

### Color Palette (Shadcn Tokens)

Use Shadcn semantic tokens, not raw colors:

```
foreground / muted-foreground    — Text colors
background / card                — Background colors
primary / primary-foreground     — Primary action
destructive                      — Delete/error
border / input / ring            — Borders and focus
accent / accent-foreground       — Hover states
```

### Status Badge Colors

| Status/Type   | Badge Classes                              |
|---------------|--------------------------------------------|
| Active/Success | `bg-emerald-100 text-emerald-700`         |
| Warning        | `bg-amber-100 text-amber-700`             |
| Error/Danger   | `bg-red-100 text-red-700`                 |
| Info/Neutral   | `bg-blue-100 text-blue-700`               |
| Purple/Role    | `bg-purple-100 text-purple-700`            |
| Indigo/Admin   | `bg-indigo-100 text-indigo-700`            |
| Slate/Default  | `bg-slate-100 text-slate-700`              |

### Stat Card Pattern

```tsx
<div className={`rounded-xl border p-4 ${urgent ? "border-red-200 bg-red-50/50" : "bg-card"}`}>
  <div className="flex items-center gap-2 mb-3">
    <div className={`p-1.5 rounded-lg ${stat.color}`}>
      <StatIcon className="size-4" />
    </div>
  </div>
  <p className="text-2xl font-bold font-heading text-foreground">{value}</p>
  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
</div>
```

### Table Pattern

```tsx
<div className="rounded-xl border bg-card overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-muted/50 text-left">
          <th className="px-4 py-3 font-medium text-muted-foreground">Column</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
          <td className="px-4 py-3">Value</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## Import Order

```typescript
// 1. React / Next.js
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// 2. Third-party libraries
import { z } from "zod";
import { toast } from "sonner";

// 3. Internal libraries
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 4. Components
import { Button } from "@/components/ui/button";
import { SomeComponent } from "./_components/some-component";

// 5. Types (if separate)
import type { SomeType } from "@/types/some-type";
```

---

## TypeScript Conventions

- **Strict mode**: `"strict": true` in tsconfig
- **Path aliases**: Use `@/*` for `./src/*` imports (never relative `../../`)
- **Prisma types**: Use `Prisma.EntityGetPayload<{ include: {...} }>` for typed query results
- **No `any`**: Use `Record<string, unknown>` for generic objects
- **Enum values**: Always use the Prisma enum string directly:
  ```typescript
  // ✅ Correct
  where: { status: "AKTIF" }

  // ❌ Avoid importing enum type for values
  where: { status: UserStatus.AKTIF }
  ```

---

## Data Fetching Patterns

### Page-Level (Server Component)

```typescript
// Parallel queries with Promise.all
const [items, total, stats] = await Promise.all([
  prisma.entity.findMany({ where, skip, take, include: { ... } }),
  prisma.entity.count({ where }),
  Promise.all([
    prisma.entity.count(),
    prisma.entity.count({ where: { status: "AKTIF" } }),
  ]),
]);
```

### Pagination

URL-based pagination via searchParams:

```typescript
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const perPage = 15;

  const items = await prisma.entity.findMany({
    skip: (page - 1) * perPage,
    take: perPage,
  });
}
```

---

## Cache Invalidation

After every Server Action mutation, call `revalidatePath()` for:
1. The list page (always)
2. The detail page (if it exists)
3. Related pages (e.g., station list when device assignment changes)

```typescript
revalidatePath("/dashboard/management/users");
revalidatePath(`/dashboard/management/users/${userId}`);
```

---

## Icon Usage

- **Library**: Lucide React (`lucide-react`)
- **Sizing**: Use `className="size-4"` (Tailwind shorthand for w-4 h-4)
- **Common icons**:
  - Navigation: `LayoutDashboard`, `MapPin`, `Cpu`, `Bell`, `ScrollText`
  - Monitoring: `Droplets`, `Activity`, `Brain`, `CloudRain`
  - Status: `CheckCircle2`, `XCircle`, `AlertTriangle`, `Clock`
  - Actions: `Plus`, `Pencil`, `Trash2`, `Eye`, `MoreHorizontal`
  - Users: `Users`, `UserCheck`, `UserX`, `Shield`

---

## Git Conventions

- **Branch naming**: `feature/feature-name`, `fix/bug-name`
- **Commit messages**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`)
- **Ignored**: `.next/`, `node_modules/`, `.env`, `prisma/migrations/` output
