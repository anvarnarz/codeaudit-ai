# CodeAudit

## What This Is

A local web application that wraps the manual codebase audit process into a browser-based UI. Users run it on their machine (localhost), point it at a local folder, choose an audit type and depth, provide their own LLM API key (Anthropic, OpenAI, or Gemini), and get a comprehensive codebase health report — viewable in-app with option to download full reports. No code ever leaves the user's machine. Built initially for internal use, designed to distribute as a downloadable tool.

## Core Value

Anyone can run a thorough, structured codebase health audit on any local codebase without needing to set up Claude Code CLI, manage read-only filesystem locks, or paste multi-page prompts — just open the app, pick a folder, and run.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Local folder selection — users pick a local directory to audit via folder picker or path input
- [ ] LLM API key management — users provide their own API keys (Anthropic, OpenAI, Gemini)
- [ ] Audit type selection — users choose audit focus: full audit, security-only, team & collaboration, code quality
- [ ] Audit depth selection — users choose between quick scan (~30 min) and deep audit (hours)
- [ ] Local safety enforcement — app locks the target folder read-only, blocks git push, exactly like the manual process
- [ ] Audit engine — translates the 13-phase CLI audit process into structured LLM API calls, running locally
- [ ] Phase 0 bootstrap — auto-detects repo stack, structure, production URLs, contributors (same as manual CLAUDE.md bootstrap)
- [ ] Phases 1-10 execution — orientation, dependencies, tests, complexity, git archaeology, security, deep reads, CI/CD, docs, final report
- [ ] Phase 11 HTML reports — generates interactive management and technical dashboards
- [ ] Live progress tracking — users see phase-by-phase status with simplified default view and expandable detail
- [ ] In-app results dashboard — render findings with scores, charts, findings list directly in the app
- [ ] Downloadable reports — users can download full HTML and markdown reports
- [ ] Audit history — store completed audits locally so users can re-run and compare over time
- [ ] Audit comparison (Phase 12) — when previous audit exists, generate comparison showing improvements/degradations
- [ ] Budget monitoring — track and display token usage per audit using the user's API key
- [ ] Audit output directory — all output goes to a separate audit directory (~/audit-{repo-name}/), never inside the repo

### Out of Scope

- Multi-repo cross-product analysis — deferred to v2 milestone after single-repo is validated
- Self-hosted LLM support — only cloud API providers for v1
- Cloud/SaaS deployment — this is a local-first tool, no server infrastructure
- GitHub OAuth / repo access — users point at local folders, no remote repo access needed
- Mobile app — desktop browser only
- Real-time collaborative auditing — single-user tool
- Automated fix/PR generation — read-only audit, no code modifications

## Context

- **PIVOT (2026-03-22):** Architecture changed from cloud webapp with GitHub OAuth to local-first app. Reason: users won't trust giving repo access to third-party tools. The app now runs entirely on the user's machine — same flow as the manual process but with a UI wrapper.
- The audit process is fully documented across 6 guide files in `manual-codebase-review-process/`
- The manual process: clone/lock folder → run Claude Code → paste audit prompt → wait for results. This app automates all of that.
- Safety model is defense-in-depth: filesystem lock → git push block → audit rules. The app enforces these programmatically on the local folder.
- Users bring their own LLM API keys — no platform costs
- The audit produces: findings.md, codebase_health.md, two HTML dashboards, budget log, progress tracking
- Audit run modes: full, security-only, team & collaboration, phase-by-phase
- Phase 1 code (Next.js, Drizzle, dark mode UI, API key encryption) is partially reusable for the local web UI

## Constraints

- **Local execution**: All code stays on the user's machine. No data sent anywhere except LLM API calls with the user's own key.
- **Safety**: Target folder must be locked read-only before audit starts, git push must be blocked — exactly replicating the manual process.
- **Multi-LLM**: Must support at least Anthropic, OpenAI, and Gemini APIs from day one.
- **Cost transparency**: Users pay for their own tokens — the app must show real-time token usage and cost estimates.
- **Existing guides**: The 13-phase audit logic in `codebase_review_guide.md` is the source of truth. The app implements this, not a reimagined version.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local-first (not cloud webapp) | Users won't trust giving repo access to third-party tools | ✓ Good |
| Local web UI (localhost server) | Familiar browser-based UX, no Electron overhead | — Pending |
| BYOK (bring your own key) model | No platform AI costs; user controls spend | ✓ Good |
| Single-repo first, multi-repo v2 | Reduce scope; validate core value before expanding | — Pending |
| Wrapper around manual process | Exact same audit flow, just with a UI — proven process | — Pending |

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
*Last updated: 2026-03-22 after local-first pivot*
