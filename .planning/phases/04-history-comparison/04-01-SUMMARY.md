---
phase: 04-history-comparison
plan: 01
subsystem: ui
tags: [nextjs, drizzle, sqlite, history, server-component]

# Dependency graph
requires:
  - phase: 03-results-cost
    provides: /audit/[id]/results page that history rows link to
  - phase: 01-foundation
    provides: audits table schema, getDb helper
provides:
  - Async server component at /history showing all audits grouped by folderPath
  - Compare button pre-filling /audit/compare?a=&b= with latest two audit IDs per folder
  - Score/grade badge per audit row when findings exist
affects:
  - 04-02 (compare page — history page is the primary entry point for Compare button)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Grouping pattern: Map<string, rows[]> keyed by folderPath, rows pre-sorted newest-first"
    - "Inline helpers: AUDIT_TYPE_LABELS, GRADE_COLOR, formatRelativeDate defined per-file, not shared"

key-files:
  created: []
  modified:
    - apps/web/app/(app)/history/page.tsx

key-decisions:
  - "History page uses server-side Map grouping (no client component) — data already ordered from DB, no sort needed client-side"
  - "Compare button uses folderAudits[0] (latest) and folderAudits[1] (previous) from the already-sorted group"
  - "Score badge shows when findings.summary.score != null; falls back to status label for incomplete audits"

patterns-established:
  - "Pattern: AuditFindings cast as AuditFindings | null from JSON column — use optional chaining on .summary"

requirements-completed:
  - HIST-01
  - HIST-02

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 4 Plan 1: History Page Summary

**Async server component at /history querying SQLite, grouping audits by folderPath with score/grade badges and a Compare button pre-filled with latest two audit IDs per folder**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-22T09:59:25Z
- **Completed:** 2026-03-22T10:03:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Replaced stub history page with a real 171-line async server component
- Audits fetched from SQLite via Drizzle, grouped by folderPath (newest-first)
- Each row is a full-row Link to /audit/[id]/results with type, depth, date, and score/grade badge
- Folders with 2+ audits render a Compare button linking to /audit/compare?a={latest}&b={previous}
- Empty state guides users to /audit/new

## Task Commits

1. **Task 1: Build audit history page** - `528b485` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `apps/web/app/(app)/history/page.tsx` - Full audit history grouped by folder, score badges, Compare button

## Decisions Made

- Server-side Map grouping is sufficient — rows arrive newest-first from DB, so index 0 is always latest and index 1 is previous with no extra sorting
- Inline helpers (AUDIT_TYPE_LABELS, GRADE_COLOR, formatRelativeDate) copied per plan instructions — not imported from dashboard to avoid cross-component coupling
- Score badge displayed when `findings.summary.score != null`; falls back to `audit.status` label for queued/running/failed audits

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in `packages/audit-engine/src/progress-emitter.ts` were present before this plan and are unrelated to history/page.tsx. History page compiles with zero errors.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- /history route is live and functional — ready for 04-02 (compare page)
- Compare button correctly pre-fills /audit/compare?a=&b= URLs; 04-02 just needs to implement that route

---
*Phase: 04-history-comparison*
*Completed: 2026-03-22*
