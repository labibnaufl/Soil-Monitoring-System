# PROJECT_STRUCTURE.md — Directory Map

> **For AI models**: Reference this file to know where to place new files. Follow the established patterns exactly.

```
soil-monitoring-app/
│
├── .env                          # Environment variables (DATABASE_URL, AUTH_SECRET, AUTH_URL)
├── .gitignore                    # Git ignore rules
├── .dockerignore                 # Docker build ignore rules
├── AGENTS.md                     # AI agent rules (Next.js version caveat)
├── CLAUDE.md                     # AI context file
├── Dockerfile                    # Multi-stage Docker build (node:18-alpine, standalone output)
├── docker-compose.yml            # Single service: web (port 3000), env from .env
├── components.json               # Shadcn UI config (radix-nova style, Lucide icons)
├── eslint.config.mjs             # ESLint flat config (next/core-web-vitals + typescript)
├── next.config.ts                # Next.js config (output: "standalone")
├── next-env.d.ts                 # Next.js TypeScript declarations (auto-generated)
├── package.json                  # Dependencies and scripts
├── package-lock.json             # Lockfile
├── postcss.config.mjs            # PostCSS config (Tailwind CSS v4 plugin)
├── prisma.config.ts              # Prisma config (schema path, migration seed command)
├── tsconfig.json                 # TypeScript config (paths: @/* → ./src/*)
│
├── docs/                         # ★ Project documentation (this directory)
│   ├── ARCHITECTURE.md           # Master overview, system diagram, tech rationale
│   ├── PROJECT_STRUCTURE.md      # This file — directory map
│   ├── DATABASE.md               # Prisma models, enums, indexes, Neon setup
│   ├── API_ROUTES.md             # Every API route with request/response shapes
│   ├── DOCKER.md                 # Docker services, env vars, port mappings
│   ├── AUTH_FLOW.md              # Auth strategy, session handling, middleware
│   └── CONVENTIONS.md            # Naming rules, patterns, code style
│
├── prisma/
│   ├── schema.prisma             # Database schema (8 models, 9 enums)
│   ├── seed.ts                   # Seed script (SystemConfig, Station, SuperAdmin, AdminLokasi)
│   └── migrations/               # Prisma migration history
│
├── public/
│   ├── Images/                   # Static images (station photos, etc.)
│   ├── favicon.ico               # App favicon
│   └── *.svg                     # Default Next.js SVG assets
│
└── src/
    ├── middleware.ts              # Auth guard: protects /dashboard/*, redirects /auth/login
    │
    ├── app/                      # Next.js App Router (file-based routing)
    │   ├── layout.tsx            # Root layout: fonts, TooltipProvider, Toaster
    │   ├── page.tsx              # Root page: redirects to /auth/login
    │   ├── globals.css           # Tailwind + Shadcn theme tokens (oklch colors)
    │   ├── favicon.ico           # Favicon
    │   │
    │   ├── auth/
    │   │   └── login/
    │   │       └── page.tsx      # Login page (client component, signIn via next-auth/react)
    │   │
    │   ├── api/                  # REST API routes (for IoT and external access)
    │   │   ├── auth/
    │   │   │   └── [...nextauth]/
    │   │   │       └── route.ts  # Auth.js catch-all handler (GET + POST)
    │   │   ├── readings/
    │   │   │   └── route.ts      # IoT data ingestion (POST) and query (GET)
    │   │   ├── alerts/
    │   │   │   └── route.ts      # Alert listing (GET) and resolution (PATCH)
    │   │   ├── devices/          # ⚠️ EMPTY — not yet implemented
    │   │   ├── stations/         # ⚠️ EMPTY — not yet implemented
    │   │   ├── ai-insights/      # ⚠️ EMPTY — not yet implemented
    │   │   ├── logs/             # ⚠️ EMPTY — not yet implemented
    │   │   └── system-config/    # ⚠️ EMPTY — not yet implemented
    │   │
    │   └── dashboard/            # Protected dashboard area
    │       ├── layout.tsx        # Dashboard layout wrapper (uses DashboardLayout component)
    │       ├── page.tsx          # Dashboard home (server component, data fetched)
    │       │
    │       ├── _components/      # Shared dashboard layout components
    │       │   ├── dashboard-layout.tsx   # SessionProvider + SidebarProvider + SidebarInset
    │       │   ├── admin-sidebar.tsx      # Collapsible sidebar with nav groups + alert badges
    │       │   ├── site-header.tsx        # Top header with SidebarTrigger + breadcrumb
    │       │   ├── nav-user.tsx           # User avatar dropdown (role badge, sign out)
    │       │   ├── dashboard-content.tsx  # Dashboard content wrapper
    │       │   └── stat-cards.tsx         # Reusable stat card grid
    │       │
    │       ├── management/       # Admin management modules
    │       │   ├── users/        # User management (SUPER_ADMIN only)
    │       │   │   ├── page.tsx              # Users list with stats, filters, table
    │       │   │   ├── [id]/
    │       │   │   │   ├── page.tsx          # User detail page
    │       │   │   │   └── user-detail-actions.tsx  # Client actions for user detail
    │       │   │   ├── _components/
    │       │   │   │   ├── user-actions.tsx   # Action dropdown (edit, activate, delete)
    │       │   │   │   └── user-form-modal.tsx # Create user modal form
    │       │   │   ├── _lib/                  # ⚠️ EMPTY
    │       │   │   └── actions/
    │       │   │       └── user.ts            # Server Actions: CRUD, activate, password, profile
    │       │   │
    │       │   ├── stations/     # Station management (SUPER_ADMIN only)
    │       │   │   ├── page.tsx              # Stations list with stats, filters, table
    │       │   │   ├── [id]/
    │       │   │   │   ├── page.tsx          # Station detail (devices, admins, map)
    │       │   │   │   ├── station-detail-actions.tsx
    │       │   │   │   └── _components/      # Station detail sub-components
    │       │   │   ├── _components/
    │       │   │   │   ├── station-actions.tsx    # Action dropdown for station row
    │       │   │   │   ├── station-form-modal.tsx # Create station modal
    │       │   │   │   └── edit-station-modal.tsx # Edit station modal
    │       │   │   └── actions/
    │       │   │       ├── station.ts         # Server Actions: CRUD, activate/deactivate
    │       │   │       └── assignment.ts      # Server Actions: assign/unassign devices & admins
    │       │   │
    │       │   ├── devices/      # Device management (SUPER_ADMIN only)
    │       │   │   ├── page.tsx              # Devices list with stats, filters, table
    │       │   │   ├── [id]/
    │       │   │   │   ├── page.tsx          # Device detail (readings, calibration, config)
    │       │   │   │   ├── device-detail-actions.tsx
    │       │   │   │   └── _components/      # Device detail sub-components
    │       │   │   └── _components/
    │       │   │       ├── device-actions.tsx     # Action dropdown for device row
    │       │   │       ├── device-form-modal.tsx  # Create device modal
    │       │   │       └── actions/
    │       │   │           └── device.ts      # Server Actions: CRUD, status, assign
    │       │   │
    │       │   ├── device/       # ⚠️ EMPTY — duplicate, should be removed
    │       │   └── notification/ # ⚠️ EMPTY — not yet implemented
    │       │
    │       ├── alerts/           # Alert/notification management (all roles)
    │       │   ├── page.tsx              # Alerts list with stats, filters, table
    │       │   └── _components/
    │       │       ├── alert-actions.tsx      # Resolve/status change actions
    │       │       ├── mock-alert-modal.tsx   # Create test alert (SUPER_ADMIN)
    │       │       └── actions/
    │       │           └── alert.ts           # Server Actions: CRUD, resolve, counts
    │       │
    │       ├── monitoring/       # ⚠️ ALL EMPTY — monitoring pages not yet built
    │       │   ├── water-level/      # Water level time-series charts
    │       │   ├── soil-monitoring/  # Soil metrics dashboard
    │       │   ├── curah-hujan/      # Rainfall monitoring
    │       │   └── prediksi-ai/      # AI prediction insights
    │       │
    │       ├── logs/             # ⚠️ EMPTY — activity log viewer
    │       └── settings/         # ⚠️ EMPTY — system settings page
    │
    ├── components/
    │   └── ui/                   # Shadcn UI components (auto-generated, do not manually edit)
    │       ├── avatar.tsx
    │       ├── breadcrumb.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── dropdown-menu.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── separator.tsx
    │       ├── sheet.tsx
    │       ├── sidebar.tsx        # Full Shadcn sidebar (largest component ~21KB)
    │       ├── skeleton.tsx
    │       └── tooltip.tsx
    │
    ├── hooks/
    │   └── use-mobile.ts         # useIsMobile() — responsive breakpoint hook
    │
    ├── lib/                      # Shared utilities and configurations
    │   ├── auth.ts               # Auth.js v5 config (providers, callbacks, type augmentation)
    │   ├── prisma.ts             # Prisma client singleton (PrismaPg adapter, dev caching)
    │   ├── calibration.ts        # Calibration formula engine (6 types, validation)
    │   └── utils.ts              # cn() — Tailwind class merge utility
    │
    └── types/                    # ⚠️ EMPTY — shared TypeScript types
```

---

## File Placement Rules

| What you're creating                    | Where it goes                                                     |
|-----------------------------------------|-------------------------------------------------------------------|
| New Shadcn component                    | `src/components/ui/{name}.tsx`                                    |
| Custom reusable component               | `src/components/{name}.tsx`                                       |
| New dashboard page                      | `src/app/dashboard/{section}/page.tsx`                            |
| Page-specific component                 | `src/app/dashboard/{section}/_components/{name}.tsx`              |
| Server Action for a page               | `src/app/dashboard/{section}/actions/{entity}.ts`                 |
| New REST API route                      | `src/app/api/{resource}/route.ts`                                 |
| New library/utility                     | `src/lib/{name}.ts`                                               |
| New React hook                          | `src/hooks/{use-name}.ts`                                         |
| Shared TypeScript type                  | `src/types/{name}.ts`                                             |
| Static asset                            | `public/{folder}/{file}`                                          |
| Documentation                           | `docs/{NAME}.md`                                                  |

---

## Naming Conventions (Quick Ref)

- **Files**: `kebab-case.tsx` for components, `kebab-case.ts` for utils
- **Components**: `PascalCase` exports (e.g., `UserActions`)
- **Server Actions**: `camelCase` functions (e.g., `createUser`)
- **Directories**: `kebab-case` for routes, `_prefixed` for private (non-route) folders
- **Prisma models**: `PascalCase` singular (e.g., `User`, `Readings`)
