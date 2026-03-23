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

### Active

- [ ] Polyglot audit engine — replace hardcoded JS/TS commands with LLM-driven command generation per detected stack
- [ ] Multi-repo cross-product analysis (run individual audits + cross-repo review)
- [ ] npm global install / Homebrew distribution
- [ ] Model accuracy/quality metrics display

## Current Milestone: v1.2 Polyglot Audit Engine

**Goal:** Replace hardcoded JS/TS shell commands in all phase runners with LLM-driven command generation. The LLM reads the audit guide section + Phase 0 repo context and decides what commands to run per stack — making the audit accurate for Python, Go, Rust, Java, and any other language.

**Target features:**
- Enhanced Phase 0: structured RepoContext with primary language, package manager, test framework, CI system
- Phase runners refactored to send guide section + repo context to LLM instead of hardcoded commands
- LLM generates language-appropriate commands (pip-audit for Python, cargo audit for Rust, etc.)
- Same structured JSON output schema — UI/results/reports unchanged

### Out of Scope

- Cloud/SaaS deployment — local-first tool by design
- GitHub OAuth / remote repo access — users point at local folders
- Automated fix/PR generation — read-only audit
- Real-time collaborative auditing — single-user tool
- IDE plugin — web UI is the interface
- Continuous monitoring — local tool, runs on demand
- Mobile app — desktop browser only

## Context

- **v1.0 shipped (2026-03-22):** 7,860 LOC TypeScript, 93 commits, 171 files. Next.js 16, SQLite, Drizzle ORM, Vercel AI SDK 6, Shadcn/ui, Tailwind CSS 4, Recharts, Puppeteer.
- **v1.1 shipped (2026-03-23):** Complete UI redesign — 4,632 LOC across 69 files in apps/web. 18 feature commits, 9 plans, 4 phases. New design token system, 8 shared components, all 9 pages rebuilt from scratch.
- The manual audit process (6 guide files in `manual-codebase-review-process/`) is the source of truth for audit logic.

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
*Last updated: 2026-03-23 after v1.1 milestone*
