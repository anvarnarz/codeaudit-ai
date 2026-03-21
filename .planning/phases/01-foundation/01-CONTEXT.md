# Phase 1: Foundation - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can securely authenticate via GitHub SSO, connect their GitHub account to authorize repo access, and store/manage encrypted LLM API keys for Anthropic, OpenAI, and Gemini. Includes project scaffolding, database schema, and the guided onboarding flow.

</domain>

<decisions>
## Implementation Decisions

### Sign-up & Authentication
- **D-01:** GitHub SSO is the ONLY sign-up/sign-in method — no email/password. Users need GitHub anyway, so one-click auth is sufficient.
- **D-02:** After sign-up, users enter a guided setup flow: 1) Welcome 2) Add API key 3) Pick first repo 4) Start audit. This flow is skippable but presented by default.
- **D-03:** GitHub App installation uses per-repo selection — users choose which repos the app can see, not blanket access to all repos.

### GitHub Connection
- **D-04:** Use GitHub App with `Contents: read` per-repo scope (not OAuth App with `repo` scope) — avoids overprivilege per research pitfall findings.
- **D-05:** GitHub connection happens during sign-up (GitHub SSO flow also installs the GitHub App).

### API Key Management
- **D-06:** API keys are validated on entry — app makes a test API call to the selected provider to verify the key works before saving.
- **D-07:** Users can store multiple keys per provider with labels (e.g., "Personal", "Work"). They pick which key to use per audit.
- **D-08:** All three providers (Anthropic, OpenAI, Gemini) shown equally — no provider recommended over others.
- **D-09:** Keys stored with AES-256-GCM application-layer encryption (per research recommendation).

### UI & Navigation
- **D-10:** Landing page is minimal — product name, one-liner description, and "Sign in with GitHub" button. No marketing page for v1.
- **D-11:** Post-login navigation uses a left sidebar with sections: Dashboard, Audits, Repos, Settings.
- **D-12:** Visual style follows Linear's aesthetic — clean, minimal, dark mode default, sharp typography.

### Claude's Discretion
- Token revocation / GitHub access revocation error handling — just don't lose data
- Loading states and skeleton screens
- Exact onboarding step transitions and animations
- Settings page layout and organization
- Database schema details (tables, relations, indexes)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit Process (source of truth)
- `manual-codebase-review-process/CLAUDE.md` — Safety rules, bootstrap script, Phase 0 auto-detection logic
- `manual-codebase-review-process/codebase_review_guide.md` — The 13-phase audit engine that will be translated into API calls
- `manual-codebase-review-process/how_to_run_codebase_audit.md` — User-facing workflow showing what outputs look like

### Research
- `.planning/research/STACK.md` — Recommended tech stack (Next.js 16, Auth.js v5, Drizzle + Neon, etc.)
- `.planning/research/PITFALLS.md` — Security pitfalls including GitHub OAuth scoping and API key encryption
- `.planning/research/ARCHITECTURE.md` — System architecture, component boundaries, data flow

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes the foundational patterns

### Integration Points
- GitHub App webhook endpoint needed for installation events
- API key validation endpoints for each provider (Anthropic, OpenAI, Gemini)
- Database schema must include structured findings JSON schema (even though consumed in Phase 4/5)

</code_context>

<specifics>
## Specific Ideas

- Linear-style aesthetic: clean, minimal, dark mode default, sharp typography — reference Linear's UI for component design
- Guided onboarding should feel seamless, not like a wizard with 10 steps — keep it to 3-4 screens max
- Per-repo GitHub App selection gives users control over what they expose — important for trust when the product opens to external users

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-21*
