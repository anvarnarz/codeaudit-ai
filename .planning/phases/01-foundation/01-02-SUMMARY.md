---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [folder-picker, server-action, shadcn, chmod, git, folder-safety, setup-wizard]

# Dependency graph
requires:
  - phase: 01-foundation-01
    provides: "SQLite DB with appSettings, apiKeys tables, addApiKey server action, no-auth middleware"
provides:
  - "lockFolder/unlockFolder/isGitRepo/createAuditOutputDir safety service (apps/web/lib/folder-safety.ts)"
  - "validateFolder server action with git repo detection (apps/web/actions/folders.ts)"
  - "FolderPicker component with multi-folder support, per-path validation, non-git warning"
  - "New Audit page skeleton with FolderPicker integration"
  - "First-time setup wizard with API key add flow and setup_complete persistence"
affects:
  - "02-audit-engine — must call lockFolder before audit starts, unlockFolder on completion"
  - "03-new-audit-page — extends the audit/new/page.tsx skeleton with type/depth/model config"

# Tech tracking
tech-stack:
  added:
    - "Shadcn/ui components: button, input, label, alert (copied into components/ui/)"
    - "vitest extended to cover apps/web/lib/ tests"
  patterns:
    - "promisify(execFile) for all shell commands — never execSync"
    - "CRITICAL ORDER: git push block before chmod in lockFolder"
    - "Server Actions in apps/web/actions/ — validateFolder pattern"
    - "Client components in apps/web/components/audit/ with useTransition for server action calls"

key-files:
  created:
    - "apps/web/lib/folder-safety.ts — lockFolder, unlockFolder, isGitRepo, createAuditOutputDir"
    - "apps/web/lib/folder-safety.test.ts — 9 TDD tests covering all four functions"
    - "apps/web/actions/folders.ts — validateFolder server action"
    - "apps/web/components/audit/folder-picker.tsx — multi-folder FolderPicker component"
    - "apps/web/app/setup/actions.ts — completeSetup server action"
    - "apps/web/app/setup/setup-wizard.tsx — client setup wizard with API key form"
    - "apps/web/components/ui/button.tsx — Shadcn Button"
    - "apps/web/components/ui/input.tsx — Shadcn Input"
    - "apps/web/components/ui/label.tsx — Shadcn Label"
    - "apps/web/components/ui/alert.tsx — Shadcn Alert"
  modified:
    - "apps/web/app/(app)/audit/new/page.tsx — replaced stub with FolderPicker integration"
    - "apps/web/app/setup/page.tsx — replaced auto-complete stub with real wizard"
    - "vitest.config.ts — added apps/web/** test glob"

key-decisions:
  - "TDD approach for folder-safety.ts: wrote 9 failing tests first, then implemented to pass"
  - "git push block runs BEFORE chmod — CRITICAL ORDER enforced in code and comment"
  - "unlockFolder restores u+w only (not a+w) — owner write bits only per security model"
  - "createAuditOutputDir uses ~/audit-{name}-{YYYYMMDD-HHmm}/ with recursive mkdir"
  - "FolderPicker uses useTransition + server action for sub-1-second path validation"
  - "Setup wizard reuses existing addApiKey action from Plan 01 — no duplication"
  - "Shadcn components installed via npx shadcn CLI (4 components: button, input, label, alert)"

patterns-established:
  - "Pattern: Server Actions in apps/web/actions/ export typed result unions"
  - "Pattern: Client components call server actions via useTransition for non-blocking UX"
  - "Pattern: FolderPicker accepts value: string[] and onChange: (paths, validations) => void"

requirements-completed: [FOLD-01, FOLD-02, FOLD-03, FOLD-04, FOLD-05]

# Metrics
duration: 5min
completed: 2026-03-22
---

# Phase 01 Plan 02: Folder Safety + Picker Summary

**chmod/git push block safety service with promisify(execFile), multi-folder FolderPicker with per-path server action validation, and first-time setup wizard reusing addApiKey**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-22T03:57:13Z
- **Completed:** 2026-03-22T04:02:00Z
- **Tasks:** 2
- **Files modified:** 10 created, 3 modified

## Accomplishments

- folder-safety.ts service: lockFolder enforces CRITICAL ORDER (git push block first, then chmod), unlockFolder restores owner bits only, isGitRepo via fs.access, createAuditOutputDir with timestamp collision avoidance
- 9 TDD tests covering all safety functions — all green, TypeScript clean
- FolderPicker multi-folder component with per-path validation via validateFolder server action, non-git repo warning per D-06, Add/Remove folder buttons per D-04
- Setup wizard with API key entry form, provider selector, success state, and redirect to dashboard on completion

## Task Commits

Each task was committed atomically:

1. **Task 1: Build folder-safety.ts service library** - `9f0b07f` (feat + test)
2. **Task 2: validateFolder action + FolderPicker + pages** - `ee062f8` (feat)

**Plan metadata:** (pending docs commit)

_Note: Task 1 is TDD — tests written first (RED), then implementation (GREEN)_

## Files Created/Modified

- `apps/web/lib/folder-safety.ts` — Safety service: lockFolder, unlockFolder, isGitRepo, createAuditOutputDir
- `apps/web/lib/folder-safety.test.ts` — 9 TDD unit tests
- `apps/web/actions/folders.ts` — validateFolder server action returning FolderValidationResult
- `apps/web/components/audit/folder-picker.tsx` — Multi-folder picker, per-path validation, non-git warning
- `apps/web/app/(app)/audit/new/page.tsx` — New audit page with FolderPicker (folderPaths: string[])
- `apps/web/app/setup/page.tsx` — Setup page: checks setup_complete, renders wizard or redirects
- `apps/web/app/setup/actions.ts` — completeSetup server action writing setup_complete to appSettings
- `apps/web/app/setup/setup-wizard.tsx` — Client wizard: provider selector, API key input, success state
- `apps/web/components/ui/{button,input,label,alert}.tsx` — Shadcn UI components
- `vitest.config.ts` — Extended test include glob to cover apps/web/ tests

## Decisions Made

- **CRITICAL ORDER comment added to lockFolder** — git remote set-url must run before chmod because once chmod -R a-w runs, .git/config becomes unwritable and the push block would fail
- **Shadcn components installed on-demand** — UI component directory was empty, installed 4 required components during Task 2
- **vitest.config.ts extended** — original glob didn't include apps/web/lib/, fixed before writing tests (Rule 3 auto-fix)
- **setup-wizard.tsx created as companion client component** — the existing setup/page.tsx was async server component; wizard logic needs client state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extended vitest config to include apps/web/ test paths**
- **Found during:** Task 1 (TDD RED phase)
- **Issue:** vitest.config.ts only included `packages/*/src/**` and `apps/*/src/**` — the folder-safety test in `apps/web/lib/` would not be discovered
- **Fix:** Added `apps/web/**/*.{test,spec}.{ts,tsx}` to the include array
- **Files modified:** vitest.config.ts
- **Verification:** Tests run and fail correctly (RED state confirmed)
- **Committed in:** 9f0b07f (Task 1 commit)

**2. [Rule 3 - Blocking] Installed Shadcn UI components**
- **Found during:** Task 2 (FolderPicker component)
- **Issue:** apps/web/components/ui/ was empty — no Button, Input, Label, Alert components
- **Fix:** Ran `npx shadcn@latest add button input label alert --yes`
- **Files modified:** components/ui/button.tsx, input.tsx, label.tsx, alert.tsx
- **Verification:** TypeScript imports resolve, tsc --noEmit clean
- **Committed in:** 9f0b07f (Task 1 commit, bundled with first commit for efficiency)

**3. [Rule 1 - Bug] Fixed test mock type signatures for TypeScript compliance**
- **Found during:** Task 1 (TypeScript verification step)
- **Issue:** vi.mocked(execFile).mockImplementation had typed `(cmd: string, args: string[])` which didn't match execFile's complex overloaded signature
- **Fix:** Used `any` types in mock callbacks with `eslint-disable` comments — test logic correct, types pragmatic
- **Files modified:** apps/web/lib/folder-safety.test.ts
- **Verification:** tsc --noEmit exits 0 with no errors on test file
- **Committed in:** 9f0b07f (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** All auto-fixes necessary for test infrastructure and functionality. No scope creep.

## Issues Encountered

None — all issues handled via deviation rules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- folder-safety.ts contract is solid: lockFolder enforces git-block-first ordering, all functions tested
- Phase 2 audit engine must call `lockFolder` before starting any audit and `unlockFolder` in finally block
- audit/new/page.tsx skeleton is ready for Plan 03 to add type cards, depth toggle, model selector, cost estimate
- Setup wizard is functional — users can add API keys before being redirected to dashboard

---
*Phase: 01-foundation*
*Completed: 2026-03-22*
