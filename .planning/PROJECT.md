# CodeAudit

## What This Is

A local web application (`npx codeaudit`) that wraps a manual 13-phase codebase audit process into a polished browser-based UI. Users run it on their machine at localhost, point it at local folders, choose an audit type/depth/LLM model, and get a comprehensive codebase health report — viewable in-app with severity charts, filterable findings, PDF/zip download, and audit comparison over time. No code ever leaves the user's machine.

## Core Value

Anyone can run a thorough, structured codebase health audit on any local codebase without needing to set up Claude Code CLI, manage read-only filesystem locks, or paste multi-page prompts — just open the app, pick a folder, and run.

## Requirements

### Validated

- ✓ Local folder selection with multi-folder support — v1.0
- ✓ LLM API key management (AES-256-GCM encrypted, multiple per provider) — v1.0
- ✓ Audit type selection (full, security-only, team, code quality) — v1.0
- ✓ Audit depth selection (quick scan / deep audit) — v1.0
- ✓ Local safety enforcement (chmod + git push block, guaranteed unlock) — v1.0
- ✓ Full 13-phase audit engine with 3 LLM providers + AUTO model selection — v1.0
- ✓ Phase 0 bootstrap (auto-detect stack, LOC, contributors) — v1.0
- ✓ Phases 1-10 execution via structured LLM API calls — v1.0
- ✓ Phase 11 HTML report generation (management + technical dashboards) — v1.0
- ✓ Live SSE progress tracking with expandable per-phase detail — v1.0
- ✓ In-app results dashboard (scores, severity charts, filterable findings) — v1.0
- ✓ Downloadable reports (zip with HTML, markdown, JSON, PDF) — v1.0
- ✓ Audit history per folder with score badges — v1.0
- ✓ Audit comparison (delta report: resolved/new/persisted findings) — v1.0
- ✓ Budget monitoring (real-time token/cost display, overrun warnings) — v1.0
- ✓ Audit output directory (~/audit-{name}/) — v1.0
- ✓ Complete UI redesign with new design system (dark/light themes, yellow accent, Geist/JetBrains Mono, Linear aesthetic) — v1.1
- ✓ Dark/light theme toggle with localStorage persistence — v1.1
- ✓ 8 shared UI components (Badge, Button, Card, SelectCard, Input, HealthScore, SeverityBar, Modal) — v1.1
- ✓ Setup wizard (welcome + API key steps, floating theme toggle) — v1.1
- ✓ Persistent sidebar (252px, active state, theme toggle) — v1.1
- ✓ Dashboard with quick-action cards and recent audits table — v1.1
- ✓ New Audit single-page form with live cost estimate and confirmation modal — v1.1
- ✓ Audit Progress with animated bar, live stats, expandable phase list — v1.1
- ✓ Results dashboard with health ring, severity bars, filterable findings — v1.1
- ✓ History with folder grouping, selection system, bulk delete — v1.1
- ✓ Comparison with delta banner, side-by-side cards, finding sections — v1.1
- ✓ API Keys settings with masked list, edit/delete, inline add — v1.1
- ✓ Polyglot audit engine — LLM-driven command generation for Python, Go, Rust, Java, and any language — v1.2
- ✓ Structured RepoContext with language, package manager, test framework, CI system detection — v1.2
- ✓ Sandboxed execCommand tool for safe LLM-driven codebase analysis — v1.2

### Active (v0.6.0+)

- [ ] npm global install / Homebrew distribution (v0.6.0)
- [ ] End-to-end audit test in CI (v0.6.0)
- [ ] Error UX improvements (v0.6.0)
- [ ] Multi-repo cross-product analysis (v0.7.0)
- [ ] Model accuracy/quality metrics display (v1.0.0)

### Out of Scope

- Cloud/SaaS deployment — local-first tool by design
- GitHub OAuth / remote repo access — users point at local folders
- Automated fix/PR generation — read-only audit
- Real-time collaborative auditing — single-user tool
- IDE plugin — web UI is the interface
- Continuous monitoring — local tool, runs on demand
- Mobile app — desktop browser only

## Context

- **v0.5.0 (current, 2026-04-06):** Production foundation — CLI packaging, CI, tests, cost tracking fix, dead code cleanup.
- **Pre-release build (2026-03-22 to 2026-03-23):** 3 rapid build phases delivered all core functionality — MVP, UI redesign, polyglot engine. ~35 plans, ~60 tasks.
- **Stack:** Next.js 16, SQLite, Drizzle ORM, Vercel AI SDK 6, Shadcn/ui, Tailwind CSS 4, Recharts, Puppeteer, tsup, GitHub Actions.
- The manual audit process (6 guide files in `manual-codebase-review-process/`) is the source of truth for audit logic.
- *Note: Planning archives in `.planning/milestones/` use old internal labels "v1.0", "v1.1", "v1.2" — those were build phase names, not release versions.*

## Constraints

- **Local execution**: All code stays on the user's machine. Only LLM API calls go outbound.
- **Safety**: chmod read-only + git push block before every audit, guaranteed unlock on exit.
- **Multi-LLM**: Anthropic, OpenAI, Gemini with provider-tuned prompts.
- **Cost transparency**: Real-time token/cost display with budget overrun warnings.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local-first (not cloud webapp) | Users won't trust giving repo access to third-party tools | ✓ Good |
| Local web UI (localhost server) | Familiar browser-based UX, no Electron overhead | ✓ Good |
| BYOK (bring your own key) model | No platform AI costs; user controls spend | ✓ Good |
| Single-repo first, multi-repo v2 | Reduce scope; validate core value before expanding | ✓ Good |
| Wrapper around manual process | Exact same audit flow, just with a UI — proven process | ✓ Good |
| SQLite (not PostgreSQL) | Local tool needs zero-config storage | ✓ Good |
| App-side command execution | More reliable than LLM tool-use, keeps safety model intact | ✓ Good |
| Per-phase guide chunks | Token-efficient, avoids sending 93K guide per LLM call | ✓ Good |
| Structured JSON storage | Web UI renders from JSON; markdown/PDF are export formats | ✓ Good |
| SSE for progress (not WebSockets) | One-way server-to-client, simpler, auto-reconnects | ✓ Good |
| Full UI rebuild (not incremental) | Old design was unfixable — clean slate with new design system is faster and cleaner | ✓ Good |
| Design tokens as CSS variables + @theme | Tailwind CSS 4 native approach, enables both dark/light themes from one config | ✓ Good |
| Server/client component split pattern | Server page.tsx loads data, client component handles interactivity — consistent across all pages | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-07 — version numbering aligned, build phase labels clarified*
