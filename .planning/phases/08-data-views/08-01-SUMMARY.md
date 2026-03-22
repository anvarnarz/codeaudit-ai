---
phase: 08-data-views
plan: 01
subsystem: results-views
tags: [results, findings, dashboard, iframe, reports]
dependency_graph:
  requires:
    - packages/db (audits, auditPhases tables, AuditFindings type)
    - apps/web/components/ui/health-score
    - apps/web/components/ui/severity-bar
    - apps/web/components/ui/badge
    - apps/web/components/ui/card
    - apps/web/components/ui/button
    - apps/web/app/api/audit/[id]/download/route.ts
    - apps/web/app/api/audit/[id]/report/[type]/route.ts
  provides:
    - /audit/[id]/results (results dashboard page)
    - /audit/[id]/executive (executive report iframe page)
    - /audit/[id]/technical (technical report iframe page)
  affects:
    - apps/web/app/(app)/audit navigation flow
tech_stack:
  added: []
  patterns:
    - Server component loads + validates data, client component handles interactivity
    - Proportional per-phase cost estimation from total cost / total tokens ratio
    - Severity key narrowing via SEVERITY_KEYS tuple for type-safe Record lookup
key_files:
  created:
    - apps/web/app/(app)/audit/[id]/results/page.tsx
    - apps/web/app/(app)/audit/[id]/results/results-dashboard.tsx
    - apps/web/app/(app)/audit/[id]/executive/page.tsx
    - apps/web/app/(app)/audit/[id]/technical/page.tsx
  modified: []
decisions:
  - Severity key narrowing: SEVERITY_KEYS tuple defined before SEVERITY_COLORS Record — required for typeof SEVERITY_KEYS[number] indexing and type-safe lookup without nullable results
  - Score assessment logic: >70 = "Needs improvement" (warning), >40 = "Critical attention needed" (destructive), <=40 = "Healthy codebase" (success) — mirrors HealthScore color thresholds
  - Phase cost estimate: proportional allocation (phase.tokensUsed * totalCostMicro / totalTokens) — approximation, not exact, since LLM billing is per-call not per-token
metrics:
  duration: 2m 45s
  completed_date: "2026-03-22"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase 08 Plan 01: Results Dashboard Summary

**One-liner:** Interactive results dashboard with HealthScore ring, SeverityBar chart, expandable finding cards, cost breakdown, and Executive/Technical iframe report pages.

## What Was Built

### Task 1: Results Dashboard (server page + client component)

**Server page** (`results/page.tsx`):
- Awaits `params.id`, queries `audits` table with `getDb()` + Drizzle `eq`
- Redirects to `/audit/${id}` if audit not completed or findings are null
- Queries `auditPhases` ordered by `phaseNumber`
- Serializes dates to ISO strings, passes to `<ResultsDashboard>`

**Client component** (`results-dashboard.tsx`):
- Header: folder name in mono, audit type + depth badges, completion stats (date, duration, cost)
- Score card: `<HealthScore size="lg">` with score/100 display and color-coded assessment text
- Severity card: `<SeverityBar>` with `findings.summary.findings_count` data
- Cost banner: total cost + tokens with expandable per-phase breakdown (proportional cost estimation)
- Action buttons: Executive Report (new tab), Technical Report (new tab), Download All (zip)
- Filter pills: All + 5 severity levels with counts; active states use severity CSS variables
- Findings list: colored left border per severity, expandable remediation section, chevron toggle

### Task 2: Executive and Technical report iframe pages

Both pages follow the same server component pattern:
- Validate audit exists via DB query (notFound() guard)
- Header with "Back to Results" link and page title
- Full-height iframe: executive uses `/api/audit/[id]/report/management`, technical uses `/api/audit/[id]/report/technical`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data wired from live DB queries and API routes.

## Verification

All acceptance criteria passed:
- `use client` in results-dashboard.tsx
- `HealthScore` and `SeverityBar` imported and used
- `severity-critical` CSS variable referenced
- `getDb` and `auditPhases` query in server page
- `notFound` guard in server page
- `api/audit`, `Download All`, `Executive Report` in client component
- `recommendation` field used in expandable remediation section
- `iframe` in both executive and technical pages
- `report/management` in executive page, `report/technical` in technical page
- `Back to Results` link in executive page

TypeScript: no errors in new files (pre-existing errors in unrelated files only).

## Self-Check: PASSED
