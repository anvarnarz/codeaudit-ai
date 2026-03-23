# Requirements: CodeAudit AI v1.2

**Defined:** 2026-03-23
**Core Value:** Anyone can run a thorough codebase audit on any local folder without CLI setup — just open the app, pick a folder, and run.

## v1.2 Requirements

Replace hardcoded JS/TS shell commands in all phase runners with LLM-driven command generation. Phase 0 provides enriched repo context; phases 1-9 send the audit guide section + context to the LLM and let it decide what commands to run. Same structured output schema — UI unchanged.

### Phase 0 Enhancement (P0)

- [x] **P0-01**: Phase 0 outputs a structured RepoContext that includes primary language(s), package manager (npm/pip/cargo/go mod/maven/etc.), and detected frameworks
- [x] **P0-02**: Phase 0 detects test framework (jest/pytest/go test/cargo test/junit/etc.) and test file patterns
- [x] **P0-03**: Phase 0 detects CI system (GitHub Actions, GitLab CI, Jenkins, CircleCI, etc.) by checking for config files
- [x] **P0-04**: Phase 0 LOC counting covers all common languages (py, go, rs, java, kt, rb, php, cs, cpp, c, swift) not just ts/js
- [x] **P0-05**: Phase 0 detects monorepo tools beyond JS (Cargo workspaces, Go modules, Gradle multi-project, Maven multi-module)
- [x] **P0-06**: RepoContext is stored in the audit record and available to all subsequent phases

### Phase Runner Refactor (PRF)

- [x] **PRF-01**: Each phase runner (1-9) sends the relevant audit guide section as the LLM prompt instead of hardcoded commands
- [x] **PRF-02**: Each phase runner includes the Phase 0 RepoContext in the LLM prompt so the LLM knows the stack
- [x] **PRF-03**: Phase runners use Vercel AI SDK tool-use to let the LLM execute shell commands (execCommand tool) rather than pre-running them
- [ ] **PRF-04**: Phase 1 (Orientation) works for any language — file discovery, structure analysis, test file counting adapted by LLM
- [ ] **PRF-05**: Phase 2 (Dependency Health) works for any language — LLM runs the right audit tool (npm audit, pip-audit, cargo audit, go vuln, etc.)
- [ ] **PRF-06**: Phase 3 (Test Coverage) works for any language — LLM finds tests using language-appropriate patterns
- [ ] **PRF-07**: Phase 4 (Code Complexity) works for any language — LLM counts functions/classes using language-appropriate patterns
- [ ] **PRF-08**: Phase 5 (Git History) file churn analysis covers detected language file extensions, not just *.ts
- [ ] **PRF-09**: Phase 6 (Security) searches for language-appropriate secret patterns, injection vectors, and env access
- [ ] **PRF-10**: Phase 7 (Deep Reads) discovers payment/auth/error handling code in any language
- [ ] **PRF-11**: Phase 8 (CI/CD) checks for all major CI systems, not just GitHub Actions
- [ ] **PRF-12**: Phase 9 (Documentation) counts doc coverage using language-native doc styles (docstrings, GoDoc, RustDoc, JavaDoc, JSDoc)
- [x] **PRF-13**: All refactored phases still output the same AuditFindings JSON schema — downstream UI/reports unchanged
- [x] **PRF-14**: The execCommand tool is sandboxed: read-only, no write/delete/network commands, timeout enforced

### Validation (VAL)

- [ ] **VAL-01**: Audit of a TypeScript/Next.js repo produces equivalent results to v1.1 (no regression)
- [ ] **VAL-02**: Audit of a Python repo produces meaningful findings (dependencies, tests, security, complexity detected)
- [ ] **VAL-03**: Audit of a Go repo produces meaningful findings (dependencies, tests, security, complexity detected)

## v2 Requirements

### Deferred

- **MULTI-01**: Multi-repo cross-product analysis
- **DIST-01**: npm global install / Homebrew distribution
- **METR-01**: Model accuracy/quality metrics display

## Out of Scope

| Feature | Reason |
|---------|--------|
| UI changes | v1.2 is backend-only; same AuditFindings schema, same pages |
| New audit phases | Same 13 phases, just language-agnostic implementation |
| Autonomous code fixing | Read-only audit — no write operations |
| Custom language plugins | LLM handles language adaptation dynamically |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| P0-01 | Phase 9 | Complete |
| P0-02 | Phase 9 | Complete |
| P0-03 | Phase 9 | Complete |
| P0-04 | Phase 9 | Complete |
| P0-05 | Phase 9 | Complete |
| P0-06 | Phase 9 | Complete |
| PRF-01 | Phase 10 | Complete |
| PRF-02 | Phase 10 | Complete |
| PRF-03 | Phase 10 | Complete |
| PRF-13 | Phase 10 | Complete |
| PRF-14 | Phase 10 | Complete |
| PRF-04 | Phase 11 | Pending |
| PRF-05 | Phase 11 | Pending |
| PRF-06 | Phase 11 | Pending |
| PRF-07 | Phase 11 | Pending |
| PRF-08 | Phase 11 | Pending |
| PRF-09 | Phase 11 | Pending |
| PRF-10 | Phase 11 | Pending |
| PRF-11 | Phase 11 | Pending |
| PRF-12 | Phase 11 | Pending |
| VAL-01 | Phase 12 | Pending |
| VAL-02 | Phase 12 | Pending |
| VAL-03 | Phase 12 | Pending |

**Coverage:**
- v1.2 requirements: 23 total (note: file header previously said 20 — actual count from listed requirements is 23)
- Mapped to phases: 23
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after roadmap creation*
