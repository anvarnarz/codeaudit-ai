# How to Run a Multi-Repo Product Audit
**Audience:** CTO / Tech Lead  
**Use when:** Your product spans 2+ repositories (e.g., backend + frontend + landing)  
**Time required:** Individual audits first (~4–6h per repo), then cross-repo analysis (~2–3h)  
**Cost:** Cross-repo phase adds ~$5–15 on top of individual audit costs

---

## What you have

| File | Purpose |
|---|---|
| `CLAUDE.md` | Single-repo audit rules (per-repo safety guardrails) |
| `codebase_review_guide.md` | Single-repo audit playbook (run once per repo) |
| `CLAUDE_MULTI_REPO.md` | Cross-repo audit rules (product-level guardrails) |
| `multi_repo_review_guide.md` | Cross-repo analysis playbook (run once for the whole product) |
| This file | Instructions for you |

---

## The two-stage approach

**Stage 1** audits each repo individually — security, tests, code quality, team.

**Stage 2** audits how the repos connect — API contracts, auth flow, config drift,
deployment coupling, cross-repo security. These integration issues are the ones
that cause production incidents and are invisible to single-repo analysis.

```
Stage 1: Individual audits (existing guide, run per repo)
  ├── ~/audit-backend/   → codebase_health.md, reports
  ├── ~/audit-frontend/  → codebase_health.md, reports
  └── ~/audit-landing/   → codebase_health.md, reports

Stage 2: Cross-repo analysis (THIS guide)
  └── ~/audit-myproduct/ → product_health.md, unified reports
```

---

## Stage 1 — Run individual audits

Follow the standard `how_to_run_codebase_audit.md` for each repo. Quick reference:

```bash
# Repo 1 — Backend
cd ~/Projects/backend
git remote set-url --push origin no_push
chmod -R a-w . && chmod -R a-w .git
mkdir -p ~/audit-backend
cp /path/to/CLAUDE.md /path/to/codebase_review_guide.md ~/audit-backend/
cd ~/audit-backend
claude --dangerously-skip-permissions
# Paste single-repo audit prompt, wait for completion

# Repo 2 — Frontend
cd ~/Projects/frontend
git remote set-url --push origin no_push
chmod -R a-w . && chmod -R a-w .git
mkdir -p ~/audit-frontend
cp /path/to/CLAUDE.md /path/to/codebase_review_guide.md ~/audit-frontend/
cd ~/audit-frontend
claude --dangerously-skip-permissions
# Paste single-repo audit prompt, wait for completion

# Repo 3 — Landing
cd ~/Projects/landing
git remote set-url --push origin no_push
chmod -R a-w . && chmod -R a-w .git
mkdir -p ~/audit-landing
cp /path/to/CLAUDE.md /path/to/codebase_review_guide.md ~/audit-landing/
cd ~/audit-landing
claude --dangerously-skip-permissions
# Paste single-repo audit prompt, wait for completion
```

Each audit produces its own `codebase_health.md`, `findings.md`, and HTML reports.
**All three must be complete before starting Stage 2.**

---

## Stage 2 — Run cross-repo analysis

### Setup

```bash
PRODUCT="myproduct"
mkdir -p ~/audit-${PRODUCT}
cp /path/to/CLAUDE_MULTI_REPO.md ~/audit-${PRODUCT}/CLAUDE.md
cp /path/to/multi_repo_review_guide.md ~/audit-${PRODUCT}/
```

### Start Claude Code

```bash
cd ~/audit-${PRODUCT}
claude --dangerously-skip-permissions
```

### Paste the cross-repo prompt

```
Read multi_repo_review_guide.md. This is a cross-repo product audit.

The repos are (all read-only):
- Backend: ~/Projects/backend (individual audit at ~/audit-backend/)
- Frontend: ~/Projects/frontend (individual audit at ~/audit-frontend/)
- Landing: ~/Projects/landing (individual audit at ~/audit-landing/)

Run Phase 0 bootstrap first. Then execute all phases in order.
Write findings to findings.md. Produce the unified product health report
and HTML dashboards.

Start now.
```

Adjust paths and repo names to match your setup.

---

## What the cross-repo analysis finds

Things that NO single-repo audit can detect:

| Issue type | Example |
|---|---|
| **API contract mismatch** | Frontend calls `/api/v2/users`, backend only has `/api/v1/users` |
| **Auth flow gap** | Backend issues JWT with RS256, frontend verifies with HS256 |
| **Config drift** | `JWT_SECRET` is different in backend and auth service `.env` |
| **Deployment coupling** | Backend migration adds required column, frontend deploy breaks if it goes first |
| **Shared type divergence** | `User` interface in frontend has 12 fields, backend DTO has 15 |
| **CORS misconfiguration** | Backend allows `*.example.com`, landing is on `example.com` (no wildcard match) |
| **Cookie scope leak** | Session cookie domain `.example.com` readable by landing page |
| **Duplicated logic** | Date formatting function copied across 3 repos, each slightly different |
| **Unprotected endpoints** | Backend marks endpoint public, but frontend assumes it's authenticated |
| **Missing error handling** | Frontend calls endpoint X, backend returns 422 with custom shape, frontend only handles 400/500 |

---

## What you get when it's done

### Per-repo (from Stage 1)
- `~/audit-backend/codebase_health.md` — backend-specific report
- `~/audit-frontend/codebase_health.md` — frontend-specific report
- `~/audit-landing/codebase_health.md` — landing-specific report
- Individual HTML reports for each repo

### Product-level (from Stage 2)
- `~/audit-{product}/product_health.md` — unified markdown report
- `~/audit-{product}/report_management_YYYY-MM-DD.html` — management dashboard covering the full product
- `~/audit-{product}/report_technical_YYYY-MM-DD.html` — CTO dashboard with API diffs, auth flow, config matrix
- `~/audit-{product}/history/YYYY-MM-DD/` — archived for future comparison

### If previous product audit exists
- Comparison reports (markdown + management HTML + CTO HTML) showing what changed across the full product

---

## Run modes

### Full product audit

Run all three individual audits, then the cross-repo analysis. Most thorough.

### Cross-repo only (if individual audits already exist)

```
Read multi_repo_review_guide.md.
Individual audits are already complete. Skip Phase 0 and 1 — go directly
to Phase 2 (API contracts). Run through Phase 10.
```

### Integration-focused audit (~90 min)

If you only care about how repos connect:

```
Read multi_repo_review_guide.md.
Run Phase 0 (bootstrap).
Then Phase 2 (API contracts), Phase 3 (auth flow), Phase 4 (config drift).
Then Phase 9 (report) focusing on integration findings only.
Skip team analysis, deployment coupling, and HTML reports.
```

---

## Quick reference

| Task | Command |
|---|---|
| Start cross-repo audit | `cd ~/audit-{product} && claude --dangerously-skip-permissions` |
| View product report | `cat ~/audit-{product}/product_health.md` |
| View management dashboard | `open ~/audit-{product}/report_management.html` |
| View technical dashboard | `open ~/audit-{product}/report_technical.html` |
| View individual repo report | `cat ~/audit-{repo-name}/codebase_health.md` |
| Check progress | `source ~/audit-{product}/progress.sh && show_progress` |
| View audit history | `ls ~/audit-{product}/history/` |

---

## Tips

- **Run individual audits first, always.** The cross-repo analysis reads their findings — it doesn't re-scan code that's already been audited.
- **Lock all repos read-only** before starting anything. The cross-repo phase reads from multiple repos — all must be `chmod`-locked.
- **The most valuable phases are 2 (API contracts) and 3 (auth flow).** If budget is tight, run only those.
- **Re-run quarterly.** The `history/` folder accumulates timestamped snapshots, and the comparison phase shows product-level trends.
- **The cross-repo analysis works for any number of repos** — 2, 3, 10, or more. Just list them all in the prompt.

---

*Multi-repo audit guide · March 2026*
