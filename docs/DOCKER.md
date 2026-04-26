# DOCKER.md — Container Configuration

## Services

### docker-compose.yml

```yaml
version: '3.8'
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    env_file:
      - .env
    restart: unless-stopped
```

Only one service: `web` (the Next.js application). The database is external (Neon cloud — no local Postgres container).

---

## Dockerfile — Multi-Stage Build

```
Stage 1: deps      — Install node_modules + copy Prisma schema
Stage 2: builder   — Generate Prisma client + build Next.js (standalone)
Stage 3: runner    — Production image with standalone output only
```

### Build Stages

| Stage   | Base Image       | Purpose                                      |
|---------|------------------|----------------------------------------------|
| `deps`  | node:18-alpine   | `npm ci` + copy prisma schema                |
| `builder`| node:18-alpine  | `prisma generate` + `npm run build`           |
| `runner`| node:18-alpine   | Copy standalone output, run `node server.js`  |

### Key Details

- **Alpine base**: Smallest possible image. `libc6-compat` added for native bindings.
- **Standalone output**: Only copies `.next/standalone/` and `.next/static/` (not full `node_modules`)
- **Non-root user**: Runs as `nextjs:nodejs` (uid:gid = 1001:1001)
- **Exposed port**: 3000
- **Entrypoint**: `CMD ["node", "server.js"]`

---

## Environment Variables

| Variable       | Required | Used By          | Description                                    |
|----------------|----------|------------------|------------------------------------------------|
| `DATABASE_URL` | Yes      | Prisma, seed     | Neon PostgreSQL connection string with pooler   |
| `AUTH_SECRET`   | Yes      | Auth.js v5       | JWT signing secret (generate with `openssl rand -base64 32`) |
| `AUTH_URL`      | Yes      | Auth.js v5       | Application base URL (e.g., `http://localhost:3000`) |
| `NODE_ENV`      | Auto     | Next.js, Prisma  | Set to `production` in Dockerfile runner stage  |

### Variable Format

```env
# .env (local development)
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require&channel_binding=require"
AUTH_SECRET="base64-encoded-random-string"
AUTH_URL="http://localhost:3000"
```

> **Security**: Never commit `.env` to git. The `.gitignore` already excludes it.

---

## Port Mappings

| Service | Container Port | Host Port | Protocol |
|---------|---------------|-----------|----------|
| web     | 3000          | 3000      | HTTP     |

---

## Local Development vs Production

| Aspect              | Local (`npm run dev`)               | Docker / Production                    |
|---------------------|-------------------------------------|----------------------------------------|
| Server              | Next.js dev server (HMR)           | `node server.js` (standalone)          |
| Database            | Neon cloud (same)                  | Neon cloud (same)                      |
| Node version        | Whatever's installed               | node:18-alpine (pinned)                |
| Prisma client       | Generated locally                  | Generated in builder stage             |
| ENV source          | `.env` file                        | Docker env/env_file                    |
| Hot reload          | Yes                                | No                                     |
| Build optimization  | None                               | Standalone trace (minimal output)      |

### Running Locally

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations (if needed)
npm run db:migrate

# Seed database
npm run db:seed

# Start dev server
npm run dev
```

### Building Docker Image

```bash
# Build
docker compose build

# Run
docker compose up -d

# View logs
docker compose logs -f web
```

### Production Deployment Notes

1. Set `NODE_ENV=production` (automatic in Dockerfile)
2. Use production `DATABASE_URL` pointing to Neon production branch
3. Generate a strong `AUTH_SECRET` (different from development)
4. Set `AUTH_URL` to the production domain
5. Consider upgrading to `node:20-alpine` for Node 20 LTS support

---

## NPM Scripts Reference

| Script        | Command                                                                  | Use Case             |
|---------------|--------------------------------------------------------------------------|----------------------|
| `dev`         | `next dev`                                                               | Local development    |
| `build`       | `next build`                                                             | Production build     |
| `start`       | `next start`                                                             | Run production build |
| `lint`        | `eslint`                                                                 | Lint codebase        |
| `db:migrate`  | `prisma migrate dev`                                                     | Run DB migrations    |
| `db:generate` | `prisma generate`                                                        | Generate Prisma client |
| `db:seed`     | `ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts`        | Seed database        |
| `db:studio`   | `prisma studio`                                                          | Visual DB browser    |
