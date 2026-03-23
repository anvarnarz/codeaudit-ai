# Roadmap: CodeAudit

## Milestones

- ✅ **v1.0 CodeAudit MVP** — Phases 1-4 (shipped 2026-03-22)
- ✅ **v1.1 UI Redesign** — Phases 5-8 (shipped 2026-03-23)
- 🚧 **v1.2 Polyglot Audit Engine** — Phases 9-12 (in progress)

## Phases

<details>
<summary>✅ v1.0 CodeAudit MVP (Phases 1-4) — SHIPPED 2026-03-22</summary>

- [x] Phase 1: App Shell & Configuration (3/3 plans) — completed 2026-03-22
- [x] Phase 2: Audit Engine (3/3 plans) — completed 2026-03-22
- [x] Phase 3: Results & Cost (2/2 plans) — completed 2026-03-22
- [x] Phase 4: History & Comparison (2/2 plans) — completed 2026-03-22

</details>

<details>
<summary>✅ v1.1 UI Redesign (Phases 5-8) — SHIPPED 2026-03-23</summary>

- [x] Phase 5: Design System & Shared Components (2/2 plans) — completed 2026-03-22
- [x] Phase 6: Shell & Onboarding (2/2 plans) — completed 2026-03-22
- [x] Phase 7: Audit Flows (2/2 plans) — completed 2026-03-22
- [x] Phase 8: Data Views (3/3 plans) — completed 2026-03-23

</details>

### 🚧 v1.2 Polyglot Audit Engine (In Progress)

**Milestone Goal:** Replace hardcoded JS/TS shell commands with LLM-driven command generation so the audit engine produces accurate, meaningful findings for any language — Python, Go, Rust, Java, and beyond.

- [ ] **Phase 9: Phase 0 Enhancement** - Enrich Phase 0 output into a structured RepoContext covering language, package manager, test framework, CI, and monorepo tool detection
- [x] **Phase 10: Tool-Use Infrastructure** - Build the execCommand tool and refactor the shared phase runner contract to accept guide section + RepoContext instead of hardcoded commands (completed 2026-03-23)
- [ ] **Phase 11: Phase Runner Adaptation** - Migrate all 9 phase runners (phases 1-9) to the new tool-use contract so each runner is language-agnostic
- [ ] **Phase 12: Validation** - Confirm no regression on TypeScript repos and verify meaningful findings on Python and Go repos

## Phase Details

### Phase 9: Phase 0 Enhancement
**Goal**: Phase 0 produces a rich, structured RepoContext that gives every subsequent phase runner complete knowledge of the codebase's language, tooling, and structure
**Depends on**: Nothing (first phase of this milestone)
**Requirements**: P0-01, P0-02, P0-03, P0-04, P0-05, P0-06
**Success Criteria** (what must be TRUE):
  1. After Phase 0 runs, the audit record contains a RepoContext object with primary language, package manager, detected frameworks, test framework, test file patterns, and CI system
  2. Phase 0 correctly identifies Python/Go/Rust/Java repos (not defaulting to TypeScript) when pointed at non-JS codebases
  3. LOC counts include .py, .go, .rs, .java, .kt, .rb, .php, .cs, .cpp, .c, and .swift files — not just .ts/.js
  4. Monorepo detection works for Cargo workspaces, Go modules, Gradle multi-project, and Maven multi-module — not only JS tooling
  5. RepoContext is persisted to the audit record and readable by all subsequent phase runners without re-running Phase 0
**Plans**: 2 plans

Plans:
- [x] 09-01-PLAN.md — Define RepoContext schema, add DB column, update shared helpers for typed access
- [x] 09-02-PLAN.md — Rewrite Phase 0 detection commands and LLM prompt for polyglot support

### Phase 10: Tool-Use Infrastructure
**Goal**: A sandboxed execCommand tool exists and all phase runners share a new contract: receive audit guide section + RepoContext, call execCommand as needed, return AuditFindings JSON
**Depends on**: Phase 9
**Requirements**: PRF-01, PRF-02, PRF-03, PRF-13, PRF-14
**Success Criteria** (what must be TRUE):
  1. A sandboxed execCommand tool is registered with the Vercel AI SDK — it rejects write, delete, and network commands, and enforces a timeout
  2. Phase runners accept a guide section string and RepoContext instead of running hardcoded shell commands before the LLM call
  3. The LLM prompt for every phase includes both the relevant audit guide section and the Phase 0 RepoContext
  4. All refactored phase runners still return the same AuditFindings JSON schema — existing results pages, charts, and reports render without modification
**Plans**: 1 plan

Plans:
- [x] 10-01-PLAN.md — Build sandboxed execCommand tool, tool-use phase runner helper, and updated prompt builder

### Phase 11: Phase Runner Adaptation
**Goal**: All nine phase runners (phases 1-9) are language-agnostic — each sends its guide section and RepoContext to the LLM and lets the LLM generate and execute appropriate commands for the detected stack
**Depends on**: Phase 10
**Requirements**: PRF-04, PRF-05, PRF-06, PRF-07, PRF-08, PRF-09, PRF-10, PRF-11, PRF-12
**Success Criteria** (what must be TRUE):
  1. Phase 1 (Orientation) discovers project structure and counts test files using commands appropriate for the detected language — not hardcoded TypeScript glob patterns
  2. Phase 2 (Dependency Health) runs the correct vulnerability audit tool for the stack: npm audit for Node, pip-audit for Python, cargo audit for Rust, go vuln for Go, etc.
  3. Phase 3 (Test Coverage) finds test files and measures coverage using language-appropriate test runner commands
  4. Phase 5 (Git History) churn analysis uses the detected language file extensions, not just *.ts/*.js
  5. Phase 6 (Security), Phase 7 (Deep Reads), Phase 8 (CI/CD), and Phase 9 (Documentation) all use language-appropriate patterns, CI config paths, and doc styles (docstrings, GoDoc, RustDoc, JavaDoc, JSDoc)
**Plans**: TBD

Plans:
- [ ] 11-01: Migrate phases 1-5 (Orientation, Dependency Health, Test Coverage, Code Complexity, Git History)
- [ ] 11-02: Migrate phases 6-9 (Security, Deep Reads, CI/CD, Documentation)

### Phase 12: Validation
**Goal**: The refactored audit engine produces equivalent results to v1.1 on TypeScript repos and meaningful, language-specific findings on Python and Go repos
**Depends on**: Phase 11
**Requirements**: VAL-01, VAL-02, VAL-03
**Success Criteria** (what must be TRUE):
  1. Running an audit on a TypeScript/Next.js repo produces findings with the same categories, severity distribution, and overall health score as a v1.1 audit of the same repo — no regression
  2. Running an audit on a Python repo surfaces Python-specific findings: pip/poetry dependency vulnerabilities, pytest coverage gaps, Python secret patterns, and docstring coverage
  3. Running an audit on a Go repo surfaces Go-specific findings: go module vulnerabilities, go test coverage, Go-style complexity, and GoDoc coverage
**Plans**: TBD

Plans:
- [ ] 12-01: Run validation audits on TypeScript, Python, and Go repos; document findings and fix regressions

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. App Shell & Config | v1.0 | 3/3 | Complete | 2026-03-22 |
| 2. Audit Engine | v1.0 | 3/3 | Complete | 2026-03-22 |
| 3. Results & Cost | v1.0 | 2/2 | Complete | 2026-03-22 |
| 4. History & Comparison | v1.0 | 2/2 | Complete | 2026-03-22 |
| 5. Design System & Shared Components | v1.1 | 2/2 | Complete | 2026-03-22 |
| 6. Shell & Onboarding | v1.1 | 2/2 | Complete | 2026-03-22 |
| 7. Audit Flows | v1.1 | 2/2 | Complete | 2026-03-22 |
| 8. Data Views | v1.1 | 3/3 | Complete | 2026-03-23 |
| 9. Phase 0 Enhancement | v1.2 | 2/2 | Complete | 2026-03-23 |
| 10. Tool-Use Infrastructure | v1.2 | 1/1 | Complete   | 2026-03-23 |
| 11. Phase Runner Adaptation | v1.2 | 0/TBD | Not started | - |
| 12. Validation | v1.2 | 0/TBD | Not started | - |

---
*Full v1.0 details archived in `.planning/milestones/v1.0-ROADMAP.md`*
*Full v1.1 details archived in `.planning/milestones/v1.1-ROADMAP.md`*
