---
phase: 08-data-views
plan: 03
subsystem: ui
tags: [next.js, react, drizzle, sqlite, tailwind, server-components, server-actions]

# Dependency graph
requires:
  - phase: 08-data-views-01
    provides: Results dashboard with findings display and severity charts
  - phase: 05-foundation
    provides: Shared UI components (Badge, Button, Card, SelectCard, Input, HealthScore, SeverityBar)
  - phase: 06-shell-onboarding
    provides: Sidebar layout wrapping (app) pages
provides:
  - Comparison page at /audit/compare?a=&b= with Set-based findings diff
  - API Keys settings page at /settings/api-keys with full CRUD
affects: [navigation, sidebar, history-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server component queries DB and serializes dates to ISO strings before passing to client
    - Set-based diff with composite key (title + filePath[0]) for finding comparison
    - SelectCard provider selector pattern (same as setup wizard)
    - Inline edit/delete pattern for list items without modal

key-files:
  created:
    - apps/web/app/(app)/audit/compare/page.tsx
    - apps/web/app/(app)/audit/compare/compare-view.tsx
    - apps/web/app/(app)/settings/api-keys/page.tsx
    - apps/web/app/(app)/settings/api-keys/api-keys-page.tsx
  modified: []

key-decisions:
  - "Comparison page determines prev/curr by comparing createdAt timestamps — no special ordering assumed from query params"
  - "Inline delete on API Keys page has no confirmation modal — simpler UX, reversible by re-adding"
  - "Non-null assertion on SEVERITY_COLORS fallback avoids TS18048 without runtime risk (fallback key is always valid)"

patterns-established:
  - "CompareView pattern: server page serializes both audit objects + three finding arrays; client only renders"
  - "ApiKeysPage pattern: router.refresh() after mutations instead of local state splice — SST refresh ensures consistency"

requirements-completed: [CMPR-01, CMPR-02, CMPR-03, KEYS-01, KEYS-02, KEYS-03]

# Metrics
duration: 2min
completed: 2026-03-23
---

# Phase 08 Plan 03: Comparison & API Keys Pages Summary

**Set-based audit comparison page with delta banner and three-section finding diff, plus full CRUD API Keys settings page with SelectCard provider picker and inline edit/delete**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-23
- **Completed:** 2026-03-23
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Comparison page at `/audit/compare?a=&b=` loads two audits, determines older/newer by createdAt, computes Set-based findings diff, and renders delta banner with direction arrow + green/red color
- Side-by-side HealthScore ring and SeverityBar charts for previous and latest audits
- Three labeled finding sections: Resolved (green background, line-through text), New (red background), Persisted (gray background)
- API Keys settings page at `/settings/api-keys` lists all keys with 40x40 provider initial icon, masked key in font-mono, created date
- Inline add form with SelectCard provider selector (matching setup wizard pattern), password input, label input
- Per-row Edit (inline label edit with Input + Save/Cancel) and Delete buttons calling server actions

## Task Commits

1. **Task 1: Comparison page with delta banner, side-by-side cards, and finding diff** - `d044a72` (feat)
2. **Task 2: API Keys settings page with key list, inline add form, edit and delete** - `2abd208` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `apps/web/app/(app)/audit/compare/page.tsx` - Server component: loads two audits by query params, computes Set-based diff, serializes for client
- `apps/web/app/(app)/audit/compare/compare-view.tsx` - Client component: delta banner, side-by-side cards, three finding sections
- `apps/web/app/(app)/settings/api-keys/page.tsx` - Server component: calls listApiKeys, serializes dates, passes to client
- `apps/web/app/(app)/settings/api-keys/api-keys-page.tsx` - Client component: full CRUD UI with SelectCard provider picker, inline edit/delete

## Decisions Made

- Comparison page determines which audit is "previous" vs "latest" by comparing `createdAt` timestamps (not assumed from query param order `a`/`b`).
- API Keys delete has no confirmation modal — simpler UX per spec, and keys can be re-added if deleted accidentally.
- Non-null assertion (`SEVERITY_COLORS["info"]!`) used as fallback since the key is always valid in the literal object; avoids TS18048 without unnecessary optional chaining.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in `results-dashboard.tsx` and `history/page.tsx` (out of scope — not caused by this plan's changes). No new errors introduced.

## Known Stubs

None — both pages are fully wired to real server actions and DB queries.

## Next Phase Readiness

- `/audit/compare` is ready for navigation links from history page and results page
- `/settings/api-keys` is ready for sidebar nav link
- All 3 plans of Phase 08 data-views are complete

---
*Phase: 08-data-views*
*Completed: 2026-03-23*
