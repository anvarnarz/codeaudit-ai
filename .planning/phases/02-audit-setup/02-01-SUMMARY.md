---
phase: 02-audit-setup
plan: 01
subsystem: api
tags: [llm, anthropic, openai, gemini, ai-sdk, audit-engine, orchestrator, zod, drizzle]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: DB schema (audits, auditPhases, apiKeys tables), encryption (decryptApiKey), folder-safety (lockFolder/unlockFolder)

provides:
  - createLlmProvider() returning LanguageModelV1 for anthropic/openai/gemini
  - resolveModel() AUTO model tier selection (simple/medium/complex per phase)
  - PHASE_COMPLEXITY map for all 12 audit phases
  - runAudit() orchestrator with cancel polling, phase checkpoint skip, unlockFolderLocal in finally
  - registerPhaseRunner() for plan 02 to register per-phase implementations
  - PHASE_REGISTRY with 12 phase definitions and audit-type inclusion mapping
  - getPhasesForAuditType() filtering by audit type + depth (quick/deep)
  - execCommand() with 1MB cap, timeout, EACCES non-fatal handling
  - buildPhasePrompt() with data_block injection defense
  - runPhaseLlm() using generateObject + PhaseOutputSchema
  - markPhaseRunning/Completed/Skipped/Failed DB checkpoint functions
  - POST /api/audit/[id] starting engine detached, returning 202

affects: [02-02-phases, 02-03-progress-ui, 03-reports]

# Tech tracking
tech-stack:
  added:
    - "@ai-sdk/provider@1.1.3 — LanguageModelV1 type for provider compatibility"
    - "ai@6.0.134 — generateObject for structured LLM output"
    - "zod@3.24 — PhaseOutputSchema and AuditFindingSchema validation"
    - "drizzle-orm — direct dep in audit-engine for DB operations"
    - "@types/node — Node built-in types for audit-engine"
  patterns:
    - "BYOK provider pattern: caller decrypts, passes to createLlmProvider(), key never logged"
    - "Detached async engine: void runAudit() in route handler — never awaited, returns 202 immediately"
    - "data_block prompt framing: repo file contents wrapped in trust=untrusted tags to prevent injection"
    - "Phase runner registry: registerPhaseRunner() allows plan 02 to add implementations without editing orchestrator"
    - "unlockFolderLocal inlined in orchestrator (not imported from apps/web) to avoid cross-package dependency"
    - "AUTO model tier: resolveModel() picks cheapest model meeting phase complexity; user override applies to all phases"

key-files:
  created:
    - "packages/llm-adapter/src/providers/anthropic.ts"
    - "packages/llm-adapter/src/providers/openai.ts"
    - "packages/llm-adapter/src/providers/gemini.ts"
    - "packages/llm-adapter/src/models.ts"
    - "packages/audit-engine/src/commands.ts"
    - "packages/audit-engine/src/prompt-builder.ts"
    - "packages/audit-engine/src/finding-extractor.ts"
    - "packages/audit-engine/src/guide-chunks.ts"
    - "packages/audit-engine/src/progress-emitter.ts"
    - "packages/audit-engine/src/phases/index.ts"
    - "packages/audit-engine/src/orchestrator.ts"
    - "apps/web/app/api/audit/[id]/route.ts"
  modified:
    - "packages/llm-adapter/src/index.ts — replaced stub with createLlmProvider()"
    - "packages/llm-adapter/package.json — added @ai-sdk/provider@1.1.3"
    - "packages/audit-engine/src/index.ts — replaced stub with full exports"
    - "packages/audit-engine/package.json — added ai, zod, drizzle-orm, @ai-sdk/provider"
    - "packages/audit-engine/tsconfig.json — added types: [node] for Node built-ins"
    - "apps/web/package.json — added @codeaudit/audit-engine workspace dep"
    - "apps/web/tsconfig.json — added @codeaudit/audit-engine path alias"

key-decisions:
  - "Use LanguageModelV1 from @ai-sdk/provider@1.1.3 (not LanguageModel from ai) — providers return V1, ai@6 SDK internally handles both"
  - "Inline unlockFolderLocal in orchestrator instead of importing from apps/web — avoids cross-package dependency between packages/ and apps/"
  - "Use maxOutputTokens (not maxTokens) for generateObject in ai@6 — API renamed in v6"
  - "Use inputTokens/outputTokens (not promptTokens/completionTokens) for ai@6 usage tracking"
  - "Add @ai-sdk/provider@1.1.3 explicitly to llm-adapter and audit-engine — version 1.1.3 has LanguageModelV1, version 3.x does not"

patterns-established:
  - "Phase runner registry pattern: Map<number, PhaseRunner> populated by registerPhaseRunner() — decouples orchestrator from phase implementations"
  - "data_block prompt injection defense: all untrusted repo content wrapped in <data_block trust=untrusted> tags"
  - "Cancel polling: orchestrator checks audit.status === 'cancelled' between each phase"

requirements-completed: [EXEC-01, EXEC-04, EXEC-07, EXEC-08, EXEC-09]

# Metrics
duration: 8min
completed: 2026-03-22
---

# Phase 02 Plan 01: Engine Core Summary

**LLM adapter (3 providers), audit orchestrator with cancel/checkpoint/cleanup, and detached POST /api/audit/[id] endpoint that returns 202 immediately**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-22T08:32:52Z
- **Completed:** 2026-03-22T08:40:55Z
- **Tasks:** 3
- **Files modified:** 19

## Accomplishments

- LLM adapter with createLlmProvider() for Anthropic, OpenAI, and Gemini using AI SDK v6
- resolveModel() AUTO tier — cheapest model per phase complexity with user override
- runAudit() orchestrator: iterates phases, polls cancel flag, checkpoints to DB, guarantees unlockFolderLocal in finally
- Prompt builder with data_block injection defense wrapping all untrusted repo content
- PHASE_REGISTRY: 12 phase definitions with audit-type inclusion mapping and getPhasesForAuditType()
- POST /api/audit/[id]: detached engine start (void, never awaited), returns 202 immediately

## Task Commits

1. **Task 1: LLM adapter — three providers + AUTO model selection** - `7a2ce63` (feat)
2. **Task 2: Audit engine core — commands, prompt-builder, finding-extractor, guide-chunks, progress-emitter, phase registry, orchestrator** - `92d257e` (feat)
3. **Task 3: POST /api/audit/[id] — start engine detached, return 202** - `fb9a5ee` (feat)

## Files Created/Modified

- `packages/llm-adapter/src/providers/anthropic.ts` - createAnthropicProvider() wrapping @ai-sdk/anthropic
- `packages/llm-adapter/src/providers/openai.ts` - createOpenAIProvider() wrapping @ai-sdk/openai
- `packages/llm-adapter/src/providers/gemini.ts` - createGeminiProvider() wrapping @ai-sdk/google
- `packages/llm-adapter/src/models.ts` - PHASE_COMPLEXITY tiers, AUTO_MODELS map, resolveModel()
- `packages/llm-adapter/src/index.ts` - createLlmProvider() dispatch, re-exports resolveModel/PHASE_COMPLEXITY
- `packages/audit-engine/src/commands.ts` - execCommand() with 1MB cap, EACCES non-fatal
- `packages/audit-engine/src/prompt-builder.ts` - buildPhasePrompt() with data_block injection defense
- `packages/audit-engine/src/finding-extractor.ts` - runPhaseLlm() using generateObject + PhaseOutputSchema
- `packages/audit-engine/src/guide-chunks.ts` - GUIDE_CHUNKS for phases 0-11
- `packages/audit-engine/src/progress-emitter.ts` - markPhaseRunning/Completed/Skipped/Failed
- `packages/audit-engine/src/phases/index.ts` - PHASE_REGISTRY, getPhasesForAuditType(), getPhaseName()
- `packages/audit-engine/src/orchestrator.ts` - runAudit() state machine + registerPhaseRunner()
- `packages/audit-engine/src/index.ts` - all exports
- `apps/web/app/api/audit/[id]/route.ts` - POST handler returning 202

## Decisions Made

- LanguageModelV1 type from `@ai-sdk/provider@1.1.3` used explicitly — providers return V1 at runtime, version 3.x of provider package removed V1 type
- `unlockFolderLocal` inlined in orchestrator rather than imported from `apps/web/lib/folder-safety.ts` — avoids packages/ depending on apps/
- `maxOutputTokens` (not `maxTokens`) for ai@6 generateObject — renamed in AI SDK v6
- `inputTokens`/`outputTokens` (not `promptTokens`/`completionTokens`) for ai@6 usage tracking

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed LanguageModelV1 type incompatibility**
- **Found during:** Task 1 (LLM adapter)
- **Issue:** Plan used `LanguageModel` from `ai` (V2/V3 union), but providers return `LanguageModelV1`. TypeScript error TS2322.
- **Fix:** Added `@ai-sdk/provider@1.1.3` as explicit dependency; used `LanguageModelV1` type throughout
- **Files modified:** all provider files + index.ts, package.json
- **Verification:** `pnpm --filter @codeaudit/llm-adapter exec tsc --noEmit` exits 0
- **Committed in:** 7a2ce63 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed generateObject API changes in ai@6**
- **Found during:** Task 2 (finding-extractor)
- **Issue:** `maxTokens` renamed to `maxOutputTokens`; `promptTokens`/`completionTokens` renamed to `inputTokens`/`outputTokens` in ai@6
- **Fix:** Used correct field names, handled `undefined` values with `?? 0` fallback
- **Files modified:** packages/audit-engine/src/finding-extractor.ts
- **Verification:** `pnpm --filter @codeaudit/audit-engine exec tsc --noEmit` exits 0
- **Committed in:** 92d257e (Task 2 commit)

**3. [Rule 3 - Blocking] Added missing dependencies to audit-engine**
- **Found during:** Task 2 (audit-engine compilation)
- **Issue:** `ai`, `zod`, `drizzle-orm`, `@ai-sdk/provider`, `@types/node` not in audit-engine package.json; TypeScript couldn't resolve modules
- **Fix:** Added all missing deps; added `types: ["node"]` to tsconfig
- **Files modified:** packages/audit-engine/package.json, packages/audit-engine/tsconfig.json
- **Verification:** `pnpm --filter @codeaudit/audit-engine exec tsc --noEmit` exits 0
- **Committed in:** 92d257e (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for correctness. AI SDK v6 has different type/field names than what the plan assumed. No scope creep.

## Issues Encountered

- @ai-sdk/provider version mismatch: package resolved to 3.0.8 (which lacks LanguageModelV1) when installed fresh, but anthropic/openai/google providers at their current versions use @ai-sdk/provider@1.1.3. Pinned to 1.1.3 explicitly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 can now call `registerPhaseRunner(n, runner)` to add per-phase implementations
- Plan 02 phases can call `execCommand()`, `buildPhasePrompt()`, `runPhaseLlm()` directly
- Plan 03 progress UI can poll `auditPhases` table — `markPhaseRunning`/`markPhaseCompleted` updates it after each phase
- Orchestrator skips unregistered phases gracefully — plan 02 can add phases incrementally without breaking existing audits

---
*Phase: 02-audit-setup*
*Completed: 2026-03-22*
