# Architecture Exploration — 10 November

Discussion record: ESP32 hardware communication, REST vs dashboard data flow,
vice-versa provisioning, monolith vs proposal, and PostGIS.

## 1. How hardware communication works today

- **Uplink only, one-way HTTPS.** ESP32 → `POST /api/readings` (JSON, raw values).
  No downlink: the server cannot reach the device.
- **Auth:** one shared `DEVICE_API_KEY` (`X-API-Key` header) proves the caller
  is fleet hardware. **Identity** is per-device via `device_id` in the payload
  (the DB link key). One key serves unlimited devices.
- **Reliability:** at-least-once + idempotent `upsert` on `[deviceId, unixTime]`.
  Retries reuse the same payload; duplicates never double-insert.
- **Gaps:** no downlink, no offline detection (now: offline badges + cron alerts),
  no per-device keys, device clock trusted blindly, no rate limiting.

## 2. Vice-versa provisioning (implemented)

- **Before:** only hardware-defined IDs — operator typed the ESP32's ID into
  the dashboard (or the device 404'd until registered).
- **Now:** the website mints IDs too (`LPA-XXXX-XXXX`, unambiguous alphabet,
  uniqueness-checked). Form has a Generate button; empty ID auto-mints on save;
  `POST /api/devices` accepts omitted `deviceId`.
- Pre-registered devices show **"Menunggu data pertama"** until telemetry
  arrives. The last hop (ID into firmware) is still manual — true push waits
  for the MQTT retained-config downlink.
- **Downlink (built):** retained `LPA/test/nyawit/<deviceId>/config` carries
  sampling interval, thresholds, pipe geometry, sensor overrides. Published on
  create/update/(un)assign from all six mutation paths. Firmware subscribes on
  boot, applies, persists to NVS.

## 3. Why the dashboard never calls REST

- Pages are async Server Components running **in the same Node process** as
  Prisma. Direct `prisma.*` calls are zero-hop; `fetch`-ing our own API would
  be serialize → loopback HTTP → deserialize for the identical query, plus
  manual auth-cookie forwarding.
- **Server Actions** = browser→server mutations (type-safe, session-aware,
  `revalidatePath`). **REST** = machine clients (ESP32, cron, future AI
  model) that cannot import server code.
- Consequence: UI + data layer deploy/scale as one unit (the monolith
  argument). HTTP tests cover machine paths; dashboard coverage is
  `bun run build` + manual flows.

## 4. Monolith vs proposal (honest mapping)

| Proposal box | Repo status |
|---|---|
| FastAPI AI microservice | Missing — teammate scope; contract = `AIInsight` + pending `POST /api/ai-insights` |
| Mosquitto MQTT ingestion | Built — broker + `mqtt-ingest` subscriber, separate processes |
| Next.js REST backend + PWA | Half — REST exists for machines; dashboard uses RSC/Actions; PWA skipped |
| ESP32 edge autonomy | Real — store-and-forward + retained config |
| Nginx | Missing — no config/container; out of scope |
| PostGIS | Missing — floats only; see §5 |

Working label: **modular monolith with decoupled MQTT ingestion**.
Recommended thesis framing: "Implemented vs target architecture" table.

## 5. PostGIS deep-dive

- **What:** PostgreSQL extension adding `geography`/`geometry` types, GiST
  spatial indexes, ~300 functions (`ST_Distance`, `ST_DWithin`, `<->` KNN).
  Neon supports it via `CREATE EXTENSION postgis;`.
- **Candidate uses here:** nearest-station auto-assignment from first GPS fix
  (`ORDER BY location <-> point LIMIT 1`); geofence/drift alerts
  (`ST_DWithin`); correct spheroid distances; in-DB centroids
  (`ST_Centroid(ST_Collect(...))`).
- **Cost:** extension + `location` column + backfill + GiST index + query
  rewrites for new features only; existing `stationId` queries untouched.
- **Decision (pending):** drop the word (recommended if thesis is full) or
  implement minimal (extension + `nearestStation(lat, lng)` wired into the
  unclaimed-inbox) as an original-contribution chapter.

## 6. MQTT topic contract (agreed)

- Uplink: `LPA/test/nyawit` — telemetry JSON, same shape as `POST /api/readings`.
- Downlink: `LPA/test/nyawit/<deviceId>/config` — retained, QoS 1; payload in
  `src/lib/mqtt-config.ts` (`DeviceConfigPayload`).
- Firmware: publish uplink; subscribe own config topic on boot/reconnect;
  apply + persist to NVS; report `firmware_version` (OTA design pending).
