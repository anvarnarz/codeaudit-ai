# Requirements: CodeAudit

**Defined:** 2026-03-22 (restructured after local-first pivot)
**Core Value:** Anyone can run a thorough codebase audit on any local codebase without CLI setup — just open the app, pick a folder, and run.

## v1 Requirements

### Local Setup & Configuration

- [ ] **SETUP-01**: User can open the app in their browser at localhost after running one start command
- [ ] **SETUP-02**: User can add, update, and delete encrypted LLM API keys for Anthropic, OpenAI, and Gemini
- [ ] **SETUP-03**: User can store multiple keys per provider with labels (e.g., "Personal", "Work")
- [ ] **SETUP-04**: API keys are validated on entry via test API call to the selected provider

### Folder Selection & Safety

- [ ] **FOLD-01**: User can select a local folder to audit via folder picker or path input
- [ ] **FOLD-02**: App locks the target folder read-only (chmod -R a-w) before audit starts
- [ ] **FOLD-03**: App blocks git push on the target folder (git remote set-url --push origin no_push)
- [ ] **FOLD-04**: App creates a separate audit output directory (~/audit-{repo-name}/) for all findings
- [ ] **FOLD-05**: App unlocks the folder after audit completes or is cancelled

### Audit Configuration

- [ ] **CONF-01**: User can select audit type: full audit, security-only, team & collaboration, or code quality
- [ ] **CONF-02**: User can select audit depth: quick scan (~30 min) or deep audit (hours)
- [ ] **CONF-03**: User can select which LLM provider and key to use for the audit
- [ ] **CONF-04**: User sees a pre-audit cost estimate based on folder size, audit type, depth, and provider
- [ ] **CONF-05**: User can start an audit after reviewing the cost estimate

### Audit Execution

- [ ] **EXEC-01**: App runs Phase 0 bootstrap to auto-detect repo stack, structure, production URLs, contributors, and lines of code
- [ ] **EXEC-02**: App executes audit phases 1-10 as structured LLM API calls using the user's selected provider and key
- [ ] **EXEC-03**: App executes Phase 11 to generate interactive HTML reports (management + technical dashboards)
- [ ] **EXEC-04**: Audit engine supports all three LLM providers (Anthropic, OpenAI, Gemini) with provider-tuned prompts
- [ ] **EXEC-05**: Audit engine respects audit type selection by running only relevant phases
- [ ] **EXEC-06**: Audit engine respects depth selection (quick scan uses sampling and phase subset; deep audit runs full process)
- [ ] **EXEC-07**: App writes all output to the audit directory, never to the target folder
- [ ] **EXEC-08**: App handles audit failures gracefully — checkpoints progress so audits can be resumed
- [ ] **EXEC-09**: App cleans up (unlocks folder) after audit completes or fails

### Live Progress

- [ ] **PROG-01**: User sees a simplified progress view showing current phase and overall percentage while audit runs
- [ ] **PROG-02**: User can expand the progress view to see detailed phase-by-phase status with findings count per phase
- [ ] **PROG-03**: User sees real-time token usage and estimated cost during the audit
- [ ] **PROG-04**: User can leave the browser tab and return to see current progress (state persists server-side on localhost)
- [ ] **PROG-05**: User can cancel a running audit at any time

### Results Dashboard

- [ ] **DASH-01**: User can view audit findings in an in-app dashboard with scores, severity breakdown, and findings list
- [ ] **DASH-02**: User can filter and sort findings by severity (Critical, High, Medium, Low, Info)
- [ ] **DASH-03**: User can view the executive/management report and the technical report as separate views
- [ ] **DASH-04**: User can download full audit reports (HTML dashboards + markdown reports) as a zip file
- [ ] **DASH-05**: Findings include file paths, line numbers, evidence, and remediation suggestions

### Audit History & Comparison

- [ ] **HIST-01**: User can view a list of all past audits per folder with date, type, depth, and overall score
- [ ] **HIST-02**: User can view the full results of any past audit
- [ ] **HIST-03**: When a folder has two or more audits, user can generate a comparison report showing improvements/degradations
- [ ] **HIST-04**: Comparison report highlights specific findings that were resolved or introduced since the previous audit

### Budget & Cost

- [ ] **COST-01**: User sees total tokens used and total cost after an audit completes
- [ ] **COST-02**: User sees a budget warning if the audit is consuming significantly more tokens than estimated
- [ ] **COST-03**: User can cancel a running audit at any time and sees the cost incurred

## v2 Requirements

### Multi-Repo Analysis

- **MULTI-01**: User can select multiple local folders for cross-repo product audit
- **MULTI-02**: App runs the multi-repo review guide
- **MULTI-03**: User sees a unified product health report across folders

### Distribution

- **DIST-01**: App can be distributed as a single installable package (npm global, Homebrew, or binary)
- **DIST-02**: App auto-updates when new versions are available

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud/SaaS deployment | Local-first tool — no server infrastructure |
| GitHub OAuth / remote repo access | Users point at local folders — no remote access needed |
| Automated fix/PR generation | Read-only audit, no code modifications |
| Real-time collaborative annotation | Single-user local tool |
| IDE plugin / extension | Web UI is the interface |
| Continuous monitoring | Local tool, runs on demand |
| Mobile app | Desktop browser only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | TBD | Pending |
| SETUP-02 | TBD | Pending |
| SETUP-03 | TBD | Pending |
| SETUP-04 | TBD | Pending |
| FOLD-01 | TBD | Pending |
| FOLD-02 | TBD | Pending |
| FOLD-03 | TBD | Pending |
| FOLD-04 | TBD | Pending |
| FOLD-05 | TBD | Pending |
| CONF-01 | TBD | Pending |
| CONF-02 | TBD | Pending |
| CONF-03 | TBD | Pending |
| CONF-04 | TBD | Pending |
| CONF-05 | TBD | Pending |
| EXEC-01 | TBD | Pending |
| EXEC-02 | TBD | Pending |
| EXEC-03 | TBD | Pending |
| EXEC-04 | TBD | Pending |
| EXEC-05 | TBD | Pending |
| EXEC-06 | TBD | Pending |
| EXEC-07 | TBD | Pending |
| EXEC-08 | TBD | Pending |
| EXEC-09 | TBD | Pending |
| PROG-01 | TBD | Pending |
| PROG-02 | TBD | Pending |
| PROG-03 | TBD | Pending |
| PROG-04 | TBD | Pending |
| PROG-05 | TBD | Pending |
| DASH-01 | TBD | Pending |
| DASH-02 | TBD | Pending |
| DASH-03 | TBD | Pending |
| DASH-04 | TBD | Pending |
| DASH-05 | TBD | Pending |
| HIST-01 | TBD | Pending |
| HIST-02 | TBD | Pending |
| HIST-03 | TBD | Pending |
| HIST-04 | TBD | Pending |
| COST-01 | TBD | Pending |
| COST-02 | TBD | Pending |
| COST-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 0
- Unmapped: 39 ⚠️

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after local-first pivot*
