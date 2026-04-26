# ARCHITECTURE.md — Master Overview

## Project Purpose

**NYAWIT** (Admin Panel Monitoring Sistem Gambut) is a peatland/soil water table monitoring system. It ingests real-time IoT sensor data (water level, soil moisture, temperature, conductivity, pH, rainfall), provides calibration pipelines, threshold-based alerting, and an admin dashboard for managing stations, devices, and users.

Target users: SUPER_ADMIN (manages everything) and ADMIN_LOCATION (manages one assigned station).

---

## Tech Stack & Rationale

| Layer            | Technology            | Why                                                                 |
|------------------|-----------------------|---------------------------------------------------------------------|
| Framework        | Next.js 16.2.4        | App Router, Server Components, Server Actions, middleware           |
| UI               | React 19.2.4          | Latest concurrent features, RSC-native                              |
| Styling          | Tailwind CSS v4       | Utility-first, `@theme` system, PostCSS pipeline                   |
| Component Lib    | Shadcn UI (radix-nova)| Accessible Radix primitives, copy-paste ownership                   |
| Icons            | Lucide React          | Tree-shakeable, consistent icon set                                 |
| ORM              | Prisma 7.7.0          | Type-safe queries, migration system, driver adapters                |
| DB Adapter       | @prisma/adapter-pg    | Neon-compatible, connection pooling via `PrismaPg`                  |
| Database         | Neon PostgreSQL       | Serverless Postgres, auto-scaling, branching                        |
| Auth             | Auth.js v5 (beta.25)  | JWT sessions, Credentials provider, Edge-compatible                 |
| Validation       | Zod 3.25              | Runtime schema validation for API inputs                            |
| Password Hashing | bcryptjs 3.0          | Pure JS bcrypt, works without native bindings                       |
| Toast            | Sonner                | Lightweight, accessible toast notifications                        |
| Containerization | Docker + Compose      | Standalone build, production-ready                                  |
| Language         | TypeScript 5          | End-to-end type safety                                              |

---

## High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET                                     │
│                                                                      │
│  ┌──────────────┐         ┌──────────────────────────────────────┐   │
│  │  IoT Devices │────────▸│  POST /api/readings                  │   │
│  │  (ESP32, etc) │         │  (Zod validation + Calibration)     │   │
│  └──────────────┘         └───────────────┬──────────────────────┘   │
│                                           │                          │
│  ┌──────────────┐         ┌───────────────▼──────────────────────┐   │
│  │   Browser    │────────▸│        Next.js 16 App Router         │   │
│  │  (Admin UI)  │◂────────│                                      │   │
│  └──────────────┘         │  ┌─────────────────────────────────┐ │   │
│                           │  │     Middleware (auth guard)      │ │   │
│                           │  └─────────────┬───────────────────┘ │   │
│                           │                │                     │   │
│                           │  ┌─────────────▼───────────────────┐ │   │
│                           │  │  Server Components / Actions     │ │   │
│                           │  │  (RSC data fetch, mutations)     │ │   │
│                           │  └─────────────┬───────────────────┘ │   │
│                           │                │                     │   │
│                           │  ┌─────────────▼───────────────────┐ │   │
│                           │  │  API Routes (/api/*)             │ │   │
│                           │  │  (REST for IoT, alerts)          │ │   │
│                           │  └─────────────┬───────────────────┘ │   │
│                           │                │                     │   │
│                           │  ┌─────────────▼───────────────────┐ │   │
│                           │  │  Prisma 7 (PrismaPg adapter)    │ │   │
│                           │  │  (Type-safe ORM layer)           │ │   │
│                           │  └─────────────┬───────────────────┘ │   │
│                           └────────────────┼─────────────────────┘   │
│                                            │                         │
│                           ┌────────────────▼─────────────────────┐   │
│                           │  Neon PostgreSQL (Serverless)         │   │
│                           │  (ap-southeast-1, pooler endpoint)   │   │
│                           └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layer Connections

### 1. IoT → API Route → Prisma → Neon
```
ESP32 device
  └─▸ POST /api/readings (JSON payload)
       ├─ Zod validates input schema
       ├─ Prisma looks up Device by deviceId
       ├─ SystemConfig loads calibration formulas
       ├─ calibrateAllReadings() applies formulas
       ├─ Prisma upserts Readings (dedup by deviceId+unixTime)
       ├─ checkAndCreateAlerts() evaluates thresholds
       └─ Returns calibrated values to device
```

### 2. Browser → Server Component → Prisma → Neon
```
Browser request
  └─▸ Next.js middleware checks session cookie
       └─▸ Server Component (e.g., dashboard/page.tsx)
            ├─ auth() validates JWT session
            ├─ Prisma queries (scoped by user role/station)
            └─ Renders RSC HTML streamed to client
```

### 3. Browser → Server Action → Prisma → Neon
```
Client component form submit
  └─▸ Server Action (e.g., createUser)
       ├─ requireSuperAdmin() validates session + role
       ├─ Prisma mutation (create/update/delete)
       ├─ AdminLog audit entry created
       ├─ revalidatePath() triggers cache invalidation
       └─ Returns result to client
```

---

## Data Flow Patterns

| Pattern               | Used For                              | Implementation                     |
|-----------------------|---------------------------------------|-------------------------------------|
| Server Components     | All dashboard pages (read)            | `async function Page()` + `prisma.x.findMany()` |
| Server Actions        | All CRUD mutations                    | `"use server"` + `revalidatePath()` |
| REST API Routes       | IoT ingestion, external integrations  | `route.ts` with `GET`/`POST`/`PATCH` |
| JWT Sessions          | Authentication state                  | Auth.js v5 `auth()` + middleware    |

---

## Key Design Decisions

1. **Raw + Calibrated dual storage**: Readings store both raw sensor values and calibrated values. This allows recalibration without re-ingesting data.

2. **Server Actions over API routes for UI**: Management CRUD uses Server Actions (colocated with page). REST API routes exist only for IoT device communication and external integrations.

3. **Role-based data scoping**: ADMIN_LOCATION sees only their assigned station's data. SUPER_ADMIN sees everything. Scoping is applied at the query level, not middleware.

4. **Audit trail by default**: Every mutation creates an `AdminLog` entry with old/new values, user ID, and timestamps.

5. **Standalone output**: `next.config.ts` uses `output: "standalone"` for Docker-optimized production builds.
