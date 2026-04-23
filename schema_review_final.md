# 📋 Prisma Schema Review — Final

**Date**: 2026-04-22  
**Schema**: [schema.prisma](file:///d:/School/Project/Soil_Monitoring_System/prisma/schema.prisma)  
**Models**: Station, Device, Readings, Alert, User, AIInsight, AdminLog, SystemConfig

---

## Status: ✅ No Critical Bugs

All previous critical issues have been resolved:
- ✅ Alert polymorphic FK → two nullable FKs (`readingId`, `aiInsightId`)
- ✅ AdminLog `onDelete: Cascade` → `onDelete: SetNull` with nullable `userId`
- ✅ BatteryUnit enum removed — battery always stored as `%` (0-100)
- ✅ UserStationAccess junction table → direct FK on User (1 admin = 1 station)

---

## 🔴 Should Fix — Data Integrity

### 1. Readings deduplication constraint missing
**Location**: [schema.prisma:L163-165](file:///d:/School/Project/Soil_Monitoring_System/prisma/schema.prisma#L163-L165)

**Problem**: Solar-powered remote devices on flaky connections **will** retry transmissions. Without a unique constraint, each retry creates a duplicate row in the database.

**Fix**:
```prisma
// Add to Readings model, after @@index lines:
@@unique([deviceId, unixTime])
```

Your ingest API should then use upsert logic:
```sql
ON CONFLICT (device_id, unix_time) DO NOTHING
```

---

## 🟡 Recommended Improvements

### 2. Alert missing `deviceId`
**Location**: [schema.prisma:L172-206](file:///d:/School/Project/Soil_Monitoring_System/prisma/schema.prisma#L172-L206)

**Problem**: When a station has multiple devices and one triggers a `LOW_BATTERY` alert, the alert only stores `stationId`. To find which device caused it, you'd need to join through `readingId → device`. A direct FK is simpler and faster.

**Fix — Alert model**:
```prisma
deviceId  String?  @map("device_id")
device    Device?  @relation(fields: [deviceId], references: [id])
```

**Fix — Device model** (add reverse relation):
```prisma
alerts  Alert[]
```

---

### 3. Alert missing `message` field
**Location**: [schema.prisma:L172-206](file:///d:/School/Project/Soil_Monitoring_System/prisma/schema.prisma#L172-L206)

**Problem**: No human-readable description stored. The frontend must reconstruct the message from `alertType` + `actualValue` + `thresholdValue` every time. Also blocks notification logic — email/Telegram need a prebuilt string.

**Fix**:
```prisma
message  String  // e.g. "Kelembapan tanah turun ke 15%, di bawah ambang batas 20%"
```

---

### 4. Battery thresholds: Device vs SystemConfig inconsistency
**Location**: [schema.prisma:L94-95](file:///d:/School/Project/Soil_Monitoring_System/prisma/schema.prisma#L94-L95) vs [schema.prisma:L309-310](file:///d:/School/Project/Soil_Monitoring_System/prisma/schema.prisma#L309-L310)

**Problem**: Soil moisture thresholds are on `SystemConfig` (universal), but battery thresholds (`batteryWarning`, `batteryCritical`) are on `Device` (per-device). This contradicts the rule "alert system is universal, all locations share the same threshold values."

**Options**:

| Option | Action |
|---|---|
| **A: All universal** | Move `batteryWarning`/`batteryCritical` to `SystemConfig`. Remove from Device. |
| **B: Battery is per-device (intentional)** | Keep on Device. Document reasoning: different hardware = different voltage curves. |

---

### 5. `telegramChatId` missing from Station
**Location**: [schema.prisma:L55-77](file:///d:/School/Project/Soil_Monitoring_System/prisma/schema.prisma#L55-L77)

**Problem**: You decided Telegram notifications are **per-station** (each station has its own Telegram group). The `telegramChatId` field was on Station in v1 but got removed. Without it, there's no way to route Telegram alerts.

**Fix**:
```prisma
telegramChatId  String?  @map("telegram_chat_id")
```

---

### 6. AIInsight missing `modelVersion` and `confidenceScore`
**Location**: [schema.prisma:L236-262](file:///d:/School/Project/Soil_Monitoring_System/prisma/schema.prisma#L236-L262)

**Problem**: When you retrain the ML model, you need to trace which version produced which insight. A confidence score helps the dashboard display trust levels.

**Fix**:
```prisma
modelVersion     String?  @map("model_version")   // e.g. "v1.2.0"
confidenceScore  Float?   @map("confidence_score") // 0.0 - 1.0
```

---

## 🟢 Nice-to-Have / Minor

### 7. Dual timestamps on Readings
**Location**: [schema.prisma:L130-131](file:///d:/School/Project/Soil_Monitoring_System/prisma/schema.prisma#L130-L131)

`unixTime` (BigInt) and `dateTime` (DateTime) store the same moment. Recommendation: keep `dateTime` as canonical (better for SQL queries), compute unix in the frontend. If you keep both, remove the separate `@@index([unixTime])` — it's only useful if you query by unix time directly.

### 8. `mapsLink` on Station could be computed
**Location**: [schema.prisma:L64](file:///d:/School/Project/Soil_Monitoring_System/prisma/schema.prisma#L64)

Always derivable: `https://maps.google.com/?q=${lat},${lng}`. Storing it risks stale links when coordinates are updated. Consider computing it in the API layer instead.

### 9. User missing `lastLoginAt`
**Location**: [schema.prisma:L16-39](file:///d:/School/Project/Soil_Monitoring_System/prisma/schema.prisma#L16-L39)

Useful for security auditing — identifying dormant accounts or compromised sessions.
```prisma
lastLoginAt  DateTime?  @map("last_login_at")
```

### 10. Station missing `status`
**Location**: [schema.prisma:L55-77](file:///d:/School/Project/Soil_Monitoring_System/prisma/schema.prisma#L55-L77)

No way to soft-delete or deactivate a station. If a plantation area is decommissioned, you can't mark it inactive without deleting the record.
```prisma
status  StationStatus  @default(AKTIF)

// And add enum:
enum StationStatus {
  AKTIF
  NONAKTIF
}
```

### 11. Remove dead comment on L128
```prisma
// REMOVED: stationId - redundant, access via device → station
```
This is a changelog comment — useful during development but confusing in production code. Remove before shipping.

### 12. SystemConfig is a single-row table
**Location**: [schema.prisma:L305-326](file:///d:/School/Project/Soil_Monitoring_System/prisma/schema.prisma#L305-L326)

Document that this table always has exactly 1 row. Your database seed script must create it. Consider adding a comment:
```prisma
// IMPORTANT: This table has exactly ONE row. 
// Created by seed script, never inserted manually.
```

---

## Summary

| Priority | Count | Items |
|---|---|---|
| 🔴 Should fix | 1 | Readings `@@unique` deduplication |
| 🟡 Recommended | 5 | Alert `deviceId`, Alert `message`, battery threshold location, `telegramChatId`, AI `modelVersion` |
| 🟢 Nice-to-have | 6 | Dual timestamps, computed mapsLink, `lastLoginAt`, Station `status`, dead comment, SystemConfig docs |
