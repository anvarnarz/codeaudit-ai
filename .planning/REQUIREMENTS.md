# Requirements: CodeAudit Web

**Defined:** 2026-03-21
**Core Value:** Anyone can get a thorough, structured codebase health audit on their GitHub repos without CLI setup — just connect GitHub, pick a repo, and run.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Access

- [ ] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can sign in and maintain a session across browser refresh
- [x] **AUTH-03**: User can sign in with GitHub SSO as an alternative to email/password
- [ ] **AUTH-04**: User can connect their GitHub account via OAuth to grant repo access
- [ ] **AUTH-05**: User can browse and select repositories from their connected GitHub account (personal and org repos)
- [ ] **AUTH-06**: User can store encrypted LLM API keys for Anthropic, OpenAI, and Gemini
- [ ] **AUTH-07**: User can update or delete their stored API keys
- [x] **AUTH-08**: User can sign out from any page

### Audit Configuration

- [ ] **CONF-01**: User can select audit type: full audit, security-only, team & collaboration, or code quality
- [ ] **CONF-02**: User can select audit depth: quick scan (~30 min) or deep audit (hours)
- [ ] **CONF-03**: User can select which LLM provider to use for the audit (from their stored keys)
- [ ] **CONF-04**: User sees a pre-audit cost estimate based on repo size, audit type, depth, and selected provider
- [ ] **CONF-05**: User can start an audit after reviewing the cost estimate

### Audit Execution

- [ ] **EXEC-01**: Backend clones the selected repo into a sandboxed read-only environment (no push, no write, no production URL access)
- [ ] **EXEC-02**: Backend runs Phase 0 bootstrap to auto-detect repo stack, structure, production URLs, contributors, and lines of code
- [ ] **EXEC-03**: Backend executes audit phases 1-10 as structured LLM API calls using the user's selected provider and key
- [ ] **EXEC-04**: Backend executes Phase 11 to generate interactive HTML reports (management + technical dashboards)
- [ ] **EXEC-05**: Audit engine supports all three LLM providers (Anthropic, OpenAI, Gemini) with provider-tuned prompts
- [ ] **EXEC-06**: Audit engine respects audit type selection by running only relevant phases (security-only runs Phases 0, 1, 6, 7a, 10, 11; team runs Phases 0, 1, 5, 10, 11; etc.)
- [ ] **EXEC-07**: Audit engine respects depth selection (quick scan uses sampling and phase subset; deep audit runs full process)
- [ ] **EXEC-08**: Backend cleans up cloned repo data after audit completes or fails
- [ ] **EXEC-09**: Backend handles audit job failures gracefully — checkpoints progress so audits can be resumed

### Live Progress

- [ ] **PROG-01**: User sees a simplified progress view showing current phase and overall percentage while audit runs
- [ ] **PROG-02**: User can expand the progress view to see detailed phase-by-phase status with findings count per phase
- [ ] **PROG-03**: User sees real-time token usage and estimated cost during the audit
- [ ] **PROG-04**: User can leave the page and return to see current progress (progress persists server-side)
- [ ] **PROG-05**: User receives a notification (in-app or email) when the audit completes

### Results Dashboard

- [ ] **DASH-01**: User can view audit findings in an in-app dashboard with scores, severity breakdown, and findings list
- [ ] **DASH-02**: User can filter and sort findings by severity (Critical, High, Medium, Low, Info)
- [ ] **DASH-03**: User can view the executive/management report and the technical report as separate views
- [ ] **DASH-04**: User can download full audit reports (HTML dashboards + markdown reports) as a zip file
- [ ] **DASH-05**: Findings include file paths, line numbers, evidence, and remediation suggestions

### Audit History & Comparison

- [ ] **HIST-01**: User can view a list of all past audits per repo with date, type, depth, and overall score
- [ ] **HIST-02**: User can view the full results of any past audit
- [ ] **HIST-03**: When a repo has two or more audits, user can generate a comparison report showing what improved, degraded, or stayed the same
- [ ] **HIST-04**: Comparison report highlights specific findings that were resolved or introduced since the previous audit

### Budget & Cost

- [ ] **COST-01**: User sees total tokens used and total cost after an audit completes
- [ ] **COST-02**: User sees a budget warning if the audit is consuming significantly more tokens than estimated
- [ ] **COST-03**: User can cancel a running audit at any time

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Multi-Repo Analysis

- **MULTI-01**: User can select multiple repos for cross-repo product audit
- **MULTI-02**: Backend runs the multi-repo review guide (Phases MR-1 through MR-8)
- **MULTI-03**: User sees a unified product health report across repos
- **MULTI-04**: Cross-repo comparison detects API mismatches, auth flow gaps, config drift

### Extended Integrations

- **INTG-01**: User can connect GitLab account for repo access
- **INTG-02**: User can connect Bitbucket account for repo access
- **INTG-03**: User can schedule recurring audits (weekly, monthly)
- **INTG-04**: User can share audit report via public link (read-only)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Automated fix / PR generation | Requires write access — destroys the read-only safety model that is the product's core security guarantee |
| Real-time collaborative annotation | Multiplies infrastructure complexity (websockets, presence, conflict resolution) before core value is validated |
| IDE plugin / extension | Separate release channels with different auth models; high maintenance for greenfield |
| Continuous monitoring (webhook triggers) | LLM audits cost real money on BYOK — auto-triggering creates runaway costs |
| Self-hosted / on-premise deployment | Dramatically increases ops burden; wrong focus for v1 |
| GitLab / Bitbucket support | Multiplies OAuth/API surface area before GitHub path is proven |
| Public leaderboard / benchmarking | Incentivizes gaming metrics; legal risk with proprietary code |
| Mobile app | Web-first; responsive design sufficient for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 1 | Pending |
| AUTH-07 | Phase 1 | Pending |
| AUTH-08 | Phase 1 | Complete |
| CONF-01 | Phase 2 | Pending |
| CONF-02 | Phase 2 | Pending |
| CONF-03 | Phase 2 | Pending |
| CONF-04 | Phase 2 | Pending |
| CONF-05 | Phase 2 | Pending |
| EXEC-01 | Phase 2 | Pending |
| EXEC-02 | Phase 3 | Pending |
| EXEC-03 | Phase 3 | Pending |
| EXEC-04 | Phase 3 | Pending |
| EXEC-05 | Phase 3 | Pending |
| EXEC-06 | Phase 3 | Pending |
| EXEC-07 | Phase 3 | Pending |
| EXEC-08 | Phase 3 | Pending |
| EXEC-09 | Phase 3 | Pending |
| PROG-01 | Phase 3 | Pending |
| PROG-02 | Phase 3 | Pending |
| PROG-03 | Phase 3 | Pending |
| PROG-04 | Phase 3 | Pending |
| PROG-05 | Phase 3 | Pending |
| DASH-01 | Phase 4 | Pending |
| DASH-02 | Phase 4 | Pending |
| DASH-03 | Phase 4 | Pending |
| DASH-04 | Phase 4 | Pending |
| DASH-05 | Phase 4 | Pending |
| HIST-01 | Phase 5 | Pending |
| HIST-02 | Phase 5 | Pending |
| HIST-03 | Phase 5 | Pending |
| HIST-04 | Phase 5 | Pending |
| COST-01 | Phase 4 | Pending |
| COST-02 | Phase 3 | Pending |
| COST-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after roadmap creation*
