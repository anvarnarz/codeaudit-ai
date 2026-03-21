# Project Research Summary

**Project:** CodeAudit Web
**Domain:** LLM-powered codebase audit webapp (GitHub integration, BYOK, multi-provider, async pipeline)
**Researched:** 2026-03-21
**Confidence:** HIGH

## Executive Summary

CodeAudit Web is a full-stack SaaS webapp that connects to private GitHub repositories via OAuth and runs a 13-phase LLM-powered audit pipeline, delivering holistic narrative findings rather than the rule-based lint alerts produced by competitors like SonarQube, DeepSource, and Codacy. The recommended approach is a Web-Queue-Worker architecture: a Next.js 16 (App Router) frontend and thin API layer, a BullMQ + Redis job queue, and a dedicated long-running Node.js worker process that orchestrates the 13 audit phases and calls Anthropic/OpenAI/Gemini via the Vercel AI SDK. This split is non-negotiable — audits run 30 minutes to 4+ hours and will be killed by any serverless timeout. The worker is the core product; the frontend is the delivery wrapper.

The biggest competitive differentiator is the BYOK (Bring Your Own Key) model combined with transparent cost tracking — every competitor charges opaque per-seat or per-scan fees, while this product passes AI costs directly to the user at provider rates. The second differentiator is holistic narrative output: LLM analysis produces architectural context and natural-language explanations that rule-based tools cannot. These two differentiators must be front-and-center in the v1 feature set; everything else is table stakes or deferred.

The primary risks are security risks, not technical ones. Cloning arbitrary GitHub repositories without full container isolation is an active RCE vector (CVE-2024-32002, CVE-2025-48384). Storing BYOK LLM API keys without application-layer encryption is a high-severity breach liability. Prompt injection via malicious repo contents is the OWASP LLM Top 10 #1 risk for this exact use case. All three must be treated as launch blockers, not post-launch hardening. The product's trust story — read-only, sandboxed, secure — must be technically verifiable from day one.

---

## Key Findings

### Recommended Stack

The recommended stack is Next.js 16 (App Router) + TypeScript + Neon (serverless Postgres) + Drizzle ORM + Auth.js v5 + Vercel AI SDK 6 + BullMQ 5 + Redis + Tailwind CSS 4 + Shadcn/ui. This combination has strong mutual compatibility, is Vercel-native for the frontend, and is self-hostable for the worker. The most important architectural boundary in the stack is that BullMQ workers run as persistent Node.js processes outside Next.js — deployed to Railway or Fly.io — while the Next.js app deploys to Vercel. Redis (Upstash) bridges them.

The Vercel AI SDK 6 is the correct LLM abstraction: it provides a unified interface for Anthropic, OpenAI, and Gemini, handles streaming and structured output, and is maintained by Vercel with active support for all three providers. Provider-specific SDK packages (`@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`) are the correct imports. simple-git (not nodegit, not isomorphic-git) is the correct Git client for the worker — token-in-URL cloning pattern, no native binding issues.

**Core technologies:**
- **Next.js 16 (App Router):** Full-stack React framework — RSC + native SSE streaming, Vercel-native deployment
- **TypeScript 5.x:** Non-negotiable for typed audit schemas, multi-LLM response parsing, and structured phase output
- **Neon (serverless Postgres) + Drizzle ORM:** Database — Neon's serverless-native, branching per PR; Drizzle is SQL-first and lean for serverless
- **Auth.js v5:** GitHub OAuth + session management — database session strategy (not JWT), access_token stored server-side only
- **Vercel AI SDK 6:** Multi-LLM abstraction — single API for Anthropic, OpenAI, Gemini; write prompt logic once
- **BullMQ 5 + Redis:** Async job queue — required for 30-min to 4-hour audits; workers run outside Next.js as persistent processes
- **simple-git 3.x:** Git cloning in the worker — token-in-URL pattern, wraps system git, no segfault risks
- **Tailwind CSS 4 + Shadcn/ui:** Styling + UI — de facto standard; Shadcn includes Recharts-powered chart components for dashboards

**Critical version constraints:**
- Next.js 16 requires React 19 (not React 18)
- BullMQ 5 requires ioredis 5 (not the `redis` package)
- Auth.js v5 renamed `middleware.ts` to `proxy.ts` in Next.js 16 — follow migration guide
- AI SDK 6 requires `npx @ai-sdk/codemod v6` if upgrading from v5

### Expected Features

The feature set divides cleanly into: (1) table stakes that must ship for the product to feel credible, (2) differentiators that justify why users choose this over existing tools, and (3) anti-features to avoid building.

**Must have (table stakes) — all P1 for v1:**
- GitHub OAuth + repository browser — private repo access without this is blocked
- User authentication + audit history — a product that forgets is not trusted
- Long-running audit progress indicator — phase-by-phase status, silence means abandonment
- In-app results dashboard with findings, scores, and severity breakdown
- Downloadable reports (HTML + markdown zip) — required for manager-facing sharing
- Security findings section and code quality metrics — expected by every user coming from any competitor
- Multi-language detection — surface in UI; Phase 0 bootstrap already handles this
- Findings severity classification (Critical/High/Medium/Low)

**Should have (differentiators) — core competitive advantage:**
- BYOK (Anthropic, OpenAI, Gemini) with transparent per-audit cost display
- Pre-audit cost estimate with explicit confirmation gate before spend begins
- Real-time token usage display during audit progress
- Holistic narrative findings (LLM analysis vs. rule-based lint alerts)
- Audit type selection (full, security-only, team, code quality)
- Audit depth selection (quick scan vs. deep audit) — no competitor exposes this tradeoff
- Phase-by-phase live progress with simplified default view and expandable detail
- Sandboxed read-only clone execution — the security guarantee that enables trust

**Defer to v1.x (add after validation):**
- Audit comparison / delta report — requires structured result storage from day one even if UI ships later
- Shareable read-only report links
- Scheduled re-run reminders

**Defer to v2+ (anti-features for now):**
- Automated fix / PR generation — destroys the read-only safety model; never build in v1
- Continuous monitoring (webhook-triggered per push) — conflicts with BYOK cost model
- GitLab/Bitbucket support — design clone/auth layer to be provider-agnostic but ship GitHub-only
- Self-hosted deployment — premature ops burden
- IDE extension — separate release channels, high maintenance

**Critical dependency decision:** Audit comparison requires structured result storage (per-finding JSON with phase scores), not just HTML/markdown blobs. This schema decision must be made in Phase 1 even if the comparison UI ships later.

### Architecture Approach

The architecture follows the Web-Queue-Worker pattern with four distinct layers: Next.js frontend (auth, repo browser, dashboard, SSE progress display), thin HTTP API layer (Next.js Route Handlers for most endpoints), BullMQ + Redis job queue as the sole coupling point between the API and worker, and a dedicated long-running worker process that runs the 13-phase audit orchestrator. Progress flows from worker to client via Redis pub/sub → SSE (not WebSockets — one-directional, simpler, firewall-friendly). The audit orchestrator models phases as a state machine with per-phase checkpointing to enable resume-from-last-phase after crashes, preventing full re-runs and double-billing users.

The codebase should be a monorepo with `apps/web` (Next.js), `packages/audit-engine` (13-phase orchestrator, no HTTP dependency), `packages/llm-adapter` (unified multi-provider interface), `packages/repo-sandbox` (clone + isolation), `packages/db` (Drizzle schema), and `worker/` (BullMQ consumer). The audit engine is isolated as a package because it is the core product value — testable independently, reusable if the transport layer changes.

**Major components and responsibilities:**
1. **Frontend (Next.js App Router):** Auth flows, repo selection, audit configuration, live SSE progress display, in-app report rendering, history list
2. **HTTP API (Next.js Route Handlers):** Thin REST layer — receive requests, enqueue jobs, serve SSE streams, proxy report data; never executes audits directly
3. **BullMQ Job Queue (Redis):** Durable async submission, retry, priority, phase-level progress events; the only coupling between API and worker
4. **Audit Worker (Node.js process):** Dequeues jobs, runs repo cloner, orchestrates 13-phase state machine, calls LLM adapter, emits progress to Redis pub/sub
5. **LLM Adapter (packages/llm-adapter):** Unified interface over Anthropic/OpenAI/Gemini; all phase code calls `llm.complete(prompt)` — never imports provider SDK directly
6. **Repo Sandbox (packages/repo-sandbox):** git clone with hook disablement, ephemeral per-job workspace, cleanup — security boundary
7. **PostgreSQL (Neon):** Users, audits, phase state, structured findings, API key ciphertext
8. **Redis (Upstash):** BullMQ broker, progress pub/sub channel, job state
9. **Object Storage (S3/local):** Phase output files, generated HTML/markdown reports

**Critical path for build order:** Auth → Repo access → LLM Adapter → Cloner/Sandbox → Orchestrator skeleton → Phase 0 → Phases 1-10 → Phase 11 reports → History/Comparison. The LLM adapter is the highest-leverage early investment — it unblocks every phase implementation.

### Critical Pitfalls

1. **Git Hook RCE via cloned repos** — Never run `git clone` on the host OS. Always run inside an isolated container with `--no-local`, `--config core.hooksPath=/dev/null`, `--no-recurse-submodules`, `--network=none`, and non-root user. Remove `.git/hooks/` immediately after clone. CVE-2024-32002 and CVE-2025-48384 are active vectors. This is a launch blocker.

2. **BYOK API key stored without application-layer encryption** — Use AES-256-GCM (node:crypto) with the master key in a secrets manager, not in `.env`. Transparent DB encryption is insufficient — it protects against disk theft, not compromised app credentials. Keys must never appear in logs, error messages, or API responses. Add a key scrubber middleware layer.

3. **Prompt injection via malicious repo contents** — Structure every LLM prompt with a privilege boundary: system instructions (trusted) vs. repo content (untrusted data, wrapped in explicit "DATA BLOCK" framing). Never allow the model to take actions — pure text output only. Log outputs for anomalous findings (suspiciously clean reports on complex codebases). OWASP LLM Top 10 #1 risk.

4. **Orphaned cloned repos and stuck jobs** — Use ephemeral container volumes (not host filesystem) so cleanup is handled by container runtime regardless of crash. Implement a garbage collector job that deletes stale clone directories independently of the worker process. For stuck jobs: BullMQ lock duration must be extended (5+ minutes) with frequent `job.updateProgress()` heartbeats for long-running phases; implement a sweeper that detects stale heartbeats and marks jobs failed.

5. **Multi-LLM prompt abstraction leakage** — Do not share a single prompt template across all three providers. Each provider (Claude, GPT-4o, Gemini) has different structured output APIs, context window behavior, and prompt sensitivity. Maintain provider-tuned variants for complex analytical tasks. Establish a golden test repo set and run it against all three providers before shipping multi-provider support.

6. **GitHub OAuth overprivilege** — Do not request the classic `repo` OAuth scope (grants read+write access to all repos). Use a GitHub App installation with `Contents: read` permission per-repo. Handle the 8-hour access token expiry with proactive refresh (before expiry, not on 401) with a concurrent-refresh lock to prevent race conditions.

7. **Token cost surprise** — Show a pre-audit cost estimate on the launch screen with explicit confirmation required. Display a running cost total updated after each phase using server-returned `usage` object token counts (not client-side estimates). This is table stakes for user trust with BYOK.

---

## Implications for Roadmap

Based on the dependency chain in ARCHITECTURE.md and the feature priorities in FEATURES.md, the build order is determined by hard dependencies: you cannot build the audit engine before the LLM adapter exists; you cannot build audit history before audits complete; comparison requires history. The architecture's own build order section maps cleanly to roadmap phases.

### Phase 1: Foundation — Auth, Database, and API Key Management

**Rationale:** Everything downstream depends on user identity and data persistence. GitHub OAuth must be working before any repo access is possible. BYOK key management must be correct before any LLM calls are made — fixing encryption after keys are stored is a high-recovery-cost incident.
**Delivers:** Working GitHub OAuth login, user session, encrypted BYOK key storage (Anthropic/OpenAI/Gemini), PostgreSQL schema (users, audits, phases, findings, api_keys tables with structured findings JSON columns), Docker Compose dev environment.
**Addresses:** User authentication (table stakes), LLM API key management (P1 differentiator)
**Avoids:** API key stored without application-layer encryption (Pitfall 3); OAuth token overprivilege — implement GitHub App from the start (Pitfall 6)
**Research flag:** SKIP — GitHub OAuth and AES-256-GCM key encryption are well-documented patterns; Auth.js v5 GitHub provider is production-stable.

### Phase 2: Repo Access and Sandbox Infrastructure

**Rationale:** The repo cloner is security-critical and must be validated before any user repos are processed. Container isolation cannot be retrofitted after the fact — it is the trust foundation the product is built on. The LLM adapter is also built here because it unblocks all subsequent phase implementations.
**Delivers:** GitHub repo browser (list/search repos via API), per-job ephemeral sandbox container (clone + hook disablement + network isolation + non-root), LLM adapter package (unified Anthropic/OpenAI/Gemini interface), garbage collector for orphaned clones.
**Addresses:** Repository browser (table stakes), sandboxed read-only clone execution (P1 must-have)
**Avoids:** Git hook RCE (Pitfall 1) — must test with a malicious hook before this phase is done; Orphaned cloned repos (Pitfall 4)
**Research flag:** CONSIDER — Container security hardening (Docker `--read-only`, `--network=none`, non-root user, `.git/hooks` removal) should be verified against current Docker security best practices during planning.

### Phase 3: Audit Engine Core — BullMQ Worker and Phase 0

**Rationale:** The BullMQ + Redis job queue is the architectural coupling point between the API and worker. Building the worker skeleton and the first phase (stack bootstrap / Phase 0) validates that the entire pipeline — job enqueue, worker dequeue, LLM call, phase output persistence, progress event emission — works end-to-end before the remaining 12 phases are built.
**Delivers:** BullMQ worker process (separate from Next.js), job enqueue/dequeue wiring, Phase 0 (stack detection + repo sizing), per-phase state machine with DB checkpointing, Redis pub/sub progress events, SSE streaming endpoint in Next.js, basic live progress UI.
**Addresses:** Phase progress tracking (P1), audit engine skeleton
**Avoids:** Running audit inside API server (Architecture Anti-Pattern 1); Orphaned jobs / stuck active state (Pitfall 5) — implement heartbeat and sweeper here
**Research flag:** SKIP — BullMQ Web-Queue-Worker pattern is well-documented; SSE with Redis pub/sub is a standard pattern with multiple reference implementations.

### Phase 4: Audit Engine — Phases 1-10 Implementation

**Rationale:** With the orchestrator pattern and state machine established in Phase 3, all remaining analysis phases can be built in sequence. Each phase follows the same contract: receive workspace path, call LLM adapter, persist output, emit progress event. The prompt design for each provider is the main engineering challenge here.
**Delivers:** All 13 audit phases implemented (architecture, dependencies, security, git archaeology, documentation, CI/CD, team dynamics, code quality, etc.), pre-audit cost estimate (token count heuristic from Phase 0 output), real-time token usage display per phase.
**Addresses:** Audit engine (all 13 phases) (P1), pre-audit cost estimate (P1), real-time token usage (P1), security findings section (table stakes), code quality metrics (table stakes), git archaeology (differentiator)
**Avoids:** Multi-LLM prompt abstraction leakage (Pitfall 8) — build provider-tuned variants; Sending entire repo to LLM at once (performance trap) — chunk by phase; Sequential phases that could be parallel (performance trap)
**Research flag:** NEEDS RESEARCH — Prompt engineering for each of the 13 phases across 3 providers (Claude/GPT-4o/Gemini) is the highest-risk area. Provider-specific structured output handling needs a golden test repo before shipping. Phase planning should include research on current best practices for multi-provider prompt design and context window management for large codebases.

### Phase 5: Audit Types, Depth Selection, and Report Generation

**Rationale:** Audit type (full, security-only, team, code quality) and depth selection (quick scan vs. deep audit) are implemented as phase-skipping logic in the orchestrator — they depend on the orchestrator being complete. Phase 11 report generation (HTML dashboards, executive vs. technical view) depends on all upstream phases being functional.
**Delivers:** Audit type selection UI and orchestrator logic (phase skipping), depth selection (quick scan = subset + sampling), Phase 11 report generation (executive HTML dashboard + technical HTML dashboard + markdown), downloadable report zip, pre-audit duration estimates by depth.
**Addresses:** Audit type selection (P1 differentiator), audit depth selection (P1 differentiator), downloadable reports (table stakes), executive vs. technical report split (differentiator)
**Avoids:** No estimated duration before starting (UX pitfall); Cost estimate buried in settings (UX pitfall)
**Research flag:** SKIP — Phase skipping logic and HTML report generation are standard patterns.

### Phase 6: In-App Dashboard, History, and Results Rendering

**Rationale:** The in-app dashboard and audit history require completed audit records to exist — they are downstream consumers of the data model established in Phase 1 and populated in Phases 3-5. Findings severity classification is applied at render time.
**Delivers:** In-app results dashboard (scores, charts via Recharts/Shadcn, findings list, severity breakdown), audit history list (paginated), markdown report rendering (react-markdown), IDOR protection on all audit queries, audit cancel functionality (halt LLM calls, show cost incurred).
**Addresses:** In-app results dashboard (P1 table stakes), audit history list (P1 table stakes), findings severity classification (table stakes), multi-language detection display
**Avoids:** IDOR on audit results — every audit query must scope to `user_id` with tests (Security mistake); Audit history shows only pass/fail — show delta summary inline (UX pitfall); Showing all 13 phases by default — simplified 4-stage view with expandable detail (UX pitfall)
**Research flag:** SKIP — Dashboard rendering, paginated history, and IDOR protection are standard patterns.

### Phase 7: Audit Comparison (Delta Report) — v1.x

**Rationale:** Comparison is a high-value differentiator but requires at least two completed audits for the same repo. The structured findings JSON schema (established in Phase 1) is what makes this possible — if it was implemented correctly, comparison is a query and a diff rendering. This ships as v1.x when users have run multiple audits.
**Delivers:** Delta report UI (score changes, new findings, resolved findings), comparison data model (diff between two audit result records), inline comparison summary in history list.
**Addresses:** Audit comparison / delta report (P2)
**Avoids:** Audit comparison requiring structured result storage — must validate schema was correctly designed in Phase 1 before building this phase
**Research flag:** SKIP — Structured diff queries and delta visualization are standard patterns given correct data model.

### Phase Ordering Rationale

- Auth must precede everything because user identity gates repo access, key storage, and audit ownership.
- Sandbox infrastructure must precede any real repo cloning — retrofitting isolation after processing user repos is not acceptable.
- LLM adapter is built in Phase 2 alongside the sandbox because it unblocks all 13 phase implementations.
- BullMQ wiring is Phase 3 because the job queue is the coupling point — the worker and API can only be connected once both exist.
- Phases 1-10 (audit engine content) come after the orchestrator scaffold is validated end-to-end with Phase 0.
- Report generation and UI come after the data exists.
- Comparison comes last because it requires two completed audits.

### Research Flags

**Needs research during planning:**
- **Phase 4 (Audit Engine — Phases 1-10):** Prompt engineering across 3 providers for 13 analytical phases is the highest-risk area. Needs research on: per-provider structured output format differences, context window chunking strategies for large codebases (>100k tokens), and current best practices for indirect prompt injection defense in analysis prompts.

**Standard patterns (skip research-phase):**
- **Phase 1:** GitHub OAuth + AES-256-GCM encryption — well-documented, production-stable.
- **Phase 2:** BullMQ Web-Queue-Worker — official documentation is comprehensive.
- **Phase 3:** SSE with Redis pub/sub — multiple reference implementations available.
- **Phase 5:** HTML report generation, phase skipping logic — standard patterns.
- **Phase 6:** Dashboard rendering, paginated queries, IDOR protection — standard patterns.
- **Phase 7:** Delta queries given correct data model — standard patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Most claims verified against official docs or current release notes; version compatibility matrix confirmed |
| Features | HIGH (competitors), MEDIUM (BYOK+LLM patterns) | Competitor feature comparison verified across multiple sources; BYOK multi-provider patterns are newer and less documented at scale |
| Architecture | HIGH | Web-Queue-Worker, SSE, and BullMQ patterns verified across multiple official and community sources; specific library choices MEDIUM pending implementation |
| Pitfalls | HIGH | Critical pitfalls (git hook RCE, prompt injection, key encryption) verified via official CVE disclosures and OWASP; operational pitfalls (orphaned jobs, cost surprise) verified via BullMQ issues and community reports |

**Overall confidence:** HIGH

### Gaps to Address

- **Provider-specific prompt quality parity:** Research confirms the risk (15-22% accuracy drop on non-primary providers), but no authoritative guidance exists on prompt adaptation strategies for analytical (vs. generative) tasks across Claude/GPT-4o/Gemini. Plan Phase 4 with a golden test repo evaluation sprint before declaring the audit engine complete.

- **GitHub App vs. OAuth App for v1:** Research recommends GitHub App (`Contents: read` per-repo) but implementation is more complex than classic OAuth App with `repo` scope. If GitHub App installation flow adds significant friction to the onboarding funnel, a pragmatic fallback is OAuth App with documented scope justification. This is a product-risk decision that should be made during requirements definition.

- **Object storage for report files:** Architecture recommends S3-compatible object storage for report HTML/markdown files. For v1 with low concurrency, local disk on the worker host may be sufficient with a migration path to S3. This decision affects the deployment topology and should be locked during Phase 1 schema design (whether report URLs are local paths or S3 keys).

- **Worker deployment platform:** Railway vs. Fly.io for the long-running worker container. Both support persistent processes; the choice affects cost structure and operational tooling. Not a blocker but should be decided before Phase 3 deployment configuration is written.

---

## Sources

### Primary (HIGH confidence)
- [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — version, App Router, React 19 requirement
- [Vercel AI SDK 6 release blog](https://vercel.com/blog/ai-sdk-6) — multi-provider API, MCP support, DevTools
- [Auth.js reference — authjs.dev](https://authjs.dev/reference/nextjs) — v5 stable, GitHub provider, database session strategy
- [BullMQ Architecture docs](https://docs.bullmq.io/guide/architecture) — queue patterns, lock duration, events
- [CVE-2024-32002](https://amalmurali.me/posts/git-rce/) — Git hook RCE via submodules
- [CVE-2025-48384](https://securitylabs.datadoghq.com/articles/git-arbitrary-file-write/) — Arbitrary file write on git clone
- [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) — indirect prompt injection, #1 LLM risk
- [GitHub token expiration and refresh](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens) — 8-hour expiry, refresh token rotation
- [GitHub fine-grained PATs](https://github.blog/security/application-security/introducing-fine-grained-personal-access-tokens-for-github/) — scope minimization

### Secondary (MEDIUM confidence)
- [Neon vs. Supabase — bytebase.com](https://www.bytebase.com/blog/neon-vs-supabase/) — serverless Postgres comparison
- [Drizzle vs. Prisma 2026 — makerkit.dev](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma) — ORM selection for serverless
- [BullMQ vs. Trigger.dev — GitHub Discussion](https://github.com/taskforcesh/trigger.dev/discussions/922) — self-hosted vs. managed workers
- [TanStack Query vs. SWR 2025 — Refine](https://refine.dev/blog/react-query-vs-tanstack-query-vs-swr-2025/) — download count comparison
- [Structured output comparison across LLM providers](https://www.glukhov.org/llm-performance/benchmarks/structured-output-comparison-popular-llm-providers) — cross-provider accuracy
- [BullMQ orphaned jobs issue #652](https://github.com/taskforcesh/bullmq/issues/652) — stuck active state documentation
- [Web-Queue-Worker architecture — Microsoft](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/web-queue-worker) — pattern reference

### Tertiary (LOW confidence — needs validation)
- [RepoAudit: LLM-Agent for Repository-Level Code Auditing (arXiv 2025)](https://arxiv.org/abs/2501.18160) — academic LLM code audit patterns; validation needed for production applicability
- [SSE vs. WebSockets pitfalls 2025](https://dev.to/haraf/server-sent-events-sse-vs-websockets-vs-long-polling-whats-best-in-2025-5ep8) — Nginx buffering notes; verify against current Nginx docs

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
