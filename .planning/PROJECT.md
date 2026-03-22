# CodeAudit

## What This Is

A local web application (`npx codeaudit`) that wraps a manual 13-phase codebase audit process into a browser-based UI. Users run it on their machine at localhost, point it at local folders, choose an audit type/depth/LLM model, and get a comprehensive codebase health report — viewable in-app with severity charts, filterable findings, PDF/zip download, and audit comparison over time. No code ever leaves the user's machine.

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

### Active

- [ ] Complete UI redesign — delete all existing page/component code, rebuild from scratch using new design system (dark/light themes, yellow accent, Geist/JetBrains Mono fonts, Linear aesthetic)
- [ ] Multi-repo cross-product analysis (run individual audits + cross-repo review)
- [ ] npm global install / Homebrew distribution
- [ ] Model accuracy/quality metrics display

## Current Milestone: v1.1 UI Redesign

**Goal:** Completely replace all frontend UI code with new design system from `docs/UI_IMPLEMENTATION_GUIDE.md` and `docs/codeaudit-ai.jsx` mockup. Zero old design code reused — clean slate rebuild of every page and component. Backend stays intact.

**Target features:**
- New design token system (dark `#0a0a0b` / light `#fafafa` themes, accent `#facc15`, sacred severity colors)
- New shared component library (Badge, Button, Card, SelectCard, Input, HealthScore, SeverityBar, Modal)
- Geist + JetBrains Mono fonts, animations (fadeIn, slideIn, progressPulse, stagger)
- Redesigned: Setup Wizard, Sidebar, Dashboard, New Audit, Audit Progress, Results, History, Comparison, API Keys
- All inline prototype styles converted to Tailwind CSS 4 classes + shadcn/ui components

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
- **Architecture pivot (2026-03-22):** Changed from cloud webapp with GitHub OAuth to local-first. Users won't trust giving repo access to third-party tools.
- The manual audit process (6 guide files in `manual-codebase-review-process/`) is the source of truth for audit logic.
- Known issue: `packages/audit-engine/src/progress-emitter.ts` references `audit.provider` which is missing from the DB schema. Documented in deferred items.
- **Phase 5 complete (2026-03-22):** Old frontend deleted (5,967 lines), new design token system (dark/light themes, #facc15 accent), 8 shared components built (Badge, Button, Card, SelectCard, Input, HealthScore, SeverityBar, Modal). Also fixed PhaseRunner import bug + audit.provider field.
- **Phase 6 complete (2026-03-22):** ThemeToggle with localStorage persistence, two-step setup wizard, 252px sidebar with active state, dashboard with quick-action cards and recent audits table.
- **Phase 7 complete (2026-03-22):** New Audit single-page form (folder validation, type/depth SelectCards, provider/model dropdowns, live cost estimate, confirmation modal) + Audit Progress SSE-driven view (animated bar, live stats, cancel, expandable 13-phase list, completion state).

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
*Last updated: 2026-03-22 after Phase 7 completion*
