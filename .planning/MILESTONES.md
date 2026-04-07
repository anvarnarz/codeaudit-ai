# Milestones — CodeAudit AI

## v0.5.0 — Production Foundation (2026-04-06)

**Focus:** Make the app installable, testable, and reliable.

**Accomplished:**
- CLI compiled with tsup for `npx codeaudit-ai` distribution
- GitHub Actions CI pipeline (lint, typecheck, test, build) on Node 20/22
- Symlink escape detection in command execution sandbox
- Accurate cost tracking using real token counts (replaced 75/25 estimate)
- Dead code removed: worker/, repo-sandbox/, Docker Compose, stale env vars
- 5 test suites added (~37 tests): exec-command-tool, tool-phase-runner, prompt-builder, finding-extractor, cost calc
- VERSION file for release tracking

---

## Pre-release: Build Phase 3 — Polyglot Engine (2026-03-23)

*Internal label was "v1.2" — this was not a versioned release.*

**Focus:** Make the audit engine work for any programming language.

**Accomplished:**
- Zod RepoContextSchema with 12 polyglot fields, stored per audit
- Phase 0 detects 9+ language ecosystems, 7 CI systems, polyglot monorepo tools
- Sandboxed execCommand tool + runPhaseWithTools helper
- All 9 phase runners (1-9) migrated from hardcoded JS/TS to LLM tool-use delegation
- Structural validation passed: TypeScript build clean, Python/Go detection works

**Stats:** 4 phases, 6 plans, 12 tasks

---

## Pre-release: Build Phase 2 — UI Redesign (2026-03-22)

*Internal label was "v1.1" — this was not a versioned release.*

**Focus:** Complete visual overhaul of the frontend.

**Accomplished:**
- Deleted 5,967 lines of old frontend code
- New Tailwind CSS 4 design token system with dark/light themes
- 8 shared components built from scratch
- All 8 pages rebuilt: Setup, Dashboard, New Audit, Progress, Results, History, Compare, API Keys
- Geist + JetBrains Mono fonts, 6 keyframe animations

**Stats:** 4 phases, 9 plans, 16 tasks

---

## Pre-release: Build Phase 1 — MVP (2026-03-22)

*Internal label was "v1.0" — this was not a versioned release.*

**Focus:** Build the complete application from scratch.

**Accomplished:**
- Local-first architecture (no auth, SQLite, in-process)
- CLI launcher with ENCRYPTION_KEY bootstrap
- API key management with AES-256-GCM encryption
- Folder safety (chmod + git push block, guaranteed unlock)
- Full 13-phase audit engine with 3 LLM providers + AUTO
- SSE progress streaming, cancel/resume
- Results dashboard, severity charts, findings, PDF/zip export
- Audit history, folder grouping, delta comparison

**Stats:** 4 phases, 10 plans, 22 tasks, 7,860 LOC

---

*Note: Build Phase labels "v1.0", "v1.1", "v1.2" in archived planning docs were internal development phase names, not release versions. The first actual versioned release is v0.5.0.*
