---
phase: 09-phase-0-enhancement
plan: 02
subsystem: audit-engine
tags: [polyglot, python, go, rust, java, ruby, php, dotnet, swift, zod, drizzle, sqlite]

# Dependency graph
requires:
  - phase: 09-01
    provides: "RepoContextSchema Zod schema, audits.repo_context DB column, getRepoContextObject() helper"
provides:
  - "Polyglot Phase 0 runner detecting 9+ language ecosystems (Python, Go, Rust, Java, Ruby, PHP, .NET, Swift plus existing JS/TS)"
  - "Per-language LOC counting for 11 language groups with labeled [loc:Language] outputs for LLM parsing"
  - "CI detection covering GitHub Actions, GitLab CI, Jenkins, CircleCI, Travis, Azure Pipelines, Bitbucket"
  - "Monorepo detection for Cargo workspaces, Go workspaces, Gradle multi-project, Maven multi-module, and JS tools"
  - "RepoContext JSON persisted to audits.repoContext DB column after each Phase 0 run"
  - "Backward-compatible repo_context.md written to auditOutputDir with all new fields"
affects: [10-01, 10-02, 11-01]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Labeled command output pattern: prefix each command result with [category:subcategory] so LLM can parse structured data without ambiguity"
    - "Prompt injection defense: <data_block trust='untrusted'> wraps all shell output fed to LLM"
    - "Polyglot LOC: separate bash one-liner per language group, labeled, LLM sums to totalLinesOfCode"

key-files:
  created: []
  modified:
    - packages/audit-engine/src/phases/phase-00.ts

key-decisions:
  - "Each detection command labeled with [category:detail] prefix so LLM can parse labeled outputs into locByLanguage without counting header lines"
  - "CI workflow file listing runs only if .github directory exists — avoids error noise for non-GitHub repos"
  - "usage.totalTokens passed to markPhaseCompleted so cost tracking works for Phase 0"
  - "Backward-compat repo_context.md now includes all new RepoContext fields (primaryLanguages, packageManager, ciSystem, etc.)"

patterns-established:
  - "Labeled shell output pattern: [category:key] on line before each command block enables deterministic LLM extraction"

requirements-completed: [P0-01, P0-02, P0-03, P0-04, P0-05, P0-06]

# Metrics
duration: 8min
completed: 2026-03-23
---

# Phase 9 Plan 02: Polyglot Phase 0 Detection Rewrite Summary

**Rewrote phase-00.ts to detect 9+ language ecosystems, per-language LOC for 11 groups, 7 CI systems, and polyglot monorepo tools — all persisted to audits.repoContext via Drizzle after generateObject**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-23T02:22:00Z
- **Completed:** 2026-03-23T02:30:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Rewrote `phase-00.ts` completely — replaced the old inline `RepoContextSchema` (8 fields, JS/TS only) with an import of the new `RepoContextSchema` from `repo-context.ts` (13 fields, polyglot)
- Added ecosystem detection for Python (requirements.txt, pyproject.toml, setup.py, Pipfile, setup.cfg), Go (go.mod), Rust (Cargo.toml), Java/Kotlin (pom.xml, build.gradle, build.gradle.kts), Ruby (Gemfile), PHP (composer.json), .NET (*.csproj, *.sln, *.fsproj), and Swift (Package.swift, *.xcodeproj)
- Added per-language LOC counting for 11 language groups (TypeScript, JavaScript, Python, Go, Rust, Java/Kotlin, Ruby, PHP, C#/F#, C/C++, Swift) using labeled [loc:Language] prefixes on each command output
- Added CI detection for GitHub Actions (.github/workflows/), GitLab CI, Jenkins, CircleCI, Travis CI, Azure Pipelines, Bitbucket Pipelines — with GitHub Actions workflow file enumeration when .github dir found
- Added monorepo detection for Cargo workspaces (`[workspace]` in Cargo.toml), Go workspaces (go.work), Gradle multi-project (settings.gradle), Maven multi-module (pom.xml with `<modules>`), and JS tools (pnpm-workspace.yaml, lerna.json, nx.json, turbo.json)
- Updated LLM prompt with explicit field-by-field parsing instructions including packageManager decision table, testFramework conventions per language, and locByLanguage parsing from labeled outputs
- Persisted `RepoContext` JSON to `audits.repoContext` DB column immediately after `generateObject` returns
- Updated repo_context.md to display all new RepoContext fields (primaryLanguages, packageManager, frameworks, testFramework, ciSystem, monorepo info, per-language LOC)
- Passed `usage.totalTokens` to `markPhaseCompleted` so cost tracking works correctly for Phase 0

## Task Commits

1. **Task 1: Rewrite Phase 0 detection commands for polyglot support** - `75b0e90` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `packages/audit-engine/src/phases/phase-00.ts` - Complete rewrite: polyglot detection (9+ ecosystems), 11-language LOC counting, 7 CI systems, polyglot monorepo tools, DB persistence of RepoContext, updated repo_context.md format

## Decisions Made

- **Labeled command output pattern**: Each detection command output prefixed with `[category:subcategory]` (e.g., `[loc:TypeScript]`, `[ecosystem:python]`) so the LLM can deterministically identify which output corresponds to which language/system without guessing from command arguments.
- **CI GitHub workflow file listing**: Added separate command to list `*.yml` files under `.github/workflows/` — runs regardless (returns error if dir missing), which is acceptable since execCommand handles ENOENT gracefully.
- **usage.totalTokens for cost tracking**: Previous implementation passed `0` to markPhaseCompleted. Fixed to pass actual token usage so cost tracking accumulates correctly.
- **Backward-compat repo_context.md expanded**: Updated the markdown output to include all new RepoContext fields so human-readable output stays in sync with the structured JSON.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compilation passed first try with no errors.

## Known Stubs

None — this plan wires real detection commands. The RepoContext output is fully populated by Phase 0 after execution.

## Next Phase Readiness

- **10-01+** (Phase runner refactoring): `getRepoContextObject()` from shared.ts returns a fully populated `RepoContext` after Phase 0 runs. Phase runners 1-9 can now access typed context (primaryLanguages, packageManager, testFramework, etc.) to select language-appropriate commands.
- No blockers — Phase 0 is the canonical source of truth for repo context, and it now handles all major language ecosystems.

---
*Phase: 09-phase-0-enhancement*
*Completed: 2026-03-23*
