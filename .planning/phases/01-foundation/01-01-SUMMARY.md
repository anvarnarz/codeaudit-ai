---
phase: 01-foundation
plan: "01"
subsystem: infra
tags: [nextjs, drizzle, postgres, redis, docker, pnpm, monorepo, tailwind, shadcn, bullmq]

requires: []

provides:
  - pnpm monorepo with apps/web, packages/db, packages/audit-engine, packages/llm-adapter, packages/repo-sandbox, worker
  - Next.js 16 App Router app with dark-mode landing page and dashboard shell
  - Drizzle ORM schema with all Phase 1 tables (users, accounts, sessions, api_keys, github_installations, audits, audit_phases)
  - AuditFindings/AuditFinding TypeScript types for Phase 5 comparison
  - Docker Compose dev environment (PostgreSQL 16 + Redis 7)
  - Stub packages for audit-engine, llm-adapter, repo-sandbox with documented contracts

affects: [01-02-auth, 01-03-github, 02-audit, 03-engine, 05-comparison]

tech-stack:
  added:
    - next@16.2.0
    - react@19.x
    - drizzle-orm@0.36.x + @neondatabase/serverless
    - drizzle-kit@0.27.x
    - tailwindcss@4.x + @tailwindcss/postcss
    - bullmq@5.x + ioredis@5.x
    - pnpm workspaces
    - vitest@2.x
    - prettier@3.x
    - concurrently@9.x
    - clsx + tailwind-merge + class-variance-authority
  patterns:
    - Dark mode default via CSS variables on html.dark class (no JS flash)
    - AES-256-GCM BYOK key storage pattern: encrypted_key + iv columns (master key from env)
    - Drizzle schema uses crypto.randomUUID() for ID generation
    - Structured JSONB findings with typed AuditFindings interface (defined early for Phase 5)
    - Microdollar cost tracking (integer column, 0.000001 USD units) to avoid float precision issues

key-files:
  created:
    - package.json (root — workspace scripts, dev:db, db:generate, db:migrate)
    - pnpm-workspace.yaml
    - tsconfig.json (root — project references for packages + worker)
    - vitest.config.ts
    - .prettierrc / .eslintrc.json / .gitignore
    - docker-compose.yml + docker/docker-compose.yml
    - .env.example
    - CHANGELOG.md
    - apps/web/app/layout.tsx (dark mode root layout, Geist font)
    - apps/web/app/page.tsx (landing page — product name, GitHub sign-in CTA)
    - apps/web/app/(dashboard)/layout.tsx (sidebar nav shell)
    - apps/web/app/globals.css (Linear-style CSS variables, dark scrollbar)
    - apps/web/lib/utils.ts (cn() helper)
    - apps/web/components.json (Shadcn/ui config)
    - packages/db/src/schema.ts (all tables + TypeScript types)
    - packages/db/src/client.ts (createDbClient, getDb singleton)
    - packages/db/drizzle.config.ts
    - packages/audit-engine/src/index.ts (stub with AuditEngineConfig type)
    - packages/llm-adapter/src/index.ts (stub with LlmAdapterConfig + BYOK docs)
    - packages/repo-sandbox/src/index.ts (stub with CloneOptions + safety model docs)
    - worker/src/index.ts (stub with BullMQ architecture comments)
  modified: []

key-decisions:
  - "AuditFindings JSONB schema locked in Phase 1 schema.ts to guarantee Phase 5 comparison has a stable structure to diff against"
  - "Costs stored as microdollar integers (not floats) to avoid floating-point precision issues in token accounting"
  - "apps/web excluded from root tsconfig project references — Next.js app uses bundler moduleResolution incompatible with composite mode"
  - "GitHub App installation_id stored separately from OAuth accounts table — GitHub App token retrieval is server-side only (D-04 pattern)"
  - "Worker stub documents commented BullMQ setup for Phase 3 rather than leaving TODOs in a vacuum"

patterns-established:
  - "Package naming: @codeaudit/{package-name} for all workspace packages"
  - "BYOK key storage: encryptedKey (hex) + iv (hex) columns, master key from API_KEY_ENCRYPTION_SECRET env var"
  - "Cost tracking: microdollar integers (multiply USD by 1,000,000 before storing)"
  - "Stub packages: include typed interface + throw error with 'coming in Phase X' message"
  - "Dark mode: html.dark class set in layout.tsx, CSS variables in globals.css, no client JS needed"

requirements-completed: []

duration: 8min
completed: 2026-03-22
---

# Phase 1 Plan 01: Project Scaffolding Summary

**pnpm monorepo with Next.js 16, Drizzle ORM schema (8 tables including typed JSONB findings), Docker Compose dev environment, and documented stubs for audit-engine, llm-adapter, and repo-sandbox packages**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-21T18:56:24Z
- **Completed:** 2026-03-22T00:00:00Z
- **Tasks:** 7 of 7
- **Files modified:** ~32 files created

## Accomplishments

- Complete monorepo scaffold: pnpm workspaces, root TypeScript project references, Prettier, ESLint, Vitest
- Next.js 16 App Router app with dark-mode Linear-style landing page (product name, one-liner, GitHub sign-in CTA) and sidebar dashboard shell
- Full Drizzle schema with 8 tables: users, accounts, sessions, verification_tokens (Auth.js-ready), api_keys (AES-256-GCM design), github_installations, audits (JSONB findings), audit_phases
- `AuditFindings` and `AuditFinding` TypeScript interfaces locked in Phase 1 so Phase 5 comparison has a stable structure
- Docker Compose with PostgreSQL 16 + Redis 7, persistent volumes, health checks, root-level convenience include

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize monorepo** - `094e6cb` (chore)
2. **Task 2: Scaffold Next.js 16 app** - `220f0f7` (feat)
3. **Task 3: Drizzle + Neon database package** - `fd352f4` (feat)
4. **Task 4: Stub packages** - `6d5b139` (chore)
5. **Task 5: Worker stub** - `753fc5b` (chore)
6. **Task 6: Docker Compose** - `5903585` (chore)
7. **Task 7: Dev tooling** - `ea62722` (chore)

## Files Created/Modified

- `package.json` — workspace scripts including dev:db, db:generate, db:migrate
- `pnpm-workspace.yaml` — points to apps/*, packages/*, worker
- `tsconfig.json` — project references for packages and worker (apps/web excluded — uses bundler mode)
- `vitest.config.ts` — cross-package test config
- `.prettierrc`, `.eslintrc.json`, `.gitignore`, `.env.example` — tooling configs
- `docker-compose.yml` + `docker/docker-compose.yml` — PostgreSQL 16 + Redis 7
- `CHANGELOG.md` — initial changelog
- `apps/web/app/layout.tsx` — root layout, dark mode, Geist font
- `apps/web/app/page.tsx` — minimal landing page with GitHub sign-in button
- `apps/web/app/(dashboard)/layout.tsx` — sidebar nav (Dashboard, Audits, Repos, Settings)
- `apps/web/app/globals.css` — Linear-style CSS variables, dark scrollbar
- `apps/web/lib/utils.ts` — cn() helper
- `apps/web/components.json` — Shadcn/ui configuration
- `packages/db/src/schema.ts` — all 8 tables + AuditFindings types
- `packages/db/src/client.ts` — createDbClient() + getDb() singleton
- `packages/db/drizzle.config.ts` — Drizzle Kit config
- `packages/audit-engine/src/index.ts` — typed stub, implements in Phase 3
- `packages/llm-adapter/src/index.ts` — typed stub with BYOK docs, implements in Phase 2
- `packages/repo-sandbox/src/index.ts` — typed stub with safety model docs, implements in Phase 3
- `worker/src/index.ts` — BullMQ worker stub with commented setup for Phase 3

## Decisions Made

- `AuditFindings` JSONB schema locked in Phase 1 schema to guarantee Phase 5 comparison feature has a stable diff target
- Costs stored as microdollar integers (not floats) to avoid floating-point precision issues
- `apps/web` excluded from root tsconfig project references — Next.js uses bundler `moduleResolution` incompatible with composite mode
- GitHub App `installationId` stored in its own table separate from the Auth.js `accounts` table — enables server-side-only token retrieval pattern from day one

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

The following stubs are intentional — they will be implemented in later phases:

- `packages/audit-engine/src/index.ts` — `createAuditEngine()` throws. Implemented in Phase 3.
- `packages/llm-adapter/src/index.ts` — `createLlmProvider()` throws. Implemented in Phase 2.
- `packages/repo-sandbox/src/index.ts` — `cloneToSandbox()` throws. Implemented in Phase 3.
- `worker/src/index.ts` — No actual BullMQ Worker registered. Implemented in Phase 3.
- `apps/web/app/(dashboard)/layout.tsx` — `getSession()` always returns null (redirects to landing). Auth implemented in Plan 01-02.
- Dashboard route pages (`/dashboard`, `/audits`, `/repos`, `/settings`) — placeholder text only. Implemented in Phase 2+.

These stubs do not prevent the plan's goal (infrastructure foundation) from being achieved.

## Issues Encountered

None.

## User Setup Required

None — this plan creates file structure only. No external services are configured yet.

To start the dev environment after `pnpm install`:
1. Copy `.env.example` to `.env.local` (for Next.js) and `.env` (for worker)
2. Run `pnpm dev:db` to start PostgreSQL + Redis via Docker
3. Set `DATABASE_URL` in `.env.local` to the local Postgres connection string
4. Run `pnpm db:generate` then `pnpm db:migrate` to apply migrations
5. Run `pnpm dev:web` to start Next.js at localhost:3000

## Next Phase Readiness

- Monorepo structure is complete — Plan 01-02 (Auth.js + GitHub OAuth) can import `@codeaudit/db` immediately
- `packages/db` schema is Auth.js-ready (users, accounts, sessions, verification_tokens tables match Auth.js Drizzle adapter expectations)
- Dashboard layout shell exists — auth redirect logic just needs to swap the `getSession()` stub for the real Auth.js `auth()` call
- Docker Compose provides the Postgres and Redis instances needed for 01-02 and 01-03

---
*Phase: 01-foundation*
*Completed: 2026-03-22*

## Self-Check: PASSED

All 17 key files verified present. All 7 task commits verified in git history.
