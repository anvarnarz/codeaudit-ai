# Roadmap: CodeAudit

## Overview

CodeAudit is a local-first codebase audit tool delivered in four phases. Phase 1 adapts the existing Next.js scaffold for the local-first model — stripping GitHub OAuth, wiring folder selection and safety enforcement, and completing API key management. Phase 2 builds the audit engine: the full 13-phase LLM pipeline running locally against the user's folder, with live progress and safe cleanup. Phase 3 surfaces the value — results dashboard, report downloads, cost summaries, and audit history. Phase 4 adds comparison reports when multiple audits exist for the same folder.

The existing Phase 1 code (Next.js scaffold, Drizzle ORM, dark mode UI, AES-256-GCM API key encryption) is carried forward. GitHub OAuth and GitHub App code is discarded. No work is re-done from scratch — the scaffold is the foundation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: App Shell & Configuration** - Users can open the app, manage API keys, select a local folder, and configure an audit ready to run
- [ ] **Phase 2: Audit Engine** - Users can run a full LLM-powered audit against a local folder and watch it execute in real time
- [ ] **Phase 3: Results & Cost** - Users can view findings dashboards, download reports, and see full cost breakdowns
- [ ] **Phase 4: History & Comparison** - Users can browse past audits and generate comparison reports across runs

## Phase Details

### Phase 1: App Shell & Configuration
**Goal**: Users can open the app at localhost, manage encrypted API keys for all three LLM providers, select a local folder to audit with safety enforcement, and configure an audit through to the cost-estimate confirmation gate
**Depends on**: Nothing (first phase — adapts existing Next.js/Drizzle/UI/encryption scaffold; removes GitHub OAuth)
**Requirements**: SETUP-01, SETUP-02, SETUP-03, SETUP-04, FOLD-01, FOLD-02, FOLD-03, FOLD-04, FOLD-05, CONF-01, CONF-02, CONF-03, CONF-04, CONF-05
**Success Criteria** (what must be TRUE):
  1. User runs one start command and opens the app in their browser at localhost with no errors
  2. User can add, label, update, and delete encrypted API keys for Anthropic, OpenAI, and Gemini — each key is validated against the provider via a test API call before being saved
  3. User can select a local folder via folder picker or path input, and the app locks it read-only and blocks git push before the audit begins
  4. User can choose audit type (full / security-only / team & collaboration / code quality), depth (quick scan / deep audit), and which stored API key to use
  5. User sees a pre-audit cost estimate and can confirm to proceed or go back to reconfigure
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Strip GitHub OAuth/Auth.js/Neon, migrate to SQLite, adapt sidebar/layout, npx CLI launcher
- [x] 01-02-PLAN.md — Folder safety service (chmod/git-push-block), validateFolder action, FolderPicker component, first-time setup wizard
- [x] 01-03-PLAN.md — Audit type cards, depth toggle, model selector, live cost estimate, confirm dialog — complete New Audit page

### Phase 2: Audit Engine
**Goal**: A configured audit runs end-to-end — Phase 0 bootstrap through Phase 11 report generation — with live per-phase progress visible in the browser, real-time cost tracking, and safe folder cleanup on completion, cancellation, or failure
**Depends on**: Phase 1
**Requirements**: EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05, EXEC-06, EXEC-07, EXEC-08, EXEC-09, PROG-01, PROG-02, PROG-03, PROG-04, PROG-05
**Success Criteria** (what must be TRUE):
  1. User starts an audit and sees a simplified progress view with the current phase name and overall percentage
  2. User can expand the progress view to see phase-by-phase status and findings count per phase as they accumulate
  3. User sees real-time token usage and estimated cost updating after each phase completes
  4. User can leave the browser tab and return to find progress still accurately shown (state persists server-side on localhost)
  5. User can cancel a running audit at any time — the folder is unlocked and the partial cost incurred is shown
**Plans**: TBD

Plans:
- [ ] 02-01: Audit orchestrator — Phase 0 bootstrap (stack detection, repo sizing, contributor detection), LLM adapter for all three providers, phase state machine with checkpointing, output to audit directory
- [ ] 02-02: Phases 1-10 implementation — all audit phases as structured LLM calls, audit type phase-skipping, depth sampling for quick scan, prompt injection safeguards
- [ ] 02-03: Phase 11 HTML report generation, live progress UI (SSE), cancel with unlock, folder cleanup on completion/failure, budget warning on token overrun

### Phase 3: Results & Cost
**Goal**: Users can view a rich in-app findings dashboard, download full audit artifacts, and see a complete cost summary after every audit
**Depends on**: Phase 2
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, COST-01, COST-02, COST-03
**Success Criteria** (what must be TRUE):
  1. User can view the in-app dashboard showing overall health score, severity breakdown, and the full findings list with file paths, line numbers, evidence, and remediation suggestions
  2. User can filter and sort findings by severity (Critical, High, Medium, Low, Info) and switch between executive and technical report views
  3. User can download all audit artifacts — HTML dashboards and markdown reports — as a single zip file
  4. User sees total tokens used and total cost after an audit completes, and a budget warning if token usage significantly exceeded the estimate during the run
**Plans**: TBD

Plans:
- [ ] 03-01: In-app results dashboard — findings list with filter/sort, score display, severity chart, executive vs. technical report tabs
- [ ] 03-02: Report download (zip of HTML + markdown), cost/token summary on completion page, budget warning display

### Phase 4: History & Comparison
**Goal**: Users can browse all past audits for any folder and generate a delta comparison report when two or more audits exist for the same folder
**Depends on**: Phase 3
**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04
**Success Criteria** (what must be TRUE):
  1. User can view a list of all past audits per folder showing date, type, depth, and overall health score
  2. User can open any past audit and view its full findings dashboard
  3. When a folder has two or more audits, user can generate a comparison report showing score changes, resolved findings, and newly introduced findings
  4. Comparison report highlights specific findings that were fixed or regressed since the previous audit
**Plans**: TBD

Plans:
- [ ] 04-01: Audit history list (per-folder, date/type/depth/score), past audit result viewer, inline delta summary in history list
- [ ] 04-02: Comparison report — delta query (resolved vs. new findings diff), comparison UI with score changes and finding status

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. App Shell & Configuration | 1/3 | In Progress|  |
| 2. Audit Engine | 0/3 | Not started | - |
| 3. Results & Cost | 0/2 | Not started | - |
| 4. History & Comparison | 0/2 | Not started | - |
