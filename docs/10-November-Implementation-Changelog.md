# Implementation Changelog — 10 November Session

Every change made in this session: added, modified, deleted.
(Pre-existing uncommitted changes in the tree — e.g. the phosphor icon swap
across UI files, `docs/CONVENTIONS.md` — are NOT ours and NOT listed, except
where we built on them.)

## ADDED (new files)

| File | Why |
|---|---|
| `bun.lock` | Migrated from `package-lock.json`; Bun is now the package manager |
| `.env.example` | Commitable template for all 9 env vars; onboarding = `cp .env.example .env` |
| `src/components/icons.tsx` | `"use client"` shim re-exporting phosphor icons so Server pages can render them without the `createContext` crash |
| `src/lib/devices.ts` | Shared device core: role guard, `createDeviceRecord` (409/404), `assignDeviceRecord`, `listDeviceRecords` (station-scoped), `generateDeviceId`, `DeviceError` with HTTP status |
| `src/lib/ingest.ts` | Shared telemetry pipeline (lookup → calibrate → idempotent upsert → per-device alert dedup) used by BOTH `POST /api/readings` and the MQTT worker |
| `src/lib/mqtt-config.ts` | Retained per-device config downlink (`<topic>/<deviceId>/config`, QoS 1); never throws |
| `src/app/api/devices/route.ts` | `GET /api/devices` (scoped list) + `POST /api/devices` create (NYT-23) |
| `src/app/api/devices/[id]/assign/route.ts` | `POST` assign/unassign (NYT-16, null = unassign) |
| `src/app/api/cron/offline-check/route.ts` | Silent-device `DEVICE_OFFLINE` alerts + auto-resolve + 30-day rejected-row prune; Bearer `CRON_SECRET` or manager session |
| `services/mqtt-ingest/index.ts` | Broker subscriber for `LPA/test/nyawit` → feeds `ingestTelemetry`; QoS 1, auto-reconnect, graceful shutdown |
| `mosquitto/mosquitto.conf` | Dev broker (`:1883`, persistence on) + commented production auth/TLS block |
| `Dockerfile.mqtt-ingest` | Self-contained worker image (shares `src/lib` with web app) |
| `src/app/dashboard/_components/auto-refresh.tsx` | 60s `router.refresh()` (skips hidden tabs; preserves modals/inputs/URL state) |
| `docs/10-November-Achitexture-Exploration.md` | ESP32 / REST / monolith / PostGIS discussion record |
| `Replicated in schema` — `RejectedReading` model + `AlertType.DEVICE_OFFLINE` | Unclaimed-sender inbox table + offline alert type (migration pending, see below) |

## MODIFIED

| File | Change |
|---|---|
| `package.json` | Bun scripts (`bunx`, `bun prisma/seed.ts`, `mqtt:ingest`); added `mqtt` dep |
| `Dockerfile` | Bun `deps/builder` stages, `node:20-alpine` runner (was 18, broke React 19), kept `node server.js` runtime |
| `docker-compose.yml` | Added `mosquitto` + `mqtt-ingest` services; `web` gets broker env + depends on broker |
| `prisma.config.ts` | Seed command `npx ts-node …` → `bun prisma/seed.ts` |
| `prisma/seed.ts` | Full rewrite: field-data archetypes (random-walk, storm rain, moisture coupling, solar battery, null dropouts), REAL calibration pipeline, 12 stations / 24 devices / 9 alerts / 12 location admins, env-overridable passwords |
| `src/app/api/readings/route.ts` | Slimmed to API-key gate + zod + `ingestTelemetry`; added session auth + station scoping to GET, BigInt→Number, pre-upsert new-reading check; old inline pipeline/alert code moved to `lib/ingest.ts` |
| `src/app/api/alerts/route.ts` | Session auth on GET + PATCH, station scoping, `userId` from session (no longer client-trusted), `Prisma.AlertWhereInput` replacing `any` |
| `src/middleware.ts` | Also accepts `__Secure-authjs.session-token` (HTTPS cookie name) |
| `src/lib/calibration.ts` | Removed `?? 0` null coercion; widened `applyCalibration` to `number \| null \| undefined → number \| null` |
| `src/app/dashboard/management/devices/page.tsx` | Unclaimed-sender inbox + `?prefill=` register link, "Menunggu data pertama" + offline-stale badges |
| `device-form-modal.tsx` | Controlled ID input + Generate button, empty-ID auto-mint, prefill support |
| `actions/device.ts` | `create/assign/unassign/getDevices` → thin wrappers over `lib/devices`; added `generateDeviceIdAction` |
| `stations/actions/assignment.ts` | Publish downlink config after assign/unassign |
| `dashboard-layout.tsx` | Mounts `<AutoRefresh />` |
| `admin-sidebar.tsx` | Simpul-style longest-prefix active match + tooltip; active style amber → emerald per direction |
| `soil-monitoring/[id]/page.tsx` | Fixed `readingWhere` type + duplicate `className` |
| `soil summary-chart.tsx` + `soil-detail-chart.tsx` | Bar + area unified to Suhu Tanah orange (`#f97316`) |
| 10 server `page.tsx` files | `@phosphor-icons/react` → `@/components/icons` (the crash fix) |
| `.env` (local, gitignored) | Added `DEVICE_API_KEY`, `CRON_SECRET`, `MQTT_BROKER_URL`, `MQTT_TOPIC`, `SEED_*` |

## DELETED

| What | Notes |
|---|---|
| `package-lock.json` | Replaced by `bun.lock` |
| Inline `checkAndCreateAlerts` + upsert block in `readings/route.ts` | Moved to `src/lib/ingest.ts` (single implementation) |
| Inline CRUD/dupe-check logic in `actions/device.ts` | Moved to `src/lib/devices.ts` (wrappers remain) |

## BEHAVIOR CHANGES (runtime-visible)

1. Unknown `device_id` is now **logged** (`rejected_readings`) instead of silently 404ing — needs migration to take effect.
2. `GET /api/readings`, `GET /api/alerts`, `PATCH /api/alerts` now require login; `ADMIN_LOCATION` scoped to own station.
3. `POST /api/readings` requires `X-API-Key` once `DEVICE_API_KEY` is set (warn-open until then).
4. Dashboard auto-refreshes server data every 60s.
5. Device edits/assigns publish retained MQTT config (no-op with warning until `MQTT_BROKER_URL` set).
6. Missing sensor values stay `null` through calibration (were coerced to `0`).
7. Soil charts (bar + area) fixed orange; sidebar active item emerald.

## STILL PENDING (operator actions, not code)

1. `bunx prisma migrate dev` where Neon is reachable (unlocks inbox, cron, offline alerts).
2. `DEVICE_API_KEY` onto ESP32 firmware (`X-API-Key` header).
3. `CRON_SECRET` + 15-min scheduler on `/api/cron/offline-check`.
4. Broker auth before exposing 1883 beyond localhost.
5. OTA decision, proposal-doc updates, `logs/` + `settings/` pages, per-device API keys.
