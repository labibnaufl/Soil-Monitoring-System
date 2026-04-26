# API_ROUTES.md — API Reference

> **For AI models**: Do NOT hallucinate routes. If a route is not listed here, it does not exist. Check `src/app/api/` directory structure before inventing new endpoints.

---

## Overview

| Route                        | Method | Auth Required | Purpose                        | Status  |
|------------------------------|--------|---------------|--------------------------------|---------|
| `/api/auth/[...nextauth]`    | GET/POST | No         | Auth.js handler (login/logout) | ✅ Done |
| `/api/readings`              | POST   | No (IoT)      | Ingest sensor data             | ✅ Done |
| `/api/readings`              | GET    | No            | Query sensor readings          | ✅ Done |
| `/api/alerts`                | GET    | No            | List alerts with filters       | ✅ Done |
| `/api/alerts`                | PATCH  | No            | Resolve an alert               | ✅ Done |
| `/api/devices`               | —      | —             | —                              | ❌ Empty |
| `/api/stations`              | —      | —             | —                              | ❌ Empty |
| `/api/ai-insights`           | —      | —             | —                              | ❌ Empty |
| `/api/logs`                  | —      | —             | —                              | ❌ Empty |
| `/api/system-config`         | —      | —             | —                              | ❌ Empty |

> **Note**: Most dashboard CRUD is handled via Server Actions, NOT API routes. See the Server Actions section below.

---

## `/api/auth/[...nextauth]`

**File**: `src/app/api/auth/[...nextauth]/route.ts`

Delegates to Auth.js v5 handler. Handles sign-in, sign-out, session management, and CSRF tokens.

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

---

## `/api/readings`

**File**: `src/app/api/readings/route.ts`

### POST — Ingest Sensor Data

Receives raw sensor data from IoT devices, applies calibration, stores both raw and calibrated values, and triggers alerts.

**Request**:
```json
{
  "device_id": "LPA-ESP3201-P001",     // string, required (matches Device.deviceId)
  "unix_time": 1713900000,              // number, required (epoch seconds)
  "water_level": 450.0,                 // number, optional (raw cm)
  "rain_meter": 12.5,                   // number, optional (raw mm)
  "soil_moisture": 65.0,               // number, optional (raw %)
  "soil_temperature": 28.3,            // number, optional (raw °C)
  "soil_conductivity": 320.0,          // number, optional (raw µS/cm)
  "ph_value": 6.8,                     // number, optional (raw, unitless)
  "battery": 85.0,                     // number, optional (%)
  "signal_strength": -72.0,            // number, optional (dBm)
  "panel_temperature": 42.0            // number, optional (°C)
}
```

**Response (201)**:
```json
{
  "success": true,
  "reading": {
    "id": "uuid",
    "deviceId": "uuid",
    "dateTime": "2026-04-24T00:00:00.000Z",
    "calibrationVersion": 1,
    "waterLevel": 50.0,           // calibrated
    "rainMeter": 2.5,             // calibrated
    "soilMoisture": 65.0,         // calibrated
    "soilTemperature": 28.3,      // calibrated
    "soilConductivity": 128000.0, // calibrated
    "phValue": 6.8,               // calibrated
    "battery": 85.0
  }
}
```

**Error Responses**:
| Status | Body                                       | When                           |
|--------|--------------------------------------------|--------------------------------|
| 400    | `{ error, details }`                       | Zod validation fails           |
| 404    | `{ error: "Device not found" }`            | device_id doesn't match any    |
| 400    | `{ error: "Device not assigned..." }`      | Device has no stationId        |
| 500    | `{ error: "Internal server error" }`       | Unexpected error               |

**Prisma Calls**:
1. `prisma.device.findUnique({ where: { deviceId } })` — Lookup device
2. `prisma.systemConfig.findFirst()` — Load calibration formulas
3. `prisma.readings.upsert({ where: { deviceId_unixTime } })` — Store (dedup)
4. `prisma.alert.findFirst()` + `prisma.alert.create()` — Check/create alerts

**Side Effects**:
- Creates `Alert` if soil moisture outside `[soilMoistureMin, soilMoistureMax]`
- Creates `Alert` if battery below device's `batteryWarning` or `batteryCritical`

---

### GET — Query Readings

**Query Parameters**:
| Param      | Type   | Default | Description                          |
|------------|--------|---------|--------------------------------------|
| stationId  | string | —       | Filter by station (via device.stationId) |
| deviceId   | string | —       | Filter by device ID (internal UUID)  |
| startDate  | ISO date | —     | Filter: dateTime >= startDate        |
| endDate    | ISO date | —     | Filter: dateTime <= endDate          |
| limit      | number | 100     | Max results returned                 |
| includeRaw | "true" | false   | Include raw_* fields in response     |

**Response (200)**: Array of reading objects:
```json
[
  {
    "id": "uuid",
    "deviceId": "uuid",
    "unixTime": "1713900000",       // ⚠️ BigInt as string
    "dateTime": "2026-04-24T00:00:00.000Z",
    "calibrationVersion": 1,
    "waterLevel": 50.0,
    "rainMeter": 2.5,
    "soilMoisture": 65.0,
    "soilTemperature": 28.3,
    "soilConductivity": 128000.0,
    "phValue": 6.8,
    "battery": 85.0,
    "signalStrength": -72.0,
    "panelTemperature": 42.0,
    "rawWaterLevel": 450.0,          // only if includeRaw=true
    "createdAt": "2026-04-24T00:00:00.000Z",
    "device": {
      "deviceId": "LPA-ESP3201-P001",
      "deviceName": "Sensor Utama",
      "station": { "id": "uuid", "name": "Stasiun Sebangau" }
    }
  }
]
```

**Prisma Call**: `prisma.readings.findMany({ where, orderBy: { dateTime: "desc" }, take: limit, select: { ... } })`

---

## `/api/alerts`

**File**: `src/app/api/alerts/route.ts`

### GET — List Alerts

**Query Parameters**:
| Param     | Type   | Default | Description              |
|-----------|--------|---------|--------------------------|
| stationId | string | —       | Filter by station        |
| status    | string | —       | `OPEN`, `PENDING`, `IN_PROGRESS`, `RESOLVED` |
| alertType | string | —       | `SOIL_MOISTURE`, `LOW_BATTERY`, `PEATLAND_LIFESPAN` |
| priority  | string | —       | `LOW`, `MEDIUM`, `HIGH`  |
| limit     | number | 50      | Max results              |

**Response (200)**: Array of alert objects with station and resolvedBy includes.

**Prisma Call**: `prisma.alert.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, include: { station, resolvedBy } })`

---

### PATCH — Resolve Alert

**Request**:
```json
{
  "alertId": "uuid",
  "resolutionNote": "Sensor recalibrated and soil irrigated",
  "userId": "uuid"
}
```

**Response (200)**: Updated alert object.

**Error Responses**:
| Status | When                                       |
|--------|--------------------------------------------|
| 400    | Missing alertId, resolutionNote, or userId |
| 500    | Unexpected error                           |

**Prisma Calls**:
1. `prisma.alert.update()` — Set status=RESOLVED, resolvedAt, resolutionNote
2. `prisma.adminLog.create()` — Audit trail

---

## Server Actions (Not API Routes)

Dashboard CRUD operations use Next.js Server Actions instead of REST routes. These are colocated with their pages.

### User Actions (`management/users/actions/user.ts`)

| Function           | Auth Required    | Description                             |
|--------------------|------------------|-----------------------------------------|
| `createUser()`     | SUPER_ADMIN      | Create ADMIN_LOCATION user              |
| `getUsers()`       | SUPER_ADMIN      | List users with optional filters        |
| `getUserById()`    | SUPER_ADMIN      | Get user by ID with station             |
| `updateUser()`     | SUPER_ADMIN      | Update user (name, role, station, etc.) |
| `activateUser()`   | SUPER_ADMIN      | Set status=AKTIF                        |
| `deactivateUser()` | SUPER_ADMIN      | Set status=NONAKTIF                     |
| `deleteUser()`     | SUPER_ADMIN      | Delete (only if NONAKTIF)               |
| `changePassword()` | Any auth'd user  | Self-service password change            |
| `updateProfile()`  | Any auth'd user  | Self-service name/company update        |

### Station Actions (`management/stations/actions/station.ts`)

| Function               | Auth Required | Description                    |
|------------------------|---------------|--------------------------------|
| `createStation()`      | SUPER_ADMIN   | Create new monitoring station  |
| `updateStation()`      | SUPER_ADMIN   | Update station details         |
| `activateStation()`    | SUPER_ADMIN   | Set status=AKTIF               |
| `deactivateStation()`  | SUPER_ADMIN   | Set status=NONAKTIF            |
| `deleteStation()`      | SUPER_ADMIN   | Delete (only if NONAKTIF + no dependents) |

### Assignment Actions (`management/stations/actions/assignment.ts`)

| Function                      | Auth Required | Description                    |
|-------------------------------|---------------|--------------------------------|
| `assignDeviceToStation()`     | SUPER_ADMIN   | Link device to station         |
| `unassignDeviceFromStation()` | SUPER_ADMIN   | Unlink device from station     |
| `getAvailableDevices()`       | SUPER_ADMIN   | Devices with no station        |
| `getDevicesAtStation()`       | SUPER_ADMIN   | Devices at a specific station  |
| `assignAdminToStation()`      | SUPER_ADMIN   | Link admin to station          |
| `unassignAdminFromStation()`  | SUPER_ADMIN   | Unlink admin from station      |
| `getAvailableAdmins()`        | SUPER_ADMIN   | ADMIN_LOCATION with no station |
| `getAdminsAtStation()`        | SUPER_ADMIN   | Admins at a specific station   |

### Device Actions (`management/devices/_components/actions/device.ts`)

| Function                  | Auth Required | Description                     |
|---------------------------|---------------|---------------------------------|
| `createDevice()`          | SUPER_ADMIN   | Register new IoT device         |
| `updateDevice()`          | SUPER_ADMIN   | Update device config            |
| `updateDeviceStatus()`    | SUPER_ADMIN   | Change status (BEROPERASI/MAINTENANCE/MATI) |
| `assignDeviceToStation()` | SUPER_ADMIN   | Link device to station          |
| `unassignDevice()`        | SUPER_ADMIN   | Unlink device                   |
| `deleteDevice()`          | SUPER_ADMIN   | Delete (only if no readings)    |
| `getDeviceById()`         | SUPER_ADMIN   | Get device with counts          |
| `getDevices()`            | SUPER_ADMIN   | List all devices                |

### Alert Actions (`alerts/_components/actions/alert.ts`)

| Function              | Auth Required        | Description                     |
|-----------------------|----------------------|---------------------------------|
| `getAlerts()`         | Any auth'd user      | List alerts (scoped by station) |
| `getAlertById()`      | Any auth'd user      | Get alert detail                |
| `updateAlertStatus()` | Any auth'd user      | Change alert status             |
| `resolveAlert()`      | Any auth'd user      | Resolve with note               |
| `getAlertCounts()`    | Any auth'd user      | Counts for sidebar badge        |
| `createMockAlert()`   | SUPER_ADMIN only     | Create test alert               |

---

## Authentication Notes

- **API Routes** (`/api/readings`, `/api/alerts`): Currently **NOT authenticated**. IoT devices push data without tokens. This is a known security gap.
- **Server Actions**: Always call `auth()` to verify session. Role checks are enforced per-action.
- **Auth.js endpoints** (`/api/auth/*`): Handled automatically by Auth.js. No custom logic needed.
