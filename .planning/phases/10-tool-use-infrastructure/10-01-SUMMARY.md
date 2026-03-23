---
phase: 10-tool-use-infrastructure
plan: 01
subsystem: audit-engine
tags: [ai-sdk, tool-use, sandbox, exec-command, phase-runner, vercel-ai]

# Dependency graph
requires:
  - phase: 09-phase-0-enhancement
    provides: RepoContext schema + getRepoContext() + getRepoContextObject() helpers in shared.ts
provides:
  - Sandboxed execCommand tool (createExecCommandTool) with allowlist + blocklist + path containment
  - runPhaseWithTools helper using generateText with tools and PhaseOutputSchema structured output
  - buildToolUsePhasePrompt prompt builder for tool-use mode (no pre-embedded command output)
  - New exports in audit-engine/src/index.ts
affects:
  - 11-phase-runner-migration

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tool factory pattern: createExecCommandTool(repoPath) returns Vercel AI SDK tool() with sandbox enforcement"
    - "Tool-use prompt pattern: guide chunk + RepoContext + tool instructions, no data_block pre-embedding"
    - "stepCountIs(15) stop condition caps multi-turn tool-use loops"
    - "Output.object({ schema: PhaseOutputSchema }) for structured output from generateText"

key-files:
  created:
    - packages/audit-engine/src/tools/exec-command-tool.ts
    - packages/audit-engine/src/tool-phase-runner.ts
  modified:
    - packages/audit-engine/src/prompt-builder.ts
    - packages/audit-engine/src/index.ts

key-decisions:
  - "Vercel AI SDK v6 tool() uses inputSchema (not parameters) — ZodSchema passed as inputSchema field"
  - "Dangerous pattern blocklist uses regex on joined command+args string for maximum coverage"
  - "Bash/sh -c arg inspection: extract shell command after -c and run blocklist against it separately"
  - "Path containment rejects all '..' args (simple heuristic to prevent traversal without path.resolve overhead)"
  - "Blocked commands return '(blocked: reason)' string instead of throwing — LLM can retry with different approach"
  - "stepCountIs(15) chosen as pragmatic cap: enough rounds for thorough audit, prevents infinite loops"

patterns-established:
  - "Sandbox factory pattern: all sandbox config (repoPath, timeout) captured in factory closure, tool is stateless"
  - "Tool-use prompt includes prompt injection defense: command output is DATA, not instructions"
  - "Phase output markdown format: # Phase N — Name + summary + ## Findings + JSON"

requirements-completed: [PRF-01, PRF-02, PRF-03, PRF-13, PRF-14]

# Metrics
duration: 2min
completed: 2026-03-23
---

# Phase 10 Plan 01: Tool-Use Infrastructure Summary

**Sandboxed execCommand tool + runPhaseWithTools helper enabling LLM-driven polyglot auditing via Vercel AI SDK generateText with tools and PhaseOutputSchema structured output**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-23T03:00:30Z
- **Completed:** 2026-03-23T03:02:55Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created sandboxed execCommand tool enforcing command allowlist (30+ read-only commands), dangerous pattern blocklist (rm, curl, npm install, git push, sed -i, etc.), bash -c argument inspection, path containment, and 60s timeout cap
- Created runPhaseWithTools helper that uses generateText with execCommand tool + Output.object({ schema: PhaseOutputSchema }) — LLM decides what commands to run based on detected stack
- Added buildToolUsePhasePrompt that includes audit guide section + RepoContext in the prompt without pre-embedded command output (prompt injection defense included)
- All existing exports and code are unchanged; new exports added to index.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Create sandboxed execCommand tool** - `042f7d5` (feat)
2. **Task 2: Create tool-use phase runner helper and update prompt builder** - `d9a5bea` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `packages/audit-engine/src/tools/exec-command-tool.ts` - Sandboxed execCommand tool factory using Vercel AI SDK tool()
- `packages/audit-engine/src/tool-phase-runner.ts` - runPhaseWithTools helper using generateText with tools
- `packages/audit-engine/src/prompt-builder.ts` - Added buildToolUsePhasePrompt (existing buildPhasePrompt unchanged)
- `packages/audit-engine/src/index.ts` - Added exports for createExecCommandTool, runPhaseWithTools, buildToolUsePhasePrompt

## Decisions Made
- Vercel AI SDK v6 `tool()` uses `inputSchema` field (not `parameters`) — discovered from type definitions
- Dangerous pattern blocklist applied as regex on full joined command+args string (case-insensitive) for broad coverage
- Bash/sh -c argument inspected separately to catch patterns like `bash -c "rm -rf ..."`
- Simple `..` check in args (no path resolution) chosen for safety-first approach
- `stepCountIs(15)` as stop condition — enough for thorough multi-step audit, bounded to prevent runaway costs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed tool() API: used inputSchema not parameters**
- **Found during:** Task 1 (Create sandboxed execCommand tool)
- **Issue:** Initial implementation used `parameters` field which is not the Vercel AI SDK v6 API. TypeScript reported: `No overload matches this call` on the `execute` function with `implicit any` types
- **Fix:** Changed to use `inputSchema` field (the correct AI SDK v6 Tool type field) with explicit TypeScript type annotation on the execute function parameters
- **Files modified:** packages/audit-engine/src/tools/exec-command-tool.ts
- **Verification:** `npx tsc --noEmit -p packages/audit-engine/tsconfig.json` passes with zero errors
- **Committed in:** `042f7d5` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 API bug)
**Impact on plan:** Required fix discovered TypeScript AI SDK v6 uses `inputSchema` not `parameters`. No scope creep.

## Issues Encountered
- Vercel AI SDK v6 `tool()` changed the field name from `parameters` (v5 pattern) to `inputSchema`. Caught immediately by TypeScript and fixed inline.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three infrastructure files are ready for Phase 11 to consume
- Phase 11 can import `runPhaseWithTools` from `@codeaudit-ai/audit-engine` and use it to replace hardcoded shell commands in phase runners 1-9
- `createExecCommandTool` is available for any custom tool-use needs
- TypeScript compiles cleanly with zero errors

---
*Phase: 10-tool-use-infrastructure*
*Completed: 2026-03-23*
