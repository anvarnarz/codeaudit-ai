# Architecture Research

**Domain:** Codebase audit / analysis webapp with async LLM pipeline
**Researched:** 2026-03-21
**Confidence:** HIGH (patterns verified across multiple sources; specific library choices MEDIUM pending stack research)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Browser)                          │
│  ┌───────────────┐  ┌─────────────────┐  ┌──────────────────────┐  │
│  │  Auth / OAuth │  │  Audit Dashboard │  │  Live Progress View  │  │
│  │  Repo Browser │  │  History / Diff  │  │  (SSE event stream)  │  │
│  └───────┬───────┘  └────────┬────────┘  └──────────┬───────────┘  │
└──────────┼──────────────────┼───────────────────────┼──────────────┘
           │  REST             │  REST                 │  SSE / GET
┌──────────┼──────────────────┼───────────────────────┼──────────────┐
│                            API LAYER                                 │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     HTTP API Server                             │ │
│  │  /auth  /repos  /audits  /audits/:id/stream  /reports          │ │
│  └───────────────────────────────┬────────────────────────────────┘ │
└──────────────────────────────────┼──────────────────────────────────┘
                                   │  enqueue job
┌──────────────────────────────────┼──────────────────────────────────┐
│                         JOB QUEUE (Redis/BullMQ)                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  audit-jobs queue  →  [ {jobId, repoUrl, auditType, ...} ]   │   │
│  └────────────────────────────────┬─────────────────────────────┘   │
└───────────────────────────────────┼─────────────────────────────────┘
                                    │  dequeue
┌───────────────────────────────────┼─────────────────────────────────┐
│                          WORKER LAYER                                 │
│  ┌──────────────┐  ┌─────────────▼──────────────┐                   │
│  │  Repo Cloner  │  │      Audit Orchestrator     │                   │
│  │  (sandboxed) │→ │  Phase 0 → Phase 1-10 →     │                   │
│  └──────────────┘  │  Phase 11 (reports)         │                   │
│                    └─────────────┬───────────────┘                   │
│                                  │  calls                             │
│              ┌───────────────────┼───────────────────┐               │
│              ▼                   ▼                   ▼               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐    │
│  │  Anthropic API  │  │   OpenAI API    │  │   Gemini API     │    │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
                                   │  writes
┌──────────────────────────────────┼─────────────────────────────────┐
│                        STORAGE LAYER                                  │
│  ┌──────────────┐  ┌────────────▼───────────┐  ┌────────────────┐  │
│  │  PostgreSQL  │  │  Object Storage (S3 /  │  │  Redis         │  │
│  │  users,      │  │  local disk)           │  │  job state,    │  │
│  │  audits,     │  │  repo workspace dirs,  │  │  progress,     │  │
│  │  findings    │  │  report HTML/MD files  │  │  pub/sub       │  │
│  └──────────────┘  └────────────────────────┘  └────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Frontend SPA | Auth flows, repo selection, audit config, live progress display, report rendering | Next.js or React + React Query |
| HTTP API Server | Thin REST layer — accept requests, enqueue jobs, serve SSE streams, proxy report data | Node.js (Express/Fastify) or Next.js API routes |
| Job Queue | Durable async job submission, retry, priority, phase-level progress events | BullMQ + Redis |
| Repo Cloner | Clone repo using OAuth token; enforce read-only sandbox; clean up after job | Child process or Docker container per job |
| Audit Orchestrator | Execute 13 phases in sequence; dispatch LLM calls; write phase outputs; emit progress events | Worker process consuming BullMQ jobs |
| LLM Adapter | Abstract Anthropic/OpenAI/Gemini behind a single calling interface; handle streaming, retries, token counting | LiteLLM or thin hand-rolled adapter |
| Progress Publisher | Emit phase-level events to Redis; API server reads and forwards over SSE | Redis pub/sub or BullMQ QueueEvents |
| PostgreSQL | Persistent store for users, audit metadata, findings, comparison records | PostgreSQL via Prisma or Drizzle ORM |
| Object Storage | Store cloned repo workspace, generated report files (HTML, MD) | S3-compatible or local volume |
| Redis | Job queue broker, result backend, progress pub/sub channel | Redis 7+ |

---

## Recommended Project Structure

```
/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/                # App router pages
│   │   │   ├── (auth)/         # Login, OAuth callback
│   │   │   ├── repos/          # Repo browser
│   │   │   ├── audits/         # Audit history, detail, comparison
│   │   │   └── api/            # Next.js API routes (thin layer)
│   │   └── components/         # UI components
│   │       ├── progress/       # Live phase progress views
│   │       └── reports/        # In-app report rendering
│   └── api/                    # Dedicated API server (if not using Next.js routes)
│       ├── routes/
│       └── middleware/
├── packages/
│   ├── audit-engine/           # Core 13-phase orchestrator (no HTTP dependency)
│   │   ├── phases/             # Phase 0-11 implementations
│   │   ├── orchestrator.ts     # Phase sequencing, state machine
│   │   └── prompts/            # LLM prompt templates per phase
│   ├── llm-adapter/            # Unified LLM client (Anthropic/OpenAI/Gemini)
│   │   ├── providers/
│   │   └── index.ts
│   ├── repo-sandbox/           # Clone, read-only enforcement, cleanup
│   │   ├── cloner.ts
│   │   └── sandbox.ts
│   └── db/                     # Prisma schema + generated client
│       ├── schema.prisma
│       └── migrations/
├── worker/                     # BullMQ worker process (runs audit-engine)
│   ├── index.ts                # Worker entry point, queue consumer
│   └── handlers/               # Per-job-type handlers
└── docker/
    ├── sandbox.Dockerfile      # Minimal image for repo cloning/analysis
    └── docker-compose.yml      # Dev environment: api + worker + redis + postgres
```

### Structure Rationale

- **packages/audit-engine/:** The 13-phase logic is the core product value. Isolating it from HTTP concerns means it can be tested directly, versioned independently, and reused if the transport layer changes.
- **packages/llm-adapter/:** Multi-provider support behind a single interface. The rest of the system calls `llm.complete(prompt)` and never knows which provider executed it.
- **packages/repo-sandbox/:** Sandbox logic is security-critical. Isolation as a package forces a narrow, explicit API surface and makes auditing the security boundary easy.
- **worker/:** A separate long-running process, not embedded in the API server. API servers should stay fast and stateless; workers can be slow and stateful.

---

## Architectural Patterns

### Pattern 1: Web-Queue-Worker

**What:** The HTTP API server accepts a job submission, immediately returns a job ID (HTTP 202 Accepted), and enqueues the work. A separate worker process dequeues and executes the audit. The client polls or subscribes to a streaming endpoint for status.

**When to use:** Any task that takes longer than ~30 seconds. Audits run 30 min to 4+ hours — this is mandatory, not optional.

**Trade-offs:** Adds Redis and a separate worker process to the stack. Operational complexity is worth it: the alternative (holding an HTTP connection open for hours) fails at every proxy, load balancer, and mobile network in the wild.

**Example:**
```typescript
// API: submit audit
POST /api/audits
→ { jobId: "uuid", status: "pending" }   // 202 Accepted, immediately

// API: stream progress
GET /api/audits/:id/stream
Content-Type: text/event-stream

data: {"phase": 0, "status": "running", "message": "Detecting stack..."}
data: {"phase": 1, "status": "running", "message": "Reading orientation files..."}
data: {"phase": 1, "status": "complete", "tokensUsed": 12400}
```

### Pattern 2: Phase State Machine in the Worker

**What:** The audit orchestrator models the 13 phases as an explicit state machine. Each phase transition writes state to the database and emits a progress event. The worker resumes from the last completed phase if interrupted (Redis job state + DB record together act as a checkpoint).

**When to use:** Any multi-phase long-running process where partial failure must not restart from scratch.

**Trade-offs:** Requires a phase state enum in the DB and a resume-from-checkpoint path. More initial complexity, but eliminates the "4-hour audit failed at phase 9, restart from zero" failure mode.

**Example:**
```typescript
type PhaseStatus = "pending" | "running" | "complete" | "failed" | "skipped"

interface AuditRecord {
  id: string
  phases: Record<number, { status: PhaseStatus; output?: string; tokensUsed?: number }>
  currentPhase: number
  // ...
}
```

### Pattern 3: SSE for Progress Streaming (Not WebSockets)

**What:** The API server exposes a GET endpoint that returns `Content-Type: text/event-stream`. The worker writes phase progress to a Redis pub/sub channel. The API server subscribes to that channel and forwards messages to the SSE connection.

**When to use:** One-directional server-to-client streaming. Audit progress is exactly this: server pushes, client reads.

**Trade-offs:** SSE is simpler than WebSockets (plain HTTP, auto-reconnects natively, works through proxies and load balancers without special config). Downside: one direction only, but audit progress doesn't need client→server messages mid-stream.

**Reconnection pattern:** SSE has built-in `Last-Event-ID` support. Include a `id:` field on each event. If the client reconnects, it sends `Last-Event-ID` header; the API server replays missed events from the stored audit record in the DB before re-subscribing to the live Redis channel.

### Pattern 4: Per-Job Sandbox Isolation

**What:** Each audit runs in an isolated, ephemeral workspace. The repo is cloned to a job-specific temp directory (`/tmp/audits/{jobId}/`). That directory is mounted read-only (or created with no write permissions outside the designated output dir) and deleted after the job completes or fails.

**When to use:** Always. Untrusted code from arbitrary GitHub repos must never share filesystem state between jobs.

**Trade-offs:** Disk space proportional to concurrent jobs. For large repos (monorepos >1GB), a shallow clone (`--depth=1`) saves time and space at the cost of git history analysis in phases that need it (git archaeology phases should clone with full history or specific depth).

**Example:**
```typescript
async function cloneRepo(jobId: string, repoUrl: string, token: string) {
  const workdir = `/tmp/audits/${jobId}`
  await fs.mkdir(workdir, { recursive: true })

  // Inject token via credential helper, never embed in URL
  await execa("git", [
    "clone",
    "--no-local",          // prevent hardlinks to host .git
    repoUrl,
    workdir
  ], {
    env: {
      GIT_TERMINAL_PROMPT: "0",
      GIT_ASKPASS: "/bin/false",
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "credential.helper",
      GIT_CONFIG_VALUE_0: `!f() { echo "password=${token}"; }; f`
    }
  })

  // Remove .git/hooks to prevent hook execution
  await fs.rm(path.join(workdir, ".git", "hooks"), { recursive: true, force: true })

  return workdir
}
```

---

## Data Flow

### Audit Submission Flow

```
User clicks "Run Audit"
    ↓
POST /api/audits  { repoId, auditType, depth, llmProvider, encryptedApiKey }
    ↓
API: create audit record (status=pending) → PostgreSQL
API: enqueue job → BullMQ (Redis)
API: return { auditId, status: "pending" }  [HTTP 202]
    ↓
Client opens SSE stream: GET /api/audits/:id/stream
API subscribes to Redis channel: audit:{id}:progress
    ↓
BullMQ Worker dequeues job
    ↓
[Repo Cloner]  git clone with OAuth token → /tmp/audits/{id}/
[Audit Engine] Phase 0: stack detection → LLM call
                publish to Redis: { phase: 0, status: "running" }
                → SSE event to client
[Audit Engine] Phase 0 complete → write output to DB + object storage
                publish to Redis: { phase: 0, status: "complete", tokensUsed: N }
[Audit Engine] Phase 1-10: repeat per phase
[Audit Engine] Phase 11: generate HTML reports → save to object storage
[Cleanup]      rm -rf /tmp/audits/{id}/
[Worker]       mark job complete in BullMQ
[API]          update audit status = "complete" in PostgreSQL
                publish final event to SSE → client shows "View Report"
```

### SSE Reconnection Flow

```
Client connects:  GET /api/audits/:id/stream  [Last-Event-ID: 5]
    ↓
API: load audit record from PostgreSQL
API: replay all phase events with id > 5 from stored phase state
    ↓
API: subscribe to live Redis channel
    ↓
Forward new events as they arrive
    ↓
On job complete: send final event, close stream
```

### Report Rendering Flow

```
Audit complete
    ↓
GET /api/audits/:id/report
    ↓
API: load findings from PostgreSQL
API: generate dashboard data (scores, charts metadata)
    ↓
Return: JSON for in-app dashboard rendering
           + signed URL for HTML report download
           + signed URL for MD report download
```

### Key Data Flows Summary

1. **OAuth token to clone:** GitHub OAuth access token → encrypted in session/DB → decrypted only in worker at clone time → never stored in plaintext in the job payload
2. **LLM API key:** User-provided key → encrypted at rest in PostgreSQL → decrypted in worker → passed to LLM adapter → never logged
3. **Audit output:** LLM response text → phase output files (object storage) → structured findings rows (PostgreSQL) → rendered in frontend
4. **Progress events:** Worker → Redis pub/sub → API SSE handler → client EventSource

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 concurrent audits | Single worker process, single Redis, single Postgres, local object storage (or S3). Docker Compose is sufficient. |
| 100-1k concurrent audits | Multiple worker replicas (BullMQ is designed for this — workers compete for jobs from the same queue). Move object storage to S3. Add read replicas to Postgres for report queries. |
| 1k+ concurrent audits | Audit-type-specific queues (security audits vs. quick scans) for independent scaling. Shard worker pools by queue. Consider horizontal pod autoscaling on k8s. |

### Scaling Priorities

1. **First bottleneck:** Workers. Audits are CPU/IO/LLM-bound, not API-server-bound. Add worker replicas before touching anything else.
2. **Second bottleneck:** Disk I/O from concurrent clones. Move clone workspace to ephemeral SSDs or RAM-backed tmpfs. Large monorepos will saturate shared disk.
3. **Third bottleneck:** Redis memory from many concurrent progress streams. Use Redis streams (not plain pub/sub) so events are persisted briefly and durable across brief disconnects.

---

## Anti-Patterns

### Anti-Pattern 1: Running the Audit Inside the API Server

**What people do:** Kick off the 13-phase audit directly inside the HTTP request handler using async/await, relying on request timeout settings to cover the runtime.

**Why it's wrong:** HTTP requests time out at proxies (Nginx default: 60s, Cloudflare: 100s). A 4-hour audit will be killed. Error recovery requires the client to re-request. The API server is blocked handling one long request and unavailable for others.

**Do this instead:** Enqueue via BullMQ. Return 202 immediately. Worker runs independently of HTTP layer.

### Anti-Pattern 2: Embedding OAuth Token in the Job Payload Plaintext

**What people do:** Store `{ token: "ghp_abc123" }` directly in the BullMQ job data (which lives in Redis).

**Why it's wrong:** Redis is often lightly secured in practice. Job data is readable by anyone with Redis access. Token exposure gives full GitHub API access to the user's repos.

**Do this instead:** Store an encrypted reference in the job (e.g., a session ID or DB row ID). Worker fetches and decrypts the token at runtime from PostgreSQL using application-level encryption (AES-256-GCM with a key from environment variables).

### Anti-Pattern 3: Sharing the Clone Workspace Between Phases

**What people do:** All phases of a single audit share one process context, and phase outputs are written to in-memory variables passed between phase functions.

**Why it's wrong:** For audits that take hours, a single Node.js process crash loses all intermediate state. Memory grows unbounded across 13 phases of LLM output.

**Do this instead:** Persist each phase's output to disk/object storage immediately after it completes. The orchestrator reads the previous phase's output from storage, not memory. Enables resumability.

### Anti-Pattern 4: Making the LLM Adapter Provider-Specific Throughout the Codebase

**What people do:** Import `Anthropic` client directly in phase implementation files. Phase 3 uses Anthropic SDK directly, Phase 7 has hardcoded OpenAI calls.

**Why it's wrong:** Switching providers (or supporting multiple simultaneously) requires rewriting every phase. Prompt structure differences between providers are scattered everywhere.

**Do this instead:** All phase code calls `llm.complete(prompt, options)`. One adapter module translates to each provider's SDK. Prompt templates note provider-specific considerations in one place.

### Anti-Pattern 5: No Filesystem Isolation on Cloned Repos

**What people do:** Clone into a shared directory like `/data/repos/` with worker-level write access to the full filesystem.

**Why it's wrong:** Malicious repos can contain `.git/hooks/post-checkout` scripts that execute on clone. A crafted `package.json` could trigger arbitrary code via `npm install` if anyone runs it. CVE-2025-48384 demonstrates that `git clone --recursive` itself has had arbitrary file write vulnerabilities.

**Do this instead:** Clone into isolated per-job temp directories. Remove `.git/hooks/` immediately after clone. Never run `npm install`, `make`, or any build commands in the cloned repo. Keep cloner process in a minimal Docker container with no network access beyond GitHub. Use `--no-recurse-submodules` unless specifically needed.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub OAuth | OAuth 2.0 authorization code flow; store access token encrypted in session/DB | Use `repo` scope for private repo access; GitHub Apps preferred over OAuth Apps for fine-grained permissions |
| GitHub API | REST API v3 or GraphQL for repo listing and metadata; git clone via HTTPS with token | Format: `https://x-access-token:<token>@github.com/org/repo.git` |
| Anthropic API | User-provided API key passed through LLM adapter; streaming responses preferred | Requires prompt adaptation — Claude uses `<thinking>` tags; token counting API available |
| OpenAI API | Same adapter interface; OpenAI-compatible format is the de facto standard; use for GPT-4o | Streaming via `stream: true`; token counting differs from Anthropic |
| Gemini API | Google AI SDK or OpenAI-compatible endpoint; context windows differ significantly | Gemini 1.5 Pro has 1M token context — useful for large codebase phases |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend ↔ API | REST + SSE over HTTPS | No WebSockets needed; SSE handles all streaming needs |
| API ↔ Worker | BullMQ job queue (Redis) | No direct calls; queue is the only coupling point |
| Worker ↔ API (progress) | Redis pub/sub or BullMQ QueueEvents | Worker publishes; API subscribes and forwards to SSE client |
| Worker ↔ LLM Providers | HTTPS to provider APIs; user key injected at call time | Keys never leave the worker process; never go to frontend |
| Worker ↔ Object Storage | S3 SDK or local filesystem writes | Phase outputs written here; API reads from here for report serving |
| Worker ↔ PostgreSQL | Direct DB connection via ORM | Phase state checkpointing, findings persistence |

---

## Build Order (Dependencies Between Components)

The component dependencies create a natural build sequence:

**Phase 1 — Foundation (no dependencies)**
- PostgreSQL schema (users, audits, phases, findings tables)
- Redis setup
- Authentication (GitHub OAuth + session management)

**Phase 2 — Depends on Phase 1**
- Repo browser (GitHub API calls, requires auth)
- Repo sandbox / cloner (requires auth tokens, requires DB for job records)
- LLM adapter (standalone, no dependencies — build early to unblock everything)

**Phase 3 — Depends on Phase 2**
- BullMQ job queue wiring (requires Redis + DB)
- Audit orchestrator skeleton (requires LLM adapter + sandbox cloner)
- Phase 0 implementation (requires orchestrator)

**Phase 4 — Depends on Phase 3**
- Phases 1-10 implementations (require orchestrator pattern established in Phase 3)
- SSE progress endpoint (requires job queue + Redis pub/sub)
- Live progress frontend (requires SSE endpoint)

**Phase 5 — Depends on Phase 4**
- Phase 11 report generation (requires all phases 0-10 complete)
- Report storage + serving (requires object storage)
- In-app dashboard rendering (requires structured findings in DB)

**Phase 6 — Depends on Phase 5**
- Audit history (requires completed audit records)
- Phase 12 comparison (requires two audit records for same repo)
- Downloadable reports (requires report storage)

**Critical path:** Auth → Repo access → Cloner → LLM adapter → Orchestrator → Phases → Reports. Every component in this chain is a dependency of everything after it. The LLM adapter is the highest-leverage early investment.

---

## Sources

- BullMQ Architecture: https://docs.bullmq.io/guide/architecture
- BullMQ Events (Redis Streams): https://docs.bullmq.io/guide/events
- FastAPI + Background Tasks + SSE pattern: https://dev.to/zachary62/build-an-llm-web-app-in-python-from-scratch-part-4-fastapi-background-tasks-sse-21g4
- Web-Queue-Worker architecture: https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/web-queue-worker
- Docker sandbox for code analysis (security model): https://www.docker.com/blog/docker-sandboxes-a-new-approach-for-coding-agent-safety/
- Trail of Bits Claude Code devcontainer (sandbox patterns): https://github.com/trailofbits/claude-code-devcontainer
- CVE-2025-48384 git clone vulnerability: https://securitylabs.datadoghq.com/articles/git-arbitrary-file-write/
- LiteLLM multi-provider gateway: https://medium.com/@mrutyunjaya.mohapatra/litellm-a-unified-llm-api-gateway-for-enterprise-ai-de23e29e9e68
- SSE for LLM streaming (scale): https://upstash.com/blog/sse-streaming-llm-responses
- GitHub OAuth private repo cloning: https://github.com/orgs/community/discussions/36463
- Docker security best practices: https://betterstack.com/community/guides/scaling-docker/docker-security-best-practices/

---
*Architecture research for: CodeAudit Web — codebase audit/analysis webapp*
*Researched: 2026-03-21*
