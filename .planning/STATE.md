---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Completed 03-results-cost-02-PLAN.md
last_updated: "2026-03-22T09:45:33.269Z"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 8
  completed_plans: 8
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-22 after local-first pivot)

**Core value:** Anyone can run a thorough codebase audit on any local folder without CLI setup — just open the app, pick a folder, and run.
**Current focus:** Phase 03 — results-cost

## Current Position

Phase: 4
Plan: Not started

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01-foundation P01 | 8 | 3 tasks | 19 files |
| Phase 01-foundation P02 | 5 | 2 tasks | 13 files |
| Phase 01-foundation P03 | 7 | 3 tasks | 15 files |
| Phase 02-audit-setup P01 | 8 | 3 tasks | 19 files |
| Phase 02-audit-setup P02 | 5 | 2 tasks | 15 files |
| Phase 02-audit-setup P03 | 3 | 2 tasks | 6 files |
| Phase 03-results-cost P01 | 15 | 3 tasks | 10 files |
| Phase 03-results-cost P02 | 8 | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pivot 2026-03-22]: Architecture changed from cloud webapp (GitHub OAuth) to local-first (localhost server, local folder selection). GitHub OAuth and GitHub App code from old Phase 1 is discarded.
- [Pivot 2026-03-22]: Reusable from old Phase 1 — Next.js scaffold, Drizzle ORM, dark mode UI, AES-256-GCM API key encryption, maskedKey pattern, microdollar integer cost storage, AuditFindings JSONB schema shape
- [Pivot 2026-03-22]: Safety model is filesystem-level: chmod -R a-w (read-only lock) + git remote set-url --push origin no_push (git push block) — enforced programmatically before audit starts
- [Pivot 2026-03-22]: All audit output goes to ~/audit-{repo-name}/ — never inside the target folder
- [Pivot 2026-03-22]: BYOK with Anthropic, OpenAI, Gemini from day one — provider-tuned prompts required for audit phases
- [Phase 01-foundation]: SQLite (better-sqlite3) via Drizzle ORM replaces Neon+PostgreSQL — local file at ~/.codeaudit/codeaudit.db, WAL mode
- [Phase 01-foundation]: No-auth model: middleware is pass-through, setup_complete appSettings flag guards app routes
- [Phase 01-foundation]: CLI launcher auto-generates ENCRYPTION_KEY persisted to ~/.codeaudit/.env, spawns next dev, polls /api/health, then opens browser
- [Phase 01-foundation]: git push block runs BEFORE chmod in lockFolder (CRITICAL ORDER) — once chmod -R a-w runs, .git/config becomes unwritable
- [Phase 01-foundation]: FolderPicker accepts value: string[] for multi-folder support per D-04, uses useTransition + validateFolder server action for sub-1-second validation
- [Phase 01-foundation]: Setup wizard reuses addApiKey from Plan 01, calls completeSetup to write setup_complete=true, then redirects to dashboard
- [Phase 01-foundation]: Server component wrapper + client form for New Audit page: page.tsx async server component loads keys, new-audit-form.tsx is client component — consistent with api-keys page pattern
- [Phase 01-foundation]: collectFolderStats wrapped in server action (folder-stats.ts): Node.js fs API can't run in browser; thin server action wrapper enables client form to call it
- [Phase 01-foundation]: startAudit enforces CRITICAL ORDER: createAuditOutputDir BEFORE lockFolder — once chmod -R a-w runs, .git/config becomes unwritable
- [Phase 02-audit-setup]: Use LanguageModelV1 from @ai-sdk/provider@1.1.3 — providers return V1 at runtime, ai@6 internal handling works for both
- [Phase 02-audit-setup]: unlockFolderLocal inlined in orchestrator (not imported from apps/web) to avoid cross-package dependency
- [Phase 02-audit-setup]: Phase runner registry pattern: registerPhaseRunner() allows plan 02 to add phase implementations without modifying orchestrator
- [Phase 02-audit-setup]: shared.ts helper module created for getRepoContext/getModel/headLimit — avoids repeating boilerplate across 11 phase files
- [Phase 02-audit-setup]: Phase 0 uses generateObject with RepoContextSchema (not PhaseOutputSchema) — produces repo context, not AuditFindings
- [Phase 02-audit-setup]: Phase 11 uses generateText (not generateObject) — HTML output is unstructured string, not typed JSON
- [Phase 02-audit-setup]: SSE stream polls SQLite every 500ms directly (no Redis pub/sub) — sufficient for local-first single-user app
- [Phase 02-audit-setup]: State replay on reconnect: server emits all phase rows from DB immediately on connect, not just deltas
- [Phase 02-audit-setup]: PHASE_NAMES duplicated in progress-view.tsx client bundle — audit-engine is server-only package
- [Phase 03-results-cost]: Recharts installed directly (not via Shadcn chart CLI) since recharts is the underlying library — avoids adding chart.tsx wrapper overhead
- [Phase 03-results-cost]: ResultsView accepts typed AuditRow/PhaseRow inline types instead of importing Drizzle select type — avoids server-module leak into client bundle
- [Phase 03-results-cost]: View Results uses <a href> not router.push — intentional full navigation to trigger fresh server component load
- [Phase 03-results-cost]: Puppeteer pdf() returns Uint8Array in v24+ — wrapped with Buffer.from() for BodyInit compatibility
- [Phase 03-results-cost]: iframe sandbox uses allow-same-origin allow-scripts — safe at localhost, needed for Phase 11 inline chart JS
- [Phase 03-results-cost]: Readable.toWeb cast uses import('node:stream').Readable type to satisfy TypeScript (not NodeJS.ReadableStream)

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2 (Audit Engine): Prompt engineering across 3 providers for 13 analytical phases is high-risk. Plan Phase 2 with a golden test repo evaluation approach before declaring engine complete.
- Phase 2: Prompt injection via repo file contents must be handled — wrap repo content in explicit DATA BLOCK framing in all LLM prompts.

## Session Continuity

Last session: 2026-03-22T09:41:23.953Z
Stopped at: Completed 03-results-cost-02-PLAN.md
Resume file: None
