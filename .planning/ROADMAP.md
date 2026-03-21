# Roadmap: CodeAudit Web

## Overview

CodeAudit Web ships in five phases that follow hard architectural dependencies. User identity and encrypted API key storage must exist before any repo access or LLM calls are possible. Sandbox infrastructure and audit configuration build on that identity layer. The audit engine — the core product value — runs once the plumbing is verified. The in-app dashboard renders findings after audits produce data. History and comparison arrive last because they require at least two completed audit records to be meaningful.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Auth, GitHub OAuth, encrypted BYOK key storage, and database schema
- [ ] **Phase 2: Audit Setup** - Repo browser, sandbox infrastructure, audit configuration UI, and cost estimate gate
- [ ] **Phase 3: Audit Engine** - BullMQ worker, Phase 0 bootstrap, Phases 1-11 execution, live progress, and budget controls
- [ ] **Phase 4: Results Dashboard** - In-app findings dashboard, severity filtering, report views, and downloads
- [ ] **Phase 5: History and Comparison** - Audit history list, past result viewing, and delta comparison reports

## Phase Details

### Phase 1: Foundation
**Goal**: Users can securely authenticate, connect their GitHub account, and store encrypted LLM API keys ready for use
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-06, AUTH-07, AUTH-08
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password and sign in on subsequent visits with session persisting across browser refresh
  2. User can sign in via GitHub SSO as an alternative to email/password
  3. User can connect their GitHub account via OAuth to authorize repo access (GitHub App with Contents: read per-repo scope)
  4. User can add, update, and delete stored API keys for Anthropic, OpenAI, and Gemini (stored AES-256-GCM encrypted)
  5. User can sign out from any page and session is terminated
**Plans**: Planned (3 plans)

Plans:
- [x] 01-01: Project scaffolding — monorepo setup (apps/web, packages/db, packages/audit-engine, packages/llm-adapter, packages/repo-sandbox, worker/), Next.js 16, Drizzle + Neon, Docker Compose dev environment → `01-01-PLAN.md`
- [ ] 01-02: Auth flows — Auth.js v5 GitHub SSO only, database session strategy, session middleware, guided onboarding flow → `01-02-PLAN.md`
- [ ] 01-03: GitHub App + API key management — GitHub App installation flow, encrypted BYOK key storage (AES-256-GCM), key CRUD UI, validation on entry → `01-03-PLAN.md`

### Phase 2: Audit Setup
**Goal**: Users can browse their GitHub repos, configure an audit, review a cost estimate, and submit it for execution
**Depends on**: Phase 1
**Requirements**: AUTH-05, CONF-01, CONF-02, CONF-03, CONF-04, CONF-05, EXEC-01
**Success Criteria** (what must be TRUE):
  1. User can browse and search personal and org repos from their connected GitHub account and select one for auditing
  2. User can select audit type (full, security-only, team & collaboration, code quality) and audit depth (quick scan, deep audit)
  3. User can select which stored LLM provider key to use for the audit
  4. User sees a pre-audit cost estimate (tokens and dollars) before any spend occurs and must confirm before the audit starts
  5. Backend clones the selected repo into a sandboxed container (read-only, no push, no network to production URLs, hooks disabled)
**Plans**: TBD

Plans:
- [ ] 02-01: Repo browser — GitHub API integration (list/search repos), repo selection UI, audit configuration form (type, depth, provider)
- [ ] 02-02: Sandbox infrastructure — per-job ephemeral container clone (--no-local, --config core.hooksPath=/dev/null, --no-recurse-submodules, --network=none, non-root), garbage collector, cost estimate heuristic, confirmation gate UI

### Phase 3: Audit Engine
**Goal**: A submitted audit runs end-to-end — Phase 0 through Phase 11 — with live per-phase progress visible to the user and budget controls active throughout
**Depends on**: Phase 2
**Requirements**: EXEC-02, EXEC-03, EXEC-04, EXEC-05, EXEC-06, EXEC-07, EXEC-08, EXEC-09, PROG-01, PROG-02, PROG-03, PROG-04, PROG-05, COST-02, COST-03
**Success Criteria** (what must be TRUE):
  1. User sees a live simplified progress view (current phase, overall percentage) while their audit runs, and can expand it to see per-phase status with findings count
  2. User sees real-time token usage and estimated cost updating after each phase completes
  3. User can leave the page mid-audit and return to find current progress still displayed
  4. User receives a notification when the audit completes
  5. User can cancel a running audit at any time and sees the cost incurred up to cancellation
  6. Budget warning appears if the audit is consuming significantly more tokens than estimated
  7. Audit respects the selected audit type (phase skipping) and depth (sampling for quick scan)
**Plans**: TBD

Plans:
- [ ] 03-01: BullMQ worker skeleton — job queue wiring (enqueue/dequeue), phase state machine with DB checkpointing, Redis pub/sub progress events, SSE endpoint in Next.js, basic progress UI
- [ ] 03-02: LLM adapter + Phase 0 — unified Anthropic/OpenAI/Gemini interface (Vercel AI SDK 6), Phase 0 bootstrap (stack detection, repo sizing, contributor detection), end-to-end pipeline smoke test
- [ ] 03-03: Phases 1-11 implementation — all audit phases as structured LLM calls, audit type phase-skipping logic, depth sampling for quick scan, Phase 11 HTML/markdown report generation, token usage tracking, budget warning, cancel, cleanup

### Phase 4: Results Dashboard
**Goal**: Users can view their completed audit findings in-app with scores, severity breakdown, and download the full reports
**Depends on**: Phase 3
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, COST-01
**Success Criteria** (what must be TRUE):
  1. User can view the in-app audit dashboard showing overall health score, severity breakdown chart, and full findings list with file paths, line numbers, evidence, and remediation suggestions
  2. User can filter and sort findings by severity (Critical, High, Medium, Low, Info)
  3. User can switch between executive/management report view and technical report view within the app
  4. User can download a zip containing full HTML dashboards and markdown reports
  5. User sees total tokens used and total cost displayed prominently on the completed audit page
**Plans**: TBD

Plans:
- [ ] 04-01: Results dashboard — findings list (severity filter/sort), score display, Recharts charts, executive vs. technical report tabs, IDOR protection on all audit queries
- [ ] 04-02: Report download + cost summary — zip generation (HTML + markdown reports), download endpoint, total cost/token summary on completion page

### Phase 5: History and Comparison
**Goal**: Users can review all past audits for any repo and generate a delta comparison report when two or more audits exist
**Depends on**: Phase 4
**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04
**Success Criteria** (what must be TRUE):
  1. User can view a paginated list of all past audits per repo showing date, type, depth, and overall score
  2. User can navigate to any past audit and see its full results dashboard
  3. When a repo has two or more audits, user can generate a comparison report showing what improved, degraded, or stayed the same
  4. Comparison report highlights specific findings that were resolved or newly introduced since the previous audit
**Plans**: TBD

Plans:
- [ ] 05-01: Audit history — paginated history list per repo (date, type, depth, score), past audit result navigation, inline delta summary in history list
- [ ] 05-02: Comparison report — delta query (resolved vs. new findings diff), comparison UI (score delta, finding status changes), comparison report generation

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/3 | In Progress|  |
| 2. Audit Setup | 0/2 | Not started | - |
| 3. Audit Engine | 0/3 | Not started | - |
| 4. Results Dashboard | 0/2 | Not started | - |
| 5. History and Comparison | 0/2 | Not started | - |
