# Stack Research

**Domain:** Codebase audit webapp — GitHub integration, multi-LLM backend, real-time progress, interactive dashboards
**Researched:** 2026-03-21
**Confidence:** HIGH (most claims verified against official docs or current release notes)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.x (current stable as of March 2026) | Full-stack React framework | App Router + React Server Components eliminate most API boilerplate; built-in SSE streaming with Route Handlers; Vercel official support. Avoid Pages Router — App Router is now the baseline. |
| TypeScript | 5.x | Language | Non-negotiable for a codebase that generates typed audit schemas, multi-LLM response parsing, and structured phase output. |
| PostgreSQL via Neon | Neon serverless | Primary database | Serverless-native, branches per PR automatically, tightest Next.js/Vercel integration. Pure database (no BaaS bloat). Audit history with JSON audit results fits Postgres well. |
| Drizzle ORM | 0.36.x | Database ORM | SQL-first TypeScript ORM, ~7KB bundle, runs within 10-20% of raw SQL. Neon official integration. Prisma is now comparable post-v7 but Drizzle remains preferred for lean serverless workloads. |
| Auth.js (NextAuth) | v5 (stable) | Authentication + GitHub OAuth | Framework-native, GitHub provider built in, stores OAuth access_token in JWT callbacks, zero vendor lock-in. 2M weekly downloads. Preferred over Clerk (paid) for a project where you control the infra. |
| Vercel AI SDK | 6.x (released Dec 2025) | Multi-LLM abstraction | Single API for Anthropic, OpenAI, and Gemini. Handles streaming, structured output, tool calls across all three providers uniformly. AI SDK 6 adds DevTools and MCP support. Write prompt logic once, swap providers. |
| BullMQ | 5.x | Background job queue for audits | Redis-backed, self-hostable, TypeScript-native. Audits are long-running (30 min to 4+ hours) — they cannot run in serverless functions. BullMQ workers run as persistent processes outside Next.js. Trigger.dev is a managed alternative but adds vendor dependency and cost. |
| Redis (Upstash or self-hosted) | — | BullMQ backend + SSE event bridge | BullMQ requires Redis. Upstash HTTP Redis works for serverless job enqueuing; a dedicated Redis instance is needed for the worker process. Also used as the event bus to push phase progress from worker to SSE endpoints. |
| Tailwind CSS | 4.x | Styling | De facto standard for Next.js apps in 2026. Shadcn/ui depends on it. Zero-config purging. |
| Shadcn/ui | latest | UI component library | Copy-paste components built on Radix UI. Includes Chart components (powered by Recharts) for audit score dashboards. No version lock-in; components live in your repo. |
| simple-git | 3.x | Git cloning in the worker | Wraps the system git binary; supports token-based HTTPS cloning for private repos using URL-embedded credentials. Simpler than isomorphic-git for server-only use, no native binding segfaults like nodegit. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @ai-sdk/anthropic | 1.x | Anthropic provider for AI SDK | Always — Anthropic is the primary audit LLM |
| @ai-sdk/openai | 1.x | OpenAI provider for AI SDK | Always — OpenAI is a required BYOK provider |
| @ai-sdk/google | 1.x | Gemini provider for AI SDK | Always — Gemini is a required BYOK provider |
| TanStack Query (React Query) | v5 | Client-side server state | Audit history listing, comparison fetching, status polling fallback. 12.3M weekly downloads, overtook SWR in late 2024. Use for data that benefits from caching and background refetch. |
| Zod | 3.x | Schema validation | Validate user inputs (API keys, repo selection), parse structured LLM output, runtime type safety at API boundaries. |
| @node-rs/argon2 or bcryptjs | latest | Password hashing | Only if adding email+password auth alongside GitHub OAuth. Argon2 is preferred; bcryptjs if native bindings are a concern. |
| node:crypto (built-in) | Node 18+ | BYOK API key encryption | Encrypt user-provided LLM API keys at rest using AES-256-GCM with unique IVs. Use Node's built-in crypto — no extra dependency needed. Store master encryption key in environment secrets (not database). |
| @ioredis / @upstash/redis | latest | Redis client | ioredis for self-hosted Redis (worker process); @upstash/redis for serverless Route Handlers that enqueue jobs. |
| bullmq | 5.x | Worker-side queue processing | Import in the long-running worker process (not in Next.js app router). |
| recharts | 2.x | Charts in dashboards | Already bundled via Shadcn charts. Use for phase scores, complexity trends, audit comparison charts. |
| react-markdown / remark | latest | Markdown rendering | Render audit findings.md and codebase_health.md in-app without converting to HTML at generation time. |
| archiver or tar-stream | latest | Report bundling | ZIP or tarball downloadable report packages (HTML + markdown + budget log). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| pnpm | Package manager | Faster than npm, better monorepo support if worker process is split into a separate workspace package. |
| Vitest | Unit testing | Vite-native, fast, works with TypeScript out of the box. Use for audit phase logic, LLM prompt builders, and schema validators. |
| Playwright | E2E testing | Critical for GitHub OAuth flow and multi-step audit UI. |
| Docker Compose | Local dev environment | Run Redis + PostgreSQL locally. The BullMQ worker runs as a separate container to mirror production. |
| ESLint + Prettier | Linting + formatting | Standard. Use eslint-config-next for Next.js rules. |
| Drizzle Kit | Database migrations | Drizzle's CLI for schema push and migration generation (`drizzle-kit generate`, `drizzle-kit migrate`). |

---

## Installation

```bash
# Core framework
pnpm create next-app@latest codeaudit-web --typescript --tailwind --app

# Database
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit

# Auth
pnpm add next-auth@beta

# AI SDK + providers
pnpm add ai @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/google

# Job queue
pnpm add bullmq ioredis
pnpm add @upstash/redis  # for serverless enqueueing

# Validation
pnpm add zod

# Git operations (in worker)
pnpm add simple-git

# Client data fetching
pnpm add @tanstack/react-query

# UI components (Shadcn CLI — adds components individually)
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add card button badge progress chart

# Markdown rendering
pnpm add react-markdown remark-gfm

# Dev dependencies
pnpm add -D vitest @vitejs/plugin-react playwright eslint-config-next
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16 App Router | Remix v2 | If you need edge-first deployment on Cloudflare Workers. Remix's loader/action model is cleaner for form-heavy apps, but Next.js has stronger ecosystem for dashboard-heavy UIs and AI SDK integration is Next.js-first. |
| BullMQ | Trigger.dev v3 | If you want zero-infrastructure managed workers and don't mind vendor dependency + managed cost. Trigger.dev v3 has better observability UI and native LLM streaming to frontend. Worth revisiting if self-hosting ops become a bottleneck. |
| BullMQ | Inngest | If you're running fully serverless (no persistent worker process). Inngest can run workflows without a Redis instance but adds cloud vendor dependency. |
| Neon (serverless Postgres) | Supabase | If you want a batteries-included backend (realtime, auth, storage) and are willing to use Supabase's client library patterns in Next.js Server Components. More friction with App Router than Neon. |
| Drizzle ORM | Prisma 7 | Prisma 7 dropped the Rust query engine (pure TypeScript now), so performance is comparable. Choose Prisma if team is more familiar with it — the DX gap has narrowed. |
| Auth.js v5 | Clerk | If you want a drop-in auth UI with org management and don't mind $25+/month at scale. Overkill for a single-user GitHub OAuth flow. |
| simple-git | isomorphic-git | If you need pure JS (no system git binary dependency). Significantly slower on large repos. Only relevant for edge/serverless environments where exec is not available — the worker runs on Node, so simple-git is appropriate. |
| node:crypto AES-256-GCM | Infisical / Doppler / AWS KMS | If compliance requirements (SOC 2, HIPAA) demand external key management. For v1, envelope encryption with a server-side master key in environment secrets is sufficient and avoids vendor dependency. |
| Shadcn/ui + Recharts | Tremor | Tremor (now Vercel-owned) sits on top of Shadcn and is purpose-built for dashboards. Use Tremor components if the audit dashboard requires complex KPI cards and multi-series time charts with minimal custom code. Both share the same Radix + Tailwind foundation — they're compatible. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| vm2 / isolated-vm for code sandboxing | vm2 has active CVEs (CVE-2026-22709, CVSS 9.8). vm2 maintainers recommend Docker-based isolation. isolated-vm is better but still requires careful hardening. The repo clone sandbox is a filesystem concern, not a code execution concern — you're running LLM API calls, not executing cloned code. | Read-only filesystem mount + no network access in the worker container. Docker with `--read-only` and network policy restricting outbound to only LLM API endpoints. No code execution sandbox needed. |
| Vercel Serverless Functions for audit execution | Vercel's max execution timeout (even Pro) is 300s. A full audit takes 30 min to 4+ hours. Serverless will time out. | BullMQ workers running as persistent Node.js processes (Docker container / Railway / Fly.io). |
| WebSockets for progress updates | Bidirectional — unnecessary complexity for one-way server-to-client progress pushes. SSE is simpler, firewall-friendly, and native HTTP. | Server-Sent Events (SSE) via Next.js Route Handlers + Redis pub/sub as the worker-to-SSE bridge. |
| Storing raw LLM API keys in the database | Plain-text secrets are a breach liability. | AES-256-GCM encryption via node:crypto, master key in environment variables / secrets manager. |
| nodegit | Authentication errors cause segfaults due to libgit2 assertions. Actively problematic for private repo cloning. | simple-git (wraps system git, token-in-URL pattern). |
| Next.js Pages Router | Deprecated path. App Router is stable since Next.js 13.4, now the default in Next.js 16. App Router is required for RSC and native streaming. | Next.js App Router. |
| JWT session storing GitHub access_token in cookie | OAuth tokens can exceed cookie size limits; storing in JWT exposes the token client-side. | Auth.js database session strategy with access_token persisted in the database sessions/accounts tables, retrieved server-side only. |

---

## Stack Patterns by Variant

**For the audit worker process (separate from Next.js):**
- Run as a dedicated Docker container or Railway/Fly.io service
- Import BullMQ Worker, simple-git, AI SDK, Zod
- No Next.js, no Tailwind — pure Node.js TypeScript
- Worker emits phase events to Redis pub/sub channel
- Next.js SSE Route Handler subscribes to that Redis channel and streams to client

**For BYOK API key handling:**
- User submits key via form in Next.js Server Action
- Server Action encrypts with AES-256-GCM (node:crypto), stores ciphertext + IV in Postgres
- Worker retrieves ciphertext, decrypts at job start, passes to AI SDK provider constructor
- Key is never logged, never returned to client after submission

**For GitHub OAuth access_token storage:**
- Use Auth.js database session strategy (not JWT)
- The GitHub access_token lands in the `account` table (Auth.js default schema)
- Worker retrieves access_token via server-side database query, not from session cookie
- Use token in simple-git clone URL: `https://x-access-token:${token}@github.com/org/repo.git`

**For audit progress streaming:**
1. Worker publishes phase events: `REDIS.publish('audit:${jobId}', JSON.stringify(event))`
2. Next.js Route Handler at `/api/audits/[id]/stream`: subscribes to that channel, streams as SSE
3. Client: `useEffect` with `EventSource` (or TanStack Query with SSE adapter) renders live phase progress

**For deployment:**
- Next.js app: Vercel (tightest integration with Neon + Auth.js)
- Worker process: Railway or Fly.io (long-running containers, no timeout)
- Redis: Upstash (serverless, Vercel add-on) or Railway Redis
- Postgres: Neon (Vercel Postgres integration)

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| next@16.x | react@19.x | App Router requires React 19.x. Do not use React 18 with the App Router in Next.js 16. |
| next-auth@beta (v5) | next@16.x | Auth.js v5 renamed middleware.ts to proxy.ts in Next.js 16 — follow migration guide at authjs.dev. |
| drizzle-orm@0.36.x | @neondatabase/serverless@latest | Use neon's HTTP adapter for serverless Route Handlers; use neon's WebSocket adapter for the worker process. |
| ai@6.x (@ai-sdk/anthropic etc.) | next@16.x | AI SDK 6 ships v3 Language Model Specification. Use `npx @ai-sdk/codemod v6` if upgrading from v5. |
| bullmq@5.x | ioredis@5.x | BullMQ 5 requires ioredis 5. Do not use the redis package (not ioredis) — BullMQ explicitly requires ioredis. |
| @tanstack/react-query@5.x | react@19.x | TanStack Query v5 supports React 19 with no issues. Use the `ReactQueryDevtools` panel in dev. |

---

## Sources

- [Next.js 16 release / upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — version confirmed current stable March 2026
- [AI SDK 6 — Vercel Blog](https://vercel.com/blog/ai-sdk-6) — release Dec 22, 2025; Anthropic/OpenAI/Google provider support confirmed
- [AI SDK 6 — WebFetch verification](https://vercel.com/blog/ai-sdk-6) — unified provider API, MCP support, DevTools
- [Auth.js reference — authjs.dev](https://authjs.dev/reference/nextjs) — v5 stable, GitHub provider, database session strategy
- [Neon vs Supabase comparison — bytebase.com](https://www.bytebase.com/blog/neon-vs-supabase/) — MEDIUM confidence (third party, consistent with official Neon positioning)
- [Drizzle vs Prisma 2026 — makerkit.dev](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma) — Prisma 7 architectural change confirmed; Drizzle recommended for serverless
- [BullMQ vs Trigger.dev — GitHub Discussion](https://github.com/triggerdotdev/trigger.dev/discussions/922) — MEDIUM confidence; BullMQ preferred for self-hosted
- [Server-Sent Events vs WebSockets — HackerNoon](https://hackernoon.com/streaming-in-nextjs-15-websockets-vs-server-sent-events) — SSE recommendation for one-way progress streams
- [vm2 CVE-2026-22709 — Semgrep](https://semgrep.dev/blog/2026/calling-back-to-vm2-and-escaping-sandbox/) — HIGH confidence; critical sandbox escape confirmed
- [simple-git npm](https://www.npmjs.com/package/simple-git) — token-in-URL auth pattern confirmed
- [TanStack Query vs SWR 2025 — Refine](https://refine.dev/blog/react-query-vs-tanstack-query-vs-swr-2025/) — 12.3M vs 7.7M weekly downloads confirmed
- Vercel templates (Next.js + Drizzle + Neon + Auth.js) — confirmed as Vercel's own recommended starter

---

*Stack research for: CodeAudit Web — codebase audit webapp*
*Researched: 2026-03-21*
