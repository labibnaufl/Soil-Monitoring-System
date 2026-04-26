# DATABASE.md — Schema Reference

## Database Provider

- **Provider**: Neon PostgreSQL (serverless)
- **Region**: `ap-southeast-1` (Singapore)
- **Connection**: Pooler endpoint (`-pooler.c-2.ap-southeast-1.aws.neon.tech`)
- **SSL**: Required (`sslmode=require&channel_binding=require`)
- **ORM**: Prisma 7.7.0 with `@prisma/adapter-pg` (PrismaPg driver adapter)

### Connection Pooling Setup

```typescript
// src/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});
```

The `PrismaPg` adapter handles connection pooling automatically via Neon's pooler endpoint. The singleton pattern (`globalForPrisma`) prevents connection exhaustion in development hot-reloads.

### Prisma Config

```typescript
// prisma.config.ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

---

## Entity Relationship Diagram

```
┌──────────────┐     1:N     ┌──────────────┐     1:N     ┌──────────────┐
│    Station    │◂───────────│    Device     │◂───────────│   Readings   │
│              │            │              │            │              │
│ id (PK)      │            │ id (PK)      │            │ id (PK)      │
│ name         │            │ deviceId (UQ) │            │ deviceId (FK)│
│ provinsi     │            │ deviceName    │            │ unixTime     │
│ kabupaten    │            │ stationId(FK) │            │ dateTime     │
│ kecamatan    │            │ status        │            │ raw* fields  │
│ latitude     │            │ sensorConfig  │            │ calibrated   │
│ longitude    │            │ battery*      │            │ battery      │
│ status       │            │ sampling*     │            │ signalStr    │
└──────┬───────┘            │ pipeLength    │            └──────┬───────┘
       │                    │ remainingPipe │                   │
       │                    └──────┬───────┘                   │
       │                           │                           │
       │ 1:N                       │ 1:N                       │ 0:N
       ▼                           ▼                           ▼
┌──────────────┐            ┌──────────────┐            ┌──────────────┐
│    User      │            │    Alert     │◂───────────│   (reading   │
│              │            │              │  readingId  │    ref)      │
│ id (PK)      │            │ id (PK)      │            └──────────────┘
│ email (UQ)   │            │ stationId(FK)│
│ name         │            │ deviceId(FK) │
│ password     │            │ alertType    │
│ role         │            │ priority     │
│ status       │            │ status       │
│ stationId(FK)│───────────▸│ readingId(FK)│
│ lastLoginAt  │  resolves  │ aiInsightId  │
└──────┬───────┘            │ resolvedById │
       │                    └──────┬───────┘
       │ 1:N                       │
       ▼                           │ N:1
┌──────────────┐            ┌──────────────┐
│  AdminLog    │            │  AIInsight   │
│              │            │              │
│ id (PK)      │            │ id (PK)      │
│ userId (FK)  │            │ stationId(FK)│
│ stationId(FK)│            │ analysis*    │
│ action       │            │ lifespan     │
│ entityType   │            │ healthScore  │
│ entityId     │            │ waterTrend   │
│ old/newValues│            │ riskAssess   │
└──────────────┘            │ modelVersion │
                            └──────────────┘
┌──────────────┐
│ SystemConfig │  ← Singleton (exactly 1 row)
│              │
│ id (PK)      │
│ soilMoist*   │
│ peatlandLife │
│ calibFormulas│
│ updatedById  │
└──────────────┘
```

---

## Models

### User
**Table**: `users`

| Column        | Type       | Constraints                | Notes                         |
|---------------|------------|----------------------------|-------------------------------|
| id            | String     | PK, uuid                  |                               |
| name          | String     |                            |                               |
| email         | String     | Unique                     |                               |
| password      | String     |                            | bcrypt hashed (12 rounds)     |
| companyName   | String?    | `@map("company_name")`     |                               |
| role          | UserRole   | Default: ADMIN_LOCATION    |                               |
| status        | UserStatus | Default: AKTIF             |                               |
| stationId     | String?    | FK → Station               | Null for SUPER_ADMIN          |
| lastLoginAt   | DateTime?  |                            | Updated on each login         |
| createdAt     | DateTime   | Auto                       |                               |
| updatedAt     | DateTime   | Auto                       |                               |

**Relations**: `station`, `alertsResolved`, `adminLogs`, `systemConfigUpdates`

---

### Station
**Table**: `stations`

| Column    | Type          | Constraints           | Notes                              |
|-----------|---------------|-----------------------|------------------------------------|
| id        | String        | PK, uuid              |                                    |
| name      | String        |                       |                                    |
| provinsi  | String        |                       | Province name                      |
| kabupaten | String        |                       | Regency name                       |
| kecamatan | String        |                       | District name                      |
| desa      | String?       |                       | Village name                       |
| latitude  | Float         |                       |                                    |
| longitude | Float         |                       |                                    |
| mapsLink  | String?       |                       | Auto-generated Google Maps URL     |
| imageUrl  | String?       |                       | Station photo URL                  |
| status    | StationStatus | Default: AKTIF        |                                    |
| createdAt | DateTime      | Auto                  |                                    |
| updatedAt | DateTime      | Auto                  |                                    |

**Relations**: `devices`, `alerts`, `aiInsights`, `admins` (User[]), `adminLogs`

---

### Device
**Table**: `devices`

| Column           | Type         | Constraints                 | Notes                           |
|------------------|--------------|-----------------------------|---------------------------------|
| id               | String       | PK, uuid                   |                                 |
| deviceId         | String       | Unique                      | Hardware ID: `LPA-ESP3201-P001` |
| deviceName       | String       |                             | Human-readable display name     |
| stationId        | String?      | FK → Station                | Null = not assigned             |
| status           | DeviceStatus | Default: BEROPERASI         |                                 |
| sensorConfig     | Json?        |                             | Per-device calibration overrides|
| batteryWarning   | Float        | Default: 20                 | % threshold for warning         |
| batteryCritical  | Float        | Default: 10                 | % threshold for critical        |
| samplingInterval | Int          | Default: 300                | Seconds between readings        |
| pipeLength       | Float?       |                             | Total pipe length (cm)          |
| remainingPipe    | Float?       |                             | Pipe above surface (cm)         |
| description      | String?      |                             |                                 |
| createdAt        | DateTime     | Auto                        |                                 |
| updatedAt        | DateTime     | Auto                        |                                 |

**Relations**: `station`, `readings`, `alerts`

---

### Readings
**Table**: `readings`

| Column              | Type     | Constraints                        | Notes                      |
|---------------------|----------|------------------------------------|----------------------------|
| id                  | String   | PK, uuid                          |                            |
| deviceId            | String   | FK → Device                        |                            |
| unixTime            | BigInt   |                                    | Epoch seconds from device  |
| dateTime            | DateTime |                                    | Computed from unixTime     |
| rawWaterLevel       | Float?   |                                    | Raw sensor value (cm)      |
| rawRainMeter        | Float?   |                                    | Raw sensor value (mm)      |
| rawSoilMoisture     | Float?   |                                    | Raw sensor value (%)       |
| rawSoilTemperature  | Float?   |                                    | Raw sensor value (°C)      |
| rawSoilConductivity | Float?   |                                    | Raw sensor value (µS/cm)   |
| rawPhValue          | Float?   |                                    | Raw sensor value (unitless)|
| waterLevel          | Float?   |                                    | Calibrated (cm)            |
| rainMeter           | Float?   |                                    | Calibrated (mm)            |
| soilMoisture        | Float?   |                                    | Calibrated (%)             |
| soilTemperature     | Float?   |                                    | Calibrated (°C)            |
| soilConductivity    | Float?   |                                    | Calibrated (µS/cm)         |
| phValue             | Float?   |                                    | Calibrated (unitless)      |
| calibrationVersion  | Int      | Default: 1                         | Tracks formula version     |
| battery             | Float?   |                                    | Device battery (0-100%)    |
| signalStrength      | Float?   |                                    | Signal (dBm)               |
| panelTemperature    | Float?   |                                    | Solar panel temp (°C)      |
| createdAt           | DateTime | Auto                               |                            |

**Indexes**:
- `@@index([deviceId, dateTime])` — Time-series queries
- `@@unique([deviceId, unixTime])` — Deduplication (device retries)

**Relations**: `device`, `alerts`

---

### Alert
**Table**: `alerts`

| Column         | Type          | Constraints            | Notes                           |
|----------------|---------------|------------------------|---------------------------------|
| id             | String        | PK, uuid               |                                 |
| stationId      | String        | FK → Station            |                                 |
| deviceId       | String?       | FK → Device             | Null for non-device alerts      |
| alertType      | AlertType     |                        |                                 |
| priority       | AlertPriority | Default: MEDIUM         |                                 |
| status         | AlertStatus   | Default: OPEN           |                                 |
| readingId      | String?       | FK → Readings           | Source reading (if applicable)  |
| aiInsightId    | String?       | FK → AIInsight          | Source insight (if applicable)  |
| sourceType     | SourceType    |                        | READING or AI_INSIGHT           |
| message        | String?       |                        | Pre-built notification text     |
| thresholdValue | Float?        |                        | The threshold that was breached |
| actualValue    | Float?        |                        | The actual sensor value         |
| resolvedById   | String?       | FK → User               |                                 |
| resolvedAt     | DateTime?     |                        |                                 |
| resolutionNote | String?       |                        |                                 |
| createdAt      | DateTime      | Auto                   |                                 |
| updatedAt      | DateTime      | Auto                   |                                 |

**Indexes**:
- `@@index([stationId, status])` — Station alert dashboard
- `@@index([deviceId])` — Device-specific alerts
- `@@index([alertType, status])` — Type-based filtering
- `@@index([createdAt])` — Chronological listing

**Relations**: `station`, `device`, `reading`, `aiInsight`, `resolvedBy`

---

### AIInsight
**Table**: `ai_insights`

| Column                | Type             | Constraints        | Notes                        |
|-----------------------|------------------|--------------------|------------------------------|
| id                    | String           | PK, uuid           |                              |
| stationId             | String           | FK → Station        |                              |
| analysisStart         | DateTime         |                    | Analysis window start        |
| analysisEnd           | DateTime         |                    | Analysis window end          |
| peatlandLifespanYears | Float?           |                    | Predicted years              |
| soilHealthScore       | Float?           |                    | 0-100 health score           |
| waterTableTrend       | WaterTableTrend? |                    | RISING / STABLE / DECLINING  |
| riskAssessment        | Json?            |                    | Structured risk JSON         |
| recommendations       | Json?            |                    | Array of recommendations     |
| modelVersion          | String?          |                    | ML model version tag         |
| confidenceScore       | Float?           |                    | 0.0 - 1.0                   |
| rawOutput             | Json?            |                    | Full unstructured ML output  |
| createdAt             | DateTime         | Auto               |                              |

**Indexes**: `@@index([stationId, analysisStart])`

**Relations**: `station`, `alerts`

---

### AdminLog
**Table**: `admin_logs`

| Column     | Type     | Constraints           | Notes                              |
|------------|----------|-----------------------|------------------------------------|
| id         | String   | PK, uuid              |                                    |
| userId     | String?  | FK → User (nullable)  | Null preserves logs after deletion |
| stationId  | String?  | FK → Station (nullable)|                                   |
| action     | String   |                       | e.g., `USER_CREATED`, `ALERT_RESOLVED` |
| entityType | String   |                       | e.g., `USER`, `DEVICE`, `ALERT`   |
| entityId   | String?  |                       | UUID of affected entity            |
| oldValues  | Json?    |                       | Previous state snapshot            |
| newValues  | Json?    |                       | New state snapshot                 |
| ipAddress  | String?  |                       | Client IP (not yet populated)      |
| userAgent  | String?  |                       | Browser UA (not yet populated)     |
| createdAt  | DateTime | Auto                  |                                    |

**Indexes**:
- `@@index([userId, createdAt])` — User activity history
- `@@index([stationId, createdAt])` — Station audit trail
- `@@index([action])` — Action-type filtering

**Relations**: `user`, `station`

---

### SystemConfig
**Table**: `system_config`

| Column              | Type     | Constraints   | Notes                                 |
|---------------------|----------|---------------|---------------------------------------|
| id                  | String   | PK, uuid      | Singleton: always `"global"`          |
| soilMoistureMin     | Float    | Default: 20   | Alert threshold (% lower bound)       |
| soilMoistureMax     | Float    | Default: 80   | Alert threshold (% upper bound)       |
| peatlandLifespanMin | Float    | Default: 10   | Minimum acceptable lifespan (years)   |
| calibrationFormulas | Json     |               | Universal calibration config          |
| updatedById         | String?  | FK → User      |                                       |
| updatedAt           | DateTime | Auto           |                                       |

**Relations**: `updatedBy`

> **Important**: This table has exactly ONE row, created by the seed script. Never insert additional rows.

---

## Enum Types

### UserRole
```
SUPER_ADMIN      — Full system access, no station binding
ADMIN_LOCATION   — Single station access, bound via stationId FK
```

### UserStatus
```
AKTIF      — Active account, can log in
NONAKTIF   — Deactivated, login rejected by auth.ts authorize()
```

### StationStatus
```
AKTIF      — Station is operational
NONAKTIF   — Station is offline/decommissioned
```

### DeviceStatus
```
BEROPERASI   — Device is operational and sending data
MAINTENANCE  — Device is under maintenance
MATI         — Device is offline/dead
```

### AlertType
```
SOIL_MOISTURE       — Soil moisture out of threshold range
LOW_BATTERY         — Device battery below warning/critical level
PEATLAND_LIFESPAN   — Predicted peatland lifespan below minimum
```

### AlertPriority
```
LOW     — Informational
MEDIUM  — Needs attention
HIGH    — Immediate action required
```

### AlertStatus
```
OPEN          — New, unacknowledged
PENDING       — Acknowledged, awaiting action
IN_PROGRESS   — Being worked on
RESOLVED      — Resolved with note
```

### SourceType
```
READING      — Alert triggered by sensor reading
AI_INSIGHT   — Alert triggered by AI analysis
```

### WaterTableTrend
```
RISING      — Water table is rising
STABLE      — Water table is stable
DECLINING   — Water table is declining
```

---

## Indexing Decisions

| Index                              | Table      | Purpose                                    |
|------------------------------------|------------|--------------------------------------------|
| `[deviceId, dateTime]`             | readings   | Fast time-series queries per device         |
| `[deviceId, unixTime]` (UNIQUE)    | readings   | Deduplication for device retries            |
| `[stationId, status]`             | alerts     | Dashboard: open alerts per station          |
| `[deviceId]`                       | alerts     | Device-specific alert lookup                |
| `[alertType, status]`             | alerts     | Filter by type + status combination         |
| `[createdAt]`                      | alerts     | Chronological alert listing                 |
| `[stationId, analysisStart]`      | ai_insights| Time-windowed analysis per station          |
| `[userId, createdAt]`             | admin_logs | User activity history                       |
| `[stationId, createdAt]`          | admin_logs | Station audit trail                         |
| `[action]`                         | admin_logs | Filter by action type                       |

---

## Seed Data

The `prisma/seed.ts` creates:

1. **SystemConfig** (id: `"global"`) with default thresholds and calibration formulas
2. **Station** — "Stasiun Pemantauan Lahan Gambut Sebangau" in Kalimantan Tengah
3. **Super Admin** — `superadmin@lpa.id` / `SuperAdmin@LPA123`
4. **Admin Lokasi** — `admin.sebangau@lpa.id` / `AdminLokasi@LPA123` (bound to station)

Run seed: `npm run db:seed`
