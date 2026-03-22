---
phase: 01-foundation
plan: 03
subsystem: ui
tags: [next.js, react, shadcn, radix-ui, cost-estimator, audit-config, folder-safety]

# Dependency graph
requires:
  - phase: 01-foundation plan 01
    provides: API key Server Actions (addApiKey, listApiKeys, deleteApiKey), database schema with audits/apiKeys tables
  - phase: 01-foundation plan 02
    provides: FolderPicker component, validateFolder server action, folder-safety.ts (lockFolder, createAuditOutputDir)
provides:
  - Audit configuration UI (AuditTypeCards, DepthToggle, ModelSelector, CostEstimate, ConfirmAuditDialog)
  - cost-estimator.ts library with estimateCostRange, formatCostRange, collectFolderStats
  - /api/models route that fetches model list from provider API using decrypted key
  - startAudit Server Action that enforces folder safety (lockFolder + createAuditOutputDir) before DB insert
  - Complete New Audit page wiring all configuration components
  - /audit/[id]/queued stub page showing locked folder state post-confirm
  - Dashboard page with live DB query for recent audits
  - Shadcn Select and AlertDialog UI components
affects: [02-audit-engine, phase-02]

# Tech tracking
tech-stack:
  added:
    - "@radix-ui/react-select — Shadcn Select component foundation"
    - "@radix-ui/react-alert-dialog — Shadcn AlertDialog component foundation"
    - "@radix-ui/react-dialog — supporting Radix package"
  patterns:
    - "Server component wrapper + client form pattern (page.tsx loads data, new-audit-form.tsx is 'use client')"
    - "Server Action wrapper for Node.js-only functions (folder-stats.ts wraps collectFolderStats)"
    - "Provider-grouped Select with dynamic model fetching on key change"
    - "Cost range displayed as ±40% band to communicate uncertainty"

key-files:
  created:
    - apps/web/lib/cost-estimator.ts
    - apps/web/app/api/models/route.ts
    - apps/web/components/ui/select.tsx
    - apps/web/components/ui/alert-dialog.tsx
    - apps/web/components/audit/audit-type-cards.tsx
    - apps/web/components/audit/depth-toggle.tsx
    - apps/web/components/audit/model-selector.tsx
    - apps/web/components/audit/cost-estimate.tsx
    - apps/web/components/audit/confirm-dialog.tsx
    - apps/web/actions/audit-start.ts
    - apps/web/actions/folder-stats.ts
    - apps/web/app/(app)/audit/new/new-audit-form.tsx
    - apps/web/app/(app)/audit/[id]/queued/page.tsx
  modified:
    - apps/web/app/(app)/audit/new/page.tsx
    - apps/web/app/(app)/dashboard/page.tsx

key-decisions:
  - "Server component wrapper + client form: New Audit page.tsx is async server component (loads keys), delegates to new-audit-form.tsx client component — keeps RSC data loading pattern consistent"
  - "collectFolderStats wrapped in server action (folder-stats.ts): the Node.js fs module can't run in browser, so a thin server action wrapper enables calling it from the client form"
  - "@radix-ui/react-select and @radix-ui/react-alert-dialog installed on demand: only 2 Radix packages were missing; installed rather than building custom primitives"
  - "Cost estimate defaults to 150k tokens (typical mid-size repo) when no folder stats — never shows zero before folder selection"

patterns-established:
  - "Pattern 1: Audit config components are all 'use client', receive typed props, no internal server calls except ModelSelector which fetches /api/models"
  - "Pattern 2: startAudit Server Action always calls createAuditOutputDir THEN lockFolder — CRITICAL ORDER for filesystem safety (git config writable before chmod)"
  - "Pattern 3: Dashboard queries DB directly in server component with .all() (better-sqlite3 sync API via Drizzle)"

requirements-completed: [CONF-01, CONF-02, CONF-03, CONF-04, CONF-05]

# Metrics
duration: 7min
completed: 2026-03-22
---

# Phase 01 Plan 03: Audit Configuration UI Summary

**5-component audit configuration UI with live cost estimate, folder-safety-enforcing startAudit Server Action, and /api/models route for dynamic model listing**

## Performance

- **Duration:** ~7 minutes
- **Started:** 2026-03-22T04:06:20Z
- **Completed:** 2026-03-22T04:13:00Z
- **Tasks:** 3 (Task 1, Task 2a, Task 2b)
- **Files modified:** 15

## Accomplishments

- Built 5 audit configuration components (AuditTypeCards, DepthToggle, ModelSelector, CostEstimate, ConfirmAuditDialog) wired together in New Audit page
- Created startAudit Server Action that enforces folder safety (BLOCKER 1 fix) — calls createAuditOutputDir then lockFolder before inserting audit record
- Created cost-estimator.ts with provider-aware pricing, phase count multipliers, and ±40% range display
- Created /api/models route fetching models from Anthropic/OpenAI/Gemini APIs using decrypted keys
- Dashboard page now queries audits table with status badges and relative dates

## Task Commits

Each task was committed atomically:

1. **Task 1: cost-estimator.ts library + /api/models route** - `62a3ddf` (feat)
2. **Task 2a: Audit configuration components + startAudit Server Action** - `15402d9` (feat)
3. **Task 2b: Wire New Audit page + queued stub + dashboard** - `eb75bcb` (feat)

**Plan metadata:** _(final docs commit follows)_

## Files Created/Modified

- `apps/web/lib/cost-estimator.ts` - Token/cost range calculation; collectFolderStats, estimateCostRange, formatCostRange
- `apps/web/app/api/models/route.ts` - GET handler fetching models from Anthropic/OpenAI/Gemini with decrypted key
- `apps/web/components/ui/select.tsx` - Shadcn Select built on @radix-ui/react-select
- `apps/web/components/ui/alert-dialog.tsx` - Shadcn AlertDialog built on @radix-ui/react-alert-dialog
- `apps/web/components/audit/audit-type-cards.tsx` - 4-card grid per D-10
- `apps/web/components/audit/depth-toggle.tsx` - Quick Scan / Deep Audit toggle per D-11
- `apps/web/components/audit/model-selector.tsx` - Provider/key dropdown + model fetch on key change per D-12/D-13
- `apps/web/components/audit/cost-estimate.tsx` - Live cost range display per D-16/D-17
- `apps/web/components/audit/confirm-dialog.tsx` - Async onConfirm with loading state per D-18
- `apps/web/actions/audit-start.ts` - Server Action: createAuditOutputDir → lockFolder → DB insert → redirect
- `apps/web/actions/folder-stats.ts` - Server Action wrapper for collectFolderStats
- `apps/web/app/(app)/audit/new/new-audit-form.tsx` - Client form wiring all 5 components
- `apps/web/app/(app)/audit/new/page.tsx` - Server component wrapper (replaced stub)
- `apps/web/app/(app)/audit/[id]/queued/page.tsx` - Stub page shown after audit queued
- `apps/web/app/(app)/dashboard/page.tsx` - Updated with DB query for recent audits

## Decisions Made

- Server component wrapper + client form pattern for New Audit page (consistent with api-keys page pattern established in Plan 02)
- collectFolderStats wrapped in server action because the Node.js fs API can't run in browser context
- Installed @radix-ui/react-select and @radix-ui/react-alert-dialog on demand (were not in package.json initially)
- Cost estimate defaults to 150k tokens when no folder selected — never shows zero before folder selection per D-16

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @radix-ui/react-select and @radix-ui/react-alert-dialog**
- **Found during:** Task 2a (creating ModelSelector and ConfirmAuditDialog)
- **Issue:** Plan uses Select and AlertDialog from @/components/ui/ but these Radix UI packages were not installed; only react-label and react-slot were present
- **Fix:** `pnpm add --filter web @radix-ui/react-select @radix-ui/react-alert-dialog @radix-ui/react-dialog` + created the Shadcn component wrappers
- **Files modified:** apps/web/package.json, pnpm-lock.yaml, components/ui/select.tsx, components/ui/alert-dialog.tsx
- **Verification:** TypeScript compiles clean
- **Committed in:** 62a3ddf (Task 1 commit)

**2. [Rule 3 - Blocking] Created folder-stats.ts server action wrapper**
- **Found during:** Task 2b (wiring new-audit-form.tsx)
- **Issue:** collectFolderStats uses Node.js fs module which can't run in browser; the client form needed to call it on folder validation
- **Fix:** Created thin "use server" wrapper at apps/web/actions/folder-stats.ts
- **Files modified:** apps/web/actions/folder-stats.ts
- **Verification:** TypeScript compiles clean, server action pattern consistent with codebase
- **Committed in:** eb75bcb (Task 2b commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for the plan to compile and run. No scope creep.

## Issues Encountered

- Root-level `pnpm tsc --noEmit` has pre-existing errors in `packages/audit-engine` and `worker` (missing build outputs for referenced projects). These are out of scope — the web package compiles clean with `pnpm --filter web exec tsc --noEmit`.

## Known Stubs

- `apps/web/app/(app)/audit/[id]/queued/page.tsx` - The queued page is intentionally a stub; the audit engine (Phase 2) will replace it with live phase-by-phase progress tracking. The stub displays folder path, type, depth, and status — fulfills the redirect target requirement.

## Next Phase Readiness

- Phase 1 complete: full user journey from app setup → API key management → folder selection → audit configuration → confirm (locks folder) → queued stub
- Phase 2 (Audit Engine) can now receive: auditId, folderPath (locked), auditOutputDir, auditType, depth, llmProvider, apiKeyId, selectedModel from the audits table
- Blockers for Phase 2 documented in STATE.md (prompt injection via repo content, multi-provider prompt engineering)

---
*Phase: 01-foundation*
*Completed: 2026-03-22*

## Self-Check: PASSED

All created files verified present. All task commits verified in git log.
