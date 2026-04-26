# AUTH_FLOW.md — Authentication & Authorization

## Strategy

- **Library**: Auth.js v5 (next-auth@5.0.0-beta.25)
- **Provider**: Credentials (email + password)
- **Session**: JWT-based (not database sessions)
- **Session Max Age**: 8 hours
- **Password Hashing**: bcryptjs (12 salt rounds)
- **Custom Login Page**: `/auth/login`

---

## Auth Configuration

**File**: `src/lib/auth.ts`

```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Credentials({ ... })],
  callbacks: { jwt, session },
  pages: { signIn: "/auth/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
});
```

### Credentials Provider Flow

```
1. User submits email + password
2. authorize() runs:
   a. prisma.user.findUnique({ where: { email } })
   b. Check user.status === "AKTIF" (reject NONAKTIF)
   c. bcrypt.compare(password, user.password)
   d. Update lastLoginAt timestamp
   e. Return { id, email, name, role, stationId }
3. Auth.js creates JWT with these claims
4. Session cookie set in browser
```

### JWT Callback

Enriches the JWT token with custom fields on first sign-in:

```typescript
async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
    token.role = user.role;           // "SUPER_ADMIN" | "ADMIN_LOCATION"
    token.stationId = user.stationId; // string | null
  }
  return token;
}
```

### Session Callback

Maps JWT claims to the session object accessible in Server Components:

```typescript
async session({ session, token }) {
  session.user.id = token.id;
  session.user.role = token.role;
  session.user.stationId = token.stationId;
  return session;
}
```

### Type Augmentation

```typescript
// Extends the Session type with custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      stationId: string | null;
    };
  }
}

// ⚠️ Known issue: JWT augmentation should be in "next-auth/jwt" module
declare module "next-auth" {
  interface JWT {
    id: string;
    role: string;
    stationId: string | null;
  }
}
```

---

## Auth.js Route Handler

**File**: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

This handles all Auth.js endpoints:
- `POST /api/auth/callback/credentials` — Login
- `POST /api/auth/signout` — Logout
- `GET /api/auth/session` — Session check
- `GET /api/auth/csrf` — CSRF token
- `GET /api/auth/providers` — Available providers

---

## Middleware

**File**: `src/middleware.ts`

Simple cookie-based auth guard (Edge Runtime compatible — does NOT import auth config).

```typescript
export default function middleware(req: NextRequest) {
  const sessionToken = cookies.get("authjs.session-token")?.value;
  const isLoggedIn = !!sessionToken;

  // Always allow API auth routes
  if (isApiAuthRoute) return NextResponse.next();

  // Redirect to dashboard if logged in and on login page
  if (isLoggedIn && isLoginRoute) redirect("/dashboard");

  // Redirect to login if accessing dashboard without session
  if (isDashboardRoute && !isLoggedIn) redirect("/auth/login");

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/login"],
};
```

### Route Matching

| Path Pattern          | Logged In | Not Logged In |
|-----------------------|-----------|---------------|
| `/dashboard/*`        | ✅ Allow  | → `/auth/login` |
| `/auth/login`         | → `/dashboard` | ✅ Allow  |
| `/api/auth/*`         | ✅ Allow  | ✅ Allow      |
| `/api/readings`       | ✅ Allow  | ✅ Allow      |
| `/` (root)            | N/A (server redirect to /auth/login) | |

### ⚠️ Known Issue: Production Cookie Name

The middleware checks for `authjs.session-token`, but in production HTTPS environments, Auth.js prefixes cookies with `__Secure-`:

```
Development: authjs.session-token
Production:  __Secure-authjs.session-token
```

**Fix needed**: Check for both cookie names or use `cookies.getAll()` to find any session-token cookie.

---

## Protected Routes Pattern

### Server Components

Every protected Server Component follows this pattern:

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Role check (if needed)
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Use session.user.id, session.user.role, session.user.stationId
  const data = await prisma.something.findMany({
    where: { stationId: session.user.stationId },
  });

  return <div>{/* render */}</div>;
}
```

### Server Actions

Every Server Action uses a `requireSuperAdmin()` or `requireAuth()` guard:

```typescript
"use server";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Tidak terautentikasi");
  if (session.user.role !== "SUPER_ADMIN") {
    throw new Error("Tidak memiliki izin");
  }
  return session;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Tidak terautentikasi");
  return session;
}
```

### Client Components

Client components access session via `useSession()` from `next-auth/react`:

```typescript
"use client";
import { useSession } from "next-auth/react";

function MyComponent() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  // ...
}
```

The `SessionProvider` is wrapped in `dashboard-layout.tsx`:

```typescript
export function DashboardLayout({ children }) {
  return (
    <SessionProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SessionProvider>
  );
}
```

---

## Login Flow (Client Side)

**File**: `src/app/auth/login/page.tsx`

```
1. User enters email + password in form
2. signIn("credentials", { email, password, redirect: false })
3. If result.error → show "Email atau password salah"
4. If success → router.push("/dashboard") + router.refresh()
```

---

## Sign Out Flow

Via `NavUser` component in sidebar footer:

```typescript
signOut({ callbackUrl: "/auth/login" })
```

---

## Role-Based Access Control (RBAC)

| Feature                  | SUPER_ADMIN | ADMIN_LOCATION |
|--------------------------|:-----------:|:--------------:|
| View dashboard           | ✅          | ✅ (own station) |
| Manage users             | ✅          | ❌              |
| Manage stations          | ✅          | ❌              |
| Manage devices           | ✅          | ❌              |
| View alerts              | ✅ (all)    | ✅ (own station) |
| Resolve alerts           | ✅ (all)    | ✅ (own station) |
| Create mock alerts       | ✅          | ❌              |
| View activity logs       | ✅          | (planned)       |
| Change own password      | ✅          | ✅              |
| Update own profile       | ✅          | ✅              |

### Data Scoping

- **SUPER_ADMIN**: `stationId` is `null`. Queries return all stations/devices/alerts.
- **ADMIN_LOCATION**: `stationId` is set. Queries filter by `stationId`:

```typescript
const isSuperAdmin = session.user.role === "SUPER_ADMIN";
const stationFilter = !isSuperAdmin ? { stationId: session.user.stationId } : {};
```

---

## Security Considerations

1. **No API authentication**: `/api/readings` and `/api/alerts` have no auth. IoT devices send data unauthenticated.
2. **Password policy**: Minimum 8 characters enforced in `changePassword()` Server Action. No complexity rules.
3. **Session duration**: 8-hour JWT max age. No refresh token rotation.
4. **NONAKTIF users**: Rejected at `authorize()` — can't log in even with correct password.
5. **Self-modification guard**: Super admins can't deactivate/delete themselves.
6. **Delete requires deactivation**: Users and stations must be `NONAKTIF` before deletion.
