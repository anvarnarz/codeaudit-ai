---
phase: 02-audit-setup
plan: 03
subsystem: ui
tags: [sse, server-sent-events, progress, cancel, streaming, next-app-router, drizzle, sqlite]

# Dependency graph
requires:
  - phase: 02-audit-setup-01
    provides: audit orchestrator with runAudit, DB schema for audits/auditPhases, folder lock/unlock
  - phase: 02-audit-setup-02
    provides: phase runner implementations writing to auditPhases table, token tracking
provides:
  - SSE stream endpoint GET /api/audit/[id]/stream — polls DB every 500ms, replays state on reconnect
  - Cancel endpoint POST /api/audit/[id]/cancel — sets audit to cancelled for engine polling
  - cancelAudit and resumeAudit Server Actions
  - /audit/[id] progress page with live ProgressView client component
  - /audit/[id]/queued redirects to /audit/[id]
affects: [03-results, any phase building audit results dashboard or audit detail pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SSE via ReadableStream with setInterval polling SQLite (no Redis/BullMQ needed for local-first)
    - EventSource in client useEffect with auto-reconnect; server replays full DB state on connect
    - Server Action (cancelAudit) delegates to internal API route for cancel logic
    - PHASE_NAMES constant duplicated in client bundle (avoids server import of audit-engine in browser)

key-files:
  created:
    - apps/web/app/api/audit/[id]/stream/route.ts
    - apps/web/app/api/audit/[id]/cancel/route.ts
    - apps/web/actions/audit-control.ts
    - apps/web/app/(app)/audit/[id]/page.tsx
    - apps/web/app/(app)/audit/[id]/progress-view.tsx
  modified:
    - apps/web/app/(app)/audit/[id]/queued/page.tsx

key-decisions:
  - "SSE stream polls SQLite every 500ms directly (no Redis pub/sub) — sufficient for local-first single-user app"
  - "State replay on reconnect: server emits all phase rows from DB immediately on connect, not just deltas"
  - "5-minute safety timeout on SSE streams for abandoned connections (AbortSignal unavailable in ReadableStream start)"
  - "PHASE_NAMES duplicated in progress-view.tsx client bundle — audit-engine is server-only package"

patterns-established:
  - "SSE Route Handler pattern: ReadableStream + setInterval polling DB, close on terminal status"
  - "Client EventSource pattern: useEffect with cleanup, onmessage dispatches to phase/audit state maps"

requirements-completed: [PROG-01, PROG-02, PROG-03, PROG-04, PROG-05, EXEC-08, EXEC-09]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 02 Plan 03: Live Progress UI and SSE Plumbing Summary

**SSE stream endpoint polling SQLite every 500ms with state replay on reconnect, cancel endpoint, ProgressView client component with phase-by-phase expandable detail and cancel button at /audit/[id]**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-22T08:51:38Z
- **Completed:** 2026-03-22T08:54:11Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- SSE stream at /api/audit/[id]/stream: polls audits + auditPhases tables every 500ms, emits `phase` and `audit` typed events, replays completed state immediately on connect (tab reconnect support), closes on terminal status
- Cancel endpoint at POST /api/audit/[id]/cancel: sets audit status to cancelled in DB for engine to poll between phases; Server Actions cancelAudit/resumeAudit for client use
- Progress page at /audit/[id]: server component auto-starts engine if queued, renders ProgressView with live SSE data, expandable 12-phase detail with status icons/findings counts, running token/cost display, cancel button

## Task Commits

1. **Task 1: SSE stream endpoint + cancel endpoint + Server Actions** - `d4e0253` (feat)
2. **Task 2: Progress page + ProgressView client component** - `1e3ce4b` (feat)

**Plan metadata:** _(pending final commit)_

## Files Created/Modified

- `apps/web/app/api/audit/[id]/stream/route.ts` - SSE GET handler, 500ms DB polling, event replay, terminal close
- `apps/web/app/api/audit/[id]/cancel/route.ts` - POST cancel handler setting audit status to cancelled
- `apps/web/actions/audit-control.ts` - cancelAudit and resumeAudit Server Actions
- `apps/web/app/(app)/audit/[id]/page.tsx` - Server component: load audit, auto-start engine, render ProgressView
- `apps/web/app/(app)/audit/[id]/progress-view.tsx` - Client component: EventSource SSE consumer, progress bar, phase detail, cancel button
- `apps/web/app/(app)/audit/[id]/queued/page.tsx` - Updated to redirect to /audit/[id]

## Decisions Made

- SSE stream polls SQLite directly every 500ms — no Redis pub/sub needed for local-first single-user architecture
- State replay on reconnect: server emits ALL phase rows from DB immediately on connect (not just new events), so reconnecting clients always see accurate state without client-side persistence
- 5-minute safety timeout on abandoned SSE streams (AbortSignal not available inside ReadableStream start callback)
- PHASE_NAMES duplicated as a const in progress-view.tsx rather than importing from audit-engine — audit-engine is a server-only package and cannot be imported in a client bundle

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — TypeScript clean on first attempt, all acceptance criteria met immediately.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Full audit lifecycle is now visible in browser: start → live progress → complete/cancel
- Phase 03 (results dashboard) can build on /audit/[id] page pattern and the same audits/auditPhases DB tables
- cancel/resume Server Actions are ready for use in any future UI that needs audit lifecycle control

## Known Stubs

None — ProgressView is wired to live SSE data from DB. All state flows from real auditPhases/audits rows.

## Self-Check: PASSED

All created files verified present. Both task commits (d4e0253, 1e3ce4b) confirmed in git log.

---
*Phase: 02-audit-setup*
*Completed: 2026-03-22*
