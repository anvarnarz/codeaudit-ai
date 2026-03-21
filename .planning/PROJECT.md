# CodeAudit Web

## What This Is

A webapp that turns a manual CLI-based codebase audit process into a self-service tool. Users connect their GitHub account, select a repo (public or private), choose an audit type and depth, provide their own LLM API key (Anthropic, OpenAI, or Gemini), and get a comprehensive codebase health report — viewable in-app with option to download full reports. Built initially for internal use, designed to open up as a public product.

## Core Value

Anyone can get a thorough, structured codebase health audit on their GitHub repos without needing to set up Claude Code CLI, manage read-only filesystem locks, or paste multi-page prompts — just connect GitHub, pick a repo, and run.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] GitHub OAuth integration — users connect their GitHub account to access private repos
- [ ] Repository selection — users browse and select repos from their GitHub account
- [ ] LLM API key management — users provide their own API keys (Anthropic, OpenAI, Gemini)
- [ ] Audit type selection — users choose audit focus: full audit, security-only, team & collaboration, code quality, or custom combination
- [ ] Audit depth selection — users choose between quick scan (~30 min) and deep audit (hours)
- [ ] Secure repo cloning — backend clones selected repo with read-only safety guarantees
- [ ] Audit engine — translates the 13-phase CLI audit process into structured LLM API calls
- [ ] Phase 0 bootstrap — auto-detects repo stack, structure, production URLs, contributors
- [ ] Phases 1-10 execution — orientation, dependencies, tests, complexity, git archaeology, security, deep reads, CI/CD, docs, final report
- [ ] Phase 11 HTML reports — generates interactive management and technical dashboards
- [ ] Live progress tracking — users see phase-by-phase status with simplified default view and expandable detail
- [ ] In-app results dashboard — render findings with scores, charts, findings list directly in the webapp
- [ ] Downloadable reports — users can download full HTML and markdown reports
- [ ] Audit history — store completed audits so users can re-run and compare over time
- [ ] Audit comparison (Phase 12) — when previous audit exists, generate comparison showing improvements/degradations
- [ ] User authentication — sign up / sign in for the webapp itself
- [ ] Budget monitoring — track and display token usage per audit using the user's API key

### Out of Scope

- Multi-repo cross-product analysis — deferred to v2 milestone after single-repo is validated
- Self-hosted LLM support — only cloud API providers for v1
- Non-GitHub hosting (GitLab, Bitbucket) — GitHub-only for v1
- Mobile app — web-first
- Real-time collaborative auditing — single-user audits only
- Automated fix/PR generation — read-only audit, no code modifications

## Context

- The audit process is fully documented across 6 guide files in `manual-codebase-review-process/`:
  - `CLAUDE.md` — safety rules and bootstrap script for single-repo audits
  - `codebase_review_guide.md` — the 13-phase audit engine (93K, highly detailed)
  - `how_to_run_codebase_audit.md` — CTO instruction manual
  - `multi_repo_review_guide.md` — cross-repo analysis (v2)
  - `CLAUDE_MULTI_REPO.md` — safety rules for multi-repo mode (v2)
  - `how_to_run_multi_repo_audit.md` — multi-repo instruction manual (v2)
- The current process uses Claude Code CLI, requires manual setup (clone, chmod, prompt pasting), and takes 4-6 hours for a full audit
- Safety model is defense-in-depth: filesystem lock → git push block → CLAUDE.md rules. The webapp backend must replicate the filesystem lock and push block layers programmatically
- Users bring their own LLM API keys — the platform doesn't bear AI costs
- The audit produces: findings.md (raw findings), codebase_health.md (executive report), two HTML dashboards (management + technical), budget log, progress tracking
- Audit run modes already defined: full, security-only, team & collaboration, phase-by-phase
- Quick scan mode needs to be designed (subset of phases, sampling)

## Constraints

- **Security**: Cloned repos must be sandboxed — read-only filesystem, no push, no network access to production URLs. This is non-negotiable safety from the existing process.
- **Multi-LLM**: Must support at least Anthropic, OpenAI, and Gemini APIs from day one. The audit prompts need to work across providers.
- **Cost transparency**: Users pay for their own tokens — the app must show real-time token usage and cost estimates before and during audits.
- **Existing guides**: The 13-phase audit logic in `codebase_review_guide.md` is the source of truth. The webapp implements this, not a reimagined version.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| GitHub OAuth (not just URL paste) | Most repos are private; URL-only won't work | — Pending |
| BYOK (bring your own key) model | Avoids platform bearing AI costs; scales without margin pressure | — Pending |
| Single-repo first, multi-repo v2 | Reduce scope; validate core value before expanding | — Pending |
| Research-driven stack choice | No strong preferences; let domain research recommend | — Pending |
| Quick scan + deep audit options | Users need flexibility; not everyone will wait 4-6 hours | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-21 after initialization*
