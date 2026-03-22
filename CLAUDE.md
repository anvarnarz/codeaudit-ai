<!-- GSD:project-start source:PROJECT.md -->
## Project

**CodeAudit**

A local web application (`npx codeaudit`) that wraps a manual 13-phase codebase audit process into a browser-based UI. Users run it on their machine at localhost, point it at local folders, choose an audit type/depth/LLM model, and get a comprehensive codebase health report. No code ever leaves the user's machine except LLM API calls with the user's own key.

**Core Value:** Anyone can run a thorough, structured codebase health audit on any local codebase without CLI setup — just open the app, pick a folder, and run.

### Constraints

- **Local execution**: All code stays on the user's machine. Only LLM API calls go outbound.
- **Safety**: Target folder locked read-only + git push blocked before every audit, guaranteed unlock on exit.
- **Multi-LLM**: Anthropic, OpenAI, and Gemini with provider-tuned prompts.
- **Cost transparency**: Real-time token/cost display with budget overrun warnings.
- **Source of truth**: The 13-phase audit logic in `manual-codebase-review-process/codebase_review_guide.md` is the source of truth.
<!-- GSD:project-end -->

<!-- GSD:stack-start -->
## Technology Stack

### Core
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | Full-stack React framework (App Router, Server Components, Route Handlers) |
| TypeScript | 5.7 | Language for all packages |
| SQLite (better-sqlite3) | 12.x | Local database at `~/.codeaudit/codeaudit.db` — zero config, no Docker needed |
| Drizzle ORM | 0.36.x | SQL-first TypeScript ORM for SQLite |
| Vercel AI SDK | 6.x | Multi-LLM abstraction (Anthropic, OpenAI, Gemini) — write once, swap providers |
| Tailwind CSS | 4.x | Styling — dark mode default, Linear aesthetic |
| Shadcn/ui | latest | UI components (Radix UI based) — buttons, cards, badges, charts |
| Recharts | 2.x | Severity breakdown charts in results dashboard |

### Monorepo Structure
```
apps/web/              → Next.js 16 frontend + API routes
packages/db/           → Drizzle schema + SQLite client
packages/audit-engine/ → 13-phase audit orchestrator + phase runners
packages/llm-adapter/  → Multi-LLM abstraction (3 providers + AUTO)
packages/repo-sandbox/ → Git cloning utilities (stub)
packages/cli/          → npx entry point (ENCRYPTION_KEY bootstrap + browser open)
worker/                → BullMQ worker (stub — audits run in-process for v1)
```

### Key Libraries
| Library | Purpose |
|---------|---------|
| @ai-sdk/anthropic, @ai-sdk/openai, @ai-sdk/google | LLM provider adapters |
| node:crypto (AES-256-GCM) | API key encryption at rest |
| archiver | Zip download of audit artifacts |
| puppeteer | PDF generation from HTML dashboards |
| Zod | Schema validation for LLM structured output |
| TanStack Query v5 | Client-side data fetching |

### No Auth
This is a local-only tool. No authentication layer — localhost access is sufficient.
No Auth.js, no GitHub OAuth, no session management.

### No Cloud Infrastructure
No PostgreSQL, no Redis, no BullMQ workers, no Docker required to run.
SQLite handles all storage. Audits run in the Next.js process.
Docker Compose exists for development convenience only.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start -->
## Conventions

### Code Patterns
- **Server Actions** in `apps/web/actions/` for all mutations
- **Server Components** for data loading, **Client Components** for interactivity
- **Drizzle ORM** queries via `getDb()` singleton (WAL mode, `~/.codeaudit/codeaudit.db`)
- **AES-256-GCM** for all secrets at rest (API keys). Master key at `~/.codeaudit/.env`
- **Shadcn/ui** components — dark mode, Linear aesthetic
- **Prompt injection defense**: `<data_block trust="untrusted">` wraps all repo content sent to LLMs

### Safety Enforcement
- `lockFolder()`: `git remote set-url --push origin no_push` THEN `chmod -R a-w` (order is critical)
- `unlockFolder()`: Always in `finally` block — guaranteed cleanup on complete/cancel/fail
- All audit output goes to `~/audit-{name}-{timestamp}/`, never inside the target folder

### Audit Engine
- Per-phase guide chunks from `manual-codebase-review-process/codebase_review_guide.md` (not full 93K per call)
- App runs bash commands via `child_process.execFile`, feeds results to LLM for analysis
- Structured JSON output via Zod schemas — markdown/PDF are export formats
- SSE streaming progress from SQLite polling every 500ms
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start -->
## Architecture

### Data Flow
```
User → localhost:3000 → Next.js App Router
  → Server Action (startAudit) → lockFolder + DB insert
  → POST /api/audit/[id] → void runAudit() (detached)
    → Phase 0-11: execCommand() → buildPhasePrompt() → LLM API → markPhaseCompleted()
    → finally: unlockFolder()
  → SSE /api/audit/[id]/stream → polls auditPhases table → pushes to browser
  → Results at /audit/[id]/results → reads audits.findings JSONB
```

### Key Tables (SQLite)
- `api_keys` — encrypted BYOK keys (AES-256-GCM, multiple per provider)
- `app_settings` — key-value store (setup_complete flag)
- `audits` — audit records (status, findings JSONB, tokenCount, actualCostMicrodollars)
- `audit_phases` — per-phase results (status, findings array, tokensUsed)

### Routes
| Route | Purpose |
|-------|---------|
| `/` | Redirects to `/dashboard` |
| `/setup` | First-time wizard (add API key) |
| `/dashboard` | Recent audits |
| `/audit/new` | Configure + start audit |
| `/audit/[id]` | Live progress view |
| `/audit/[id]/results` | Findings dashboard |
| `/audit/[id]/executive` | Management report (iframe) |
| `/audit/[id]/technical` | Technical report (iframe) |
| `/audit/compare?a=&b=` | Delta comparison |
| `/history` | All audits grouped by folder |
| `/settings/api-keys` | API key management |
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
