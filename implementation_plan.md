# Rebuild NYAWIT — Better Auth + Full Bug Fixes + Feature Completion

## Background

The current codebase works but has critical security holes (unauthenticated APIs, exposed secrets), incomplete features (6+ empty pages), and auth issues (NextAuth v5 type conflicts, cookie-based middleware). This plan covers:

1. **Migrate from NextAuth v5 → Better Auth** with admin plugin + RBAC
2. **Fix all critical/high bugs** found in the codebase review
3. **Complete unfinished features** (logs, settings, AI predictions)
4. **Improve code quality** (types, dark mode, error boundaries)

---

## User Review Required

> [!IMPORTANT]
> **Approach**: This plan assumes we rebuild **in-place** on the existing codebase (not a greenfield). Your existing Prisma schema (Station, Device, Readings, Alert, AIInsight, AdminLog, SystemConfig) stays intact — only the User model and auth-related code changes. All your existing seed data, calibration engine, and UI components are preserved.

> [!WARNING]
> **Breaking Change**: Better Auth manages its own `user`, `session`, `account`, and `verification` tables. Your current `User` model will need to be adapted. Existing user passwords will need re-hashing if Better Auth uses a different algorithm (it uses bcrypt by default, same as yours, so migration should be seamless).

> [!IMPORTANT]
> **Database**: Since you're using Neon PostgreSQL, you'll need to run `npx @better-auth/cli generate` to update your Prisma schema, then `prisma migrate dev` to apply. Existing data in the `users` table will need a one-time migration script to add Better Auth's required fields (`emailVerified`, etc.).

---

## Open Questions

> [!IMPORTANT]
> 1. **Do you want to keep the same Neon database or start fresh?** If keeping it, we'll write a migration script. If fresh, we just re-seed.
> 2. **Do you want email verification?** Better Auth supports it via Resend/SendGrid. Your current system doesn't have it.
> 3. **Do you want to keep both `SUPER_ADMIN` and `ADMIN_LOCATION` roles, or switch to Better Auth's organization model?** Option A: Use Better Auth's `admin` plugin (simple role field on user). Option B: Use the `organization` plugin (stations become organizations, admins become members). I recommend **Option A** since your role model is simple (2 roles + station assignment).
> 4. **Which features do you want to prioritize first?** The empty pages (logs, settings, prediksi-ai) are significant work. Should we focus on auth + bugs first, then tackle features in a second pass?

---

## Proposed Changes

### Phase 1: Auth Migration (Better Auth)

#### Dependencies

##### [MODIFY] [package.json](file:///d:/School/Project/Soil_Monitoring_System/package.json)
- Remove: `next-auth`
- Add: `better-auth`
- Node engine: add `"engines": { "node": ">=20" }`

---

#### Auth Server Config

##### [MODIFY] [auth.ts](file:///d:/School/Project/Soil_Monitoring_System/src/lib/auth.ts)
Complete rewrite. Replace NextAuth config with Better Auth:

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: 8 * 60 * 60, // 8 hours
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  user: {
    additionalFields: {
      stationId: { type: "string", required: false },
      companyName: { type: "string", required: false },
      status: { type: "string", required: false, defaultValue: "AKTIF" },
    },
  },
  plugins: [
    admin({
      defaultRole: "user", // ADMIN_LOCATION
      adminRoles: ["admin"], // SUPER_ADMIN
    }),
  ],
});
```

##### [NEW] [auth-client.ts](file:///d:/School/Project/Soil_Monitoring_System/src/lib/auth-client.ts)
Client-side auth instance for React components:
```typescript
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient()],
});
```

##### [MODIFY] [route.ts](file:///d:/School/Project/Soil_Monitoring_System/src/app/api/auth/%5B...nextauth%5D/route.ts)
- **Rename** directory from `[...nextauth]` to `[...all]`
- Replace content with Better Auth handler:
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
export const { GET, POST } = toNextJsHandler(auth);
```

##### [MODIFY] [middleware.ts](file:///d:/School/Project/Soil_Monitoring_System/src/middleware.ts)
Use Better Auth's `getSessionCookie` for proper cookie validation:
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export default function middleware(req: NextRequest) {
  const session = getSessionCookie(req);
  const isLoggedIn = !!session;
  // ... rest of logic stays the same
}
```

---

#### Auth-Dependent Components

##### [MODIFY] [dashboard-layout.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/dashboard/_components/dashboard-layout.tsx)
- Remove `SessionProvider` from `next-auth/react`
- Use Better Auth's client `useSession` hook instead

##### [MODIFY] [nav-user.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/dashboard/_components/nav-user.tsx)
- Replace `signOut` from `next-auth/react` with `authClient.signOut()`

##### [MODIFY] [login/page.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/auth/login/page.tsx)
- Replace `signIn("credentials", ...)` with `authClient.signIn.email({ email, password })`
- Remove or implement "Remember me" properly
- Remove "Lupa password?" button (or implement it with Better Auth's password reset flow)

##### [MODIFY] All server actions & server components that call `auth()`
Replace `const session = await auth()` with:
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
const session = await auth.api.getSession({ headers: await headers() });
```

Affected files:
- [dashboard/page.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/dashboard/page.tsx)
- [alerts/page.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/dashboard/alerts/page.tsx)
- [stations/page.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/dashboard/management/stations/page.tsx)
- [devices/page.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/dashboard/management/devices/page.tsx)
- [users/page.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/dashboard/management/users/page.tsx)
- [water-level/page.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/dashboard/monitoring/water-level/page.tsx)
- All monitoring pages
- [alert.ts (server action)](file:///d:/School/Project/Soil_Monitoring_System/src/app/dashboard/alerts/_components/actions/alert.ts)
- [station.ts (server action)](file:///d:/School/Project/Soil_Monitoring_System/src/app/dashboard/management/stations/actions/station.ts)

---

#### Prisma Schema Updates

##### [MODIFY] [schema.prisma](file:///d:/School/Project/Soil_Monitoring_System/prisma/schema.prisma)
- Run `npx @better-auth/cli generate` to add Better Auth's `session`, `account`, `verification` tables
- Keep custom fields on `User` model: `stationId`, `companyName`, `status`, `role`
- Better Auth's admin plugin adds a `role` and `banned` field to the user model automatically

##### [MODIFY] [seed.ts](file:///d:/School/Project/Soil_Monitoring_System/prisma/seed.ts)
- Update user creation to match Better Auth's User model (add `emailVerified: true`)
- Use env vars for passwords instead of hardcoded values
- Map roles: `SUPER_ADMIN` → `"admin"`, `ADMIN_LOCATION` → `"user"`

---

### Phase 2: Security Fixes

##### [MODIFY] [readings/route.ts](file:///d:/School/Project/Soil_Monitoring_System/src/app/api/readings/route.ts)
- **POST**: Add API key authentication (`X-API-Key` header checked against `DEVICE_API_KEY` env var)
- **GET**: Add session authentication (require logged-in user, scope by station for ADMIN_LOCATION)
- Fix BigInt serialization in GET response (convert `unixTime` to `Number`)
- Fix "new reading" detection (use pre-query timestamp instead of 5-second heuristic)

##### [MODIFY] [alerts/route.ts](file:///d:/School/Project/Soil_Monitoring_System/src/app/api/alerts/route.ts)
- **GET**: Add session authentication, scope by user's station
- **PATCH**: Add session authentication (currently trusts client-sent `userId`)

##### [NEW] `.env.example`
- Create a template `.env.example` with all required vars (no real values)
- Add `DEVICE_API_KEY` placeholder

---

### Phase 3: Bug Fixes

##### [MODIFY] [calibration.ts](file:///d:/School/Project/Soil_Monitoring_System/src/lib/calibration.ts)
- Fix `calibrateAllReadings` to preserve `null` instead of coercing to `0`
- Currently: `applyCalibration(raw.rawWaterLevel ?? 0, ...)`
- Fix: Only calibrate if value is non-null, otherwise return `null`

##### [MODIFY] [readings/route.ts](file:///d:/School/Project/Soil_Monitoring_System/src/app/api/readings/route.ts)
- Fix alert dedup: scope by `deviceId` in addition to `stationId` and `alertType`
- Fix BigInt serialization crash on GET endpoint

##### [MODIFY] [Dockerfile](file:///d:/School/Project/Soil_Monitoring_System/Dockerfile)
- Change `FROM node:18-alpine` → `FROM node:20-alpine`

##### [MODIFY] [docker-compose.yml](file:///d:/School/Project/Soil_Monitoring_System/docker-compose.yml)
- Remove deprecated `version: '3.8'`
- Add `AUTH_SECRET` and `BETTER_AUTH_URL` env vars

##### [DELETE] Empty orphan directories
- `src/app/dashboard/management/device/` (orphan, `devices/` exists)
- `src/app/dashboard/management/notification/` (orphan, `alerts/` exists)

##### [MODIFY] [stations/page.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/dashboard/management/stations/page.tsx)
- Fix role guard: `"ADMIN"` → `"admin"` (Better Auth role) or remove dead code

##### [MODIFY] [devices/page.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/dashboard/management/devices/page.tsx)
- Same role guard fix

##### [DELETE] [stat-cards.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/dashboard/_components/stat-cards.tsx)
- Empty file, never imported

---

### Phase 4: Code Quality

##### [MODIFY] [dashboard-content.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/dashboard/_components/dashboard-content.tsx)
- Replace `bg-white` with `bg-card` / `bg-popover` for dark mode
- Type `ChartTooltip` props properly

##### [MODIFY] [login/page.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/auth/login/page.tsx)
- Replace hardcoded `bg-white`, `text-slate-*` with design tokens
- Remove or implement "Lupa password?" and "Remember me"

##### [NEW] [src/types/index.ts](file:///d:/School/Project/Soil_Monitoring_System/src/types/index.ts)
- Shared types for Reading, Alert, Station, Device, DashboardData
- Eliminates scattered `any` types and inline interfaces

##### [NEW] [src/app/error.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/error.tsx)
- Global error boundary

##### [NEW] [src/app/dashboard/error.tsx](file:///d:/School/Project/Soil_Monitoring_System/src/app/dashboard/error.tsx)
- Dashboard error boundary

---

### Phase 5: Feature Completion (if approved)

##### [NEW] `src/app/dashboard/logs/page.tsx`
- Admin activity log viewer
- Server component fetching from `AdminLog` table
- Filterable by user, action, entity type, date range
- Paginated table

##### [NEW] `src/app/dashboard/settings/page.tsx`
- System configuration page
- Edit `SystemConfig` singleton (soil moisture thresholds, calibration formulas)
- Profile settings (change password, name)
- Super Admin only

##### [NEW] `src/app/dashboard/monitoring/prediksi-ai/page.tsx`
- AI Insights viewer
- Display `AIInsight` records per station
- Placeholder for when ML model is integrated

##### [NEW] Complete API routes
- `src/app/api/devices/route.ts` — Device CRUD
- `src/app/api/stations/route.ts` — Station CRUD
- `src/app/api/system-config/route.ts` — SystemConfig read/update

---

## Verification Plan

### Automated Tests
```bash
# Build check
npm run build

# Prisma schema validation
npx prisma validate

# Lint
npm run lint
```

### Manual Verification
- Login flow with Better Auth (email + password)
- Session persistence (refresh page, check cookie)
- RBAC: Super Admin sees all stations, Admin Lokasi sees only assigned station
- API key auth on `POST /api/readings`
- Session auth on `GET /api/readings` and `GET /api/alerts`
- Alert creation with correct device-scoped dedup
- Calibration with null values preserved
- Dark mode rendering (no hardcoded whites)
- Docker build with Node 20

### Execution Order
1. Phase 1 (Auth migration) — foundation, everything depends on it
2. Phase 2 (Security) — critical fixes
3. Phase 3 (Bug fixes) — high/medium fixes
4. Phase 4 (Code quality) — types, dark mode, error boundaries
5. Phase 5 (Feature completion) — new pages, optional
