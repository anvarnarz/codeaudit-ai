# Roadmap: CodeAudit AI

## Version History

| Version | What | Date | Key Milestone |
|---------|------|------|---------------|
| **0.5.0** (current) | Production Foundation | 2026-04-06 | CLI works, CI, tests, dead code cleanup |
| — | Build Phase 3: Polyglot Engine | 2026-03-23 | LLM-driven commands for any language |
| — | Build Phase 2: UI Redesign | 2026-03-22 | Complete design system overhaul |
| — | Build Phase 1: MVP | 2026-03-22 | Full 13-phase audit engine, UI, results |

*Build Phases 1-3 were internal development phases before the first versioned release.*

## What's Shipped

### v0.5.0 — Production Foundation (2026-04-06)

Made the app actually distributable and reliable:

- CLI compiled with tsup — `npx codeaudit-ai` works on clean machines
- GitHub Actions CI (lint, typecheck, test, build) on Node 20/22
- Symlink escape fix in command sandbox
- Accurate cost tracking (real token counts, not estimates)
- Dead code removed (worker, repo-sandbox, Docker Compose)
- Test suites: exec-command-tool, tool-phase-runner, prompt-builder, finding-extractor, cost calc

### Pre-release Build Phases (2026-03-22 to 2026-03-23)

All core functionality built in 3 rapid build phases:

**Build Phase 1 — MVP (12 plans, 22 tasks):**
- App shell, API key management, folder safety, audit config
- Full 13-phase audit engine (3 LLM providers + AUTO)
- Results dashboard, findings, reports, downloads
- History, folder grouping, delta comparison

**Build Phase 2 — UI Redesign (9 plans, 16 tasks):**
- New design system (dark/light themes, yellow accent, Linear aesthetic)
- All 8 pages rebuilt from scratch
- 8 shared components (Badge, Button, Card, SelectCard, Input, HealthScore, SeverityBar, Modal)

**Build Phase 3 — Polyglot Engine (6 plans, 12 tasks):**
- Structured RepoContext (language, package manager, test framework, CI detection)
- Sandboxed execCommand tool for LLM-driven analysis
- All 9 phase runners migrated to language-agnostic tool-use
- Validated on TypeScript, Python, Go repos

---

## What's Next

### v0.6.0 — Distribution & Polish (not started)

- [ ] npm publish — `npm install -g codeaudit-ai` works
- [ ] Homebrew formula
- [ ] Auto-update notification
- [ ] End-to-end test: full audit on a sample repo in CI
- [ ] Error UX: better error messages when LLM API key is invalid/expired
- [ ] README with screenshots, install instructions, usage guide

### v0.7.0 — Multi-Repo Analysis (not started)

- [ ] Select multiple local folders for cross-repo audit
- [ ] Run individual audits + cross-repo review using `multi_repo_review_guide.md`
- [ ] Unified product health report across repos

### v1.0.0 — Public Release (not started)

- [ ] All v0.6 + v0.7 complete
- [ ] Model accuracy/quality metrics display
- [ ] Performance: audit large repos (100K+ LOC) without timeout
- [ ] Documentation: architecture guide, contributing guide
- [ ] License decision

---

## Build Phase Archives

Detailed plans for the pre-release build phases are preserved in:

- `.planning/milestones/v1.0-ROADMAP.md` → Build Phase 1 (MVP)
- `.planning/milestones/v1.1-ROADMAP.md` → Build Phase 2 (UI Redesign)
- `.planning/milestones/v1.2-ROADMAP.md` → Build Phase 3 (Polyglot Engine)
- `.planning/phases/01-12/` → Per-phase plans, summaries, verification

*Note: These archives use the old "v1.0/v1.1/v1.2" naming convention. Those were internal build phase labels, not release versions.*
