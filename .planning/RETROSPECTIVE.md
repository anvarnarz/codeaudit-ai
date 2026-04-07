# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: Build Phase 1 — MVP (internal label "v1.0")

**Shipped:** 2026-03-22
**Phases:** 4 | **Plans:** 10 | **Tasks:** 22

### What Was Built
- Local-first codebase audit tool (`npx codeaudit`) with no auth, SQLite storage
- Full 13-phase audit engine with Anthropic/OpenAI/Gemini support + AUTO model selection
- Live SSE progress with expandable phase detail, cancel/resume
- Findings dashboard with severity charts, filterable findings, PDF/zip export
- Audit history with folder grouping and delta comparison reports

### What Worked
- **Research-first approach:** Domain research before planning prevented major rework in the audit engine phase
- **Plan checker caught real bugs:** Import typos, argument order swaps, and missing cost tracking were all caught before execution
- **Pivot handled cleanly:** Cloud→local architecture change preserved reusable code (encryption, UI components, schema shapes) while cleanly removing GitHub-specific code
- **Wave-based execution:** Sequential waves for dependent plans, parallel within waves — worked well for this project's dependency structure

### What Was Inefficient
- **Initial cloud architecture was wasted:** GitHub OAuth, App webhooks, Neon PostgreSQL — all built in old Phase 1 then stripped. The pivot should have been caught during questioning.
- **Old Phase 2 context was never used:** Pre-pivot Phase 2 (GitHub repo browser) was fully discussed then discarded after the pivot.
- **Phase 1 had to be replanned:** Old plans were deleted and recreated — double the planning cost for that phase.

### Patterns Established
- Server Actions for all mutations (`apps/web/actions/`)
- Server Components for data loading, Client Components for interactivity
- AES-256-GCM encryption pattern for secrets at rest
- `lib/folder-safety.ts` pattern for critical-order operations with guaranteed cleanup
- Per-phase guide chunks for token-efficient LLM usage
- `<data_block trust="untrusted">` for prompt injection defense

### Key Lessons
1. **Validate the deployment model during questioning** — "Where does this run?" should be asked before any architecture decisions
2. **Local-first tools are simpler** — no auth, no cloud infra, no container sandbox needed. SQLite + localhost covers 90% of the use case
3. **Plan checkers pay for themselves** — every phase had bugs caught during verification that would have required mid-execution rework

### Cost Observations
- Model mix: ~20% opus (planning), ~80% sonnet (research, checking, execution)
- All 4 phases planned and executed in a single session
- Notable: Phase 4 was the most efficient — 2 plans, 2 tasks, verification passed first try

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Plan Checker Revisions | Verifier Gaps |
|-----------|--------|-------|----------------------|---------------|
| v1.0 | 4 | 10 | 3 (Ph1: 1, Ph2: 1, Ph3: 0, Ph4: 0) | 3 (Ph1: 1 arg swap, Ph2: 1 cost tracking, Ph3: 0) |

### Recurring Patterns
- Plan checker consistently catches variable name errors and wiring gaps
- Verifier consistently finds one meaningful gap per phase (diminishing as phases get smaller)
- Final phases (3, 4) had zero revisions needed — pattern maturity from earlier phases
