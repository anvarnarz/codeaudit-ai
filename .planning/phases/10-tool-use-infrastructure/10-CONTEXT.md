# Phase 10: Tool-Use Infrastructure - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

A sandboxed execCommand tool exists and all phase runners share a new contract: receive audit guide section + RepoContext, call execCommand as needed, return AuditFindings JSON.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- packages/audit-engine/src/repo-context.ts — RepoContext schema and type (from Phase 9)
- packages/audit-engine/src/phases/shared.ts — getRepoContext(), getRepoContextObject(), getModel(), headLimit()
- packages/audit-engine/src/orchestrator.ts — Phase runner registry pattern (registerPhaseRunner)

### Established Patterns
- Phase runners use generateObject() with PhaseOutputSchema for structured findings
- Phase 0 uses generateObject() with RepoContextSchema
- Phase 11 uses generateText() for HTML output
- execFile from child_process used for command execution in current phases

### Integration Points
- Each phase runner is registered via registerPhaseRunner() in the orchestrator
- Phase runners receive AuditRunContext and return void (write to DB)
- The Vercel AI SDK tool() function for registering LLM tools

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
