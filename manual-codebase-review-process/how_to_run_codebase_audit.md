# How to Run a Codebase Audit with Claude Code
**Audience:** CTO / Tech Lead  
**Time required:** 4–6 hours for full audit (can be split across sessions)  
**Cost:** $5–20 for typical repos, $20–50 for large repos (5,000+ files)  
**Manual setup:** ~5 minutes (clone, lock read-only, copy audit files)

---

## What you have

| File | Purpose |
|---|---|
| `CLAUDE.md` | Safety rules + a bootstrap script that auto-detects your repo's stack, production URLs, contributors, and structure. Claude Code reads this automatically. |
| `codebase_review_guide.md` | The 13-phase audit playbook (Phase 0–12) with every command Claude Code will run. |
| This file | Instructions for you — how to set up and launch the audit. |

**No config files to edit.** The bootstrap auto-detects everything. The only
manual step is locking the repo read-only before starting.

---

## Setup (5 minutes)

### 1. Install Claude Code (if not already)

```bash
npm install -g @anthropic-ai/claude-code
```

You need a Pro, Max, or Team plan. An audit typically costs $5–20 of API usage.

### 2. Clone the repo, block push, then lock read-only

```bash
git clone https://github.com/your-org/your-repo.git
cd your-repo

# Block push FIRST (while .git/config is still writable)
git remote set-url --push origin no_push

# THEN lock the entire repo read-only
chmod -R a-w .
chmod -R a-w .git
```

**Why this order matters:** The `chmod` makes every file read-only,
including `.git/config`. If you lock first, `git remote set-url` fails
because it can't write to `.git/config`. Push block first, then lock.

### 3. Set up the audit workspace

```bash
# Create audit directory and place both files there
mkdir -p ~/audit-$(basename $(pwd))
cp /path/to/CLAUDE.md ~/audit-$(basename $(pwd))/
cp /path/to/codebase_review_guide.md ~/audit-$(basename $(pwd))/
```

### 4. Start Claude Code from the audit directory

```bash
cd ~/audit-$(basename $(pwd))
claude
```

Since the repo is read-only, start Claude Code from the audit directory
(where CLAUDE.md lives and where it can write findings). Tell it where
the repo is in your first message.

---

## Run the audit

### Start Claude Code

```bash
claude
```

Launch it from the repo root (where you placed CLAUDE.md). Claude Code picks up CLAUDE.md automatically.

### Give it the audit instruction

Paste this (adjust the repo path):

```
Read codebase_review_guide.md in this directory. This is your audit playbook.
The repo to audit is at ~/your-repo/ (read-only — do not attempt to write to it).

First, run the Phase 0 bootstrap script from CLAUDE.md. It will auto-detect 
the repo context and write results here. Show me the detected context 
before proceeding.

Then execute Phases 1 through 12 in order. Write all findings to 
findings.md (append only). Write the final report to codebase_health.md.
Then generate both interactive HTML reports (management and technical).
If a previous audit exists in the history/ folder, run Phase 12 to 
generate comparison reports.

Run /compact after each phase. Checkpoint progress before each phase 
transition.

Start now.
```

### What happens next

1. **Phase 0 (Bootstrap, ~2 min)** — Claude Code runs the detection script. It will show you what it found: repo name, stack, production URLs, contributors, lines of code. **Glance at the production URLs list** — if anything's missing or wrong, tell Claude Code before it continues.

2. **Phase 1 (Orientation + estimation, ~30 min)** — After scanning the repo structure, Claude Code produces a **work volume estimation** that measures every dimension of the repo and calculates per-phase token, time, and cost estimates. You'll see a summary box like:

```
╔══════════════════════════════════════════════════════════════╗
║                  WORK VOLUME ESTIMATION                      ║
╠══════════════════════════════════════════════════════════════╣
║  Repo tier:        L — Large (mature product)                ║
║  Source files:      3,847                                    ║
║  Lines of code:     412,000                                  ║
║  Commits (12mo):    2,150                                    ║
║  Contributors:      12                                       ║
║                                                              ║
║  Est. total tokens: ~8,500,000                               ║
║  Est. total time:   5h 20m                                   ║
║  Est. cost range:   $12 – $28 (with caching)                 ║
║                                                              ║
║  ⚠️  Recommendation:  PROCEED with sampling                  ║
╚══════════════════════════════════════════════════════════════╝
```

The full per-phase breakdown is saved to `~/audit-{repo-name}/work_volume_estimate.md`. For large/XL repos, Claude Code will ask you to confirm before continuing — and suggest which phases to skip or split across sessions.

3. **Phases 2–12 (~3–5 hours)** — The rest of the audit runs with automatic budget checks at three gates (before security, before deep reads, before HTML reports). It produces the markdown report, generates two interactive HTML dashboards, and — if a previous audit exists in the `history/` folder — automatically compares them and generates management and CTO comparison reports showing what improved, what degraded, and what's been ignored.

You can watch or walk away. If it hits a rate limit, it will have saved progress.

### Progress checklist

The bootstrap creates a visual progress tracker. At each phase boundary, Claude Code prints a checklist to the terminal showing what's done, what's running, and what's pending:

```
╔══════════════════════════════════════════════════════╗
║              CODEBASE AUDIT PROGRESS                 ║
╠══════════════════════════════════════════════════════╣
║  ✔  Phase 0:  Bootstrap (auto-detect repo context)
║  ✔  Phase 1:  Orientation (structure, file counts)
║  ✔  Phase 2:  Dependency health
║  ✔  Phase 3:  Test coverage
║  ▶  Phase 4:  Code complexity & duplication  ← in progress
║  ○  Phase 5:  Git archaeology
║  ○  Phase 5e: Team — per-contributor performance
║  ○  Phase 5f: Team — PR & merge review patterns
║  ○  Phase 5g: Team — DORA metrics (lite)
║  ○  Phase 6a: Security — secrets & credentials
║  ...
║  ○  Phase 10: Produce final report
║  ○  Phase 11a: HTML report — management
║  ○  Phase 11b: HTML report — technical
║  ○  Phase 12a: Comparison — markdown diff
║  ○  Phase 12b: Comparison — management HTML
║  ○  Phase 12c: Comparison — CTO HTML
╠══════════════════════════════════════════════════════╣
║  Progress: 4 / 31 phases complete
╚══════════════════════════════════════════════════════╝
```

You can check progress at any time from a separate terminal:

```bash
source ~/audit-{repo-name}/progress.sh && show_progress
```

---

## What the bootstrap auto-detects

| Data point | How it's detected |
|---|---|
| Repo name | `git rev-parse --show-toplevel` or directory name |
| Repo URL | `git remote get-url origin` |
| Stack & frameworks | Presence of manifest files (package.json, go.mod, Cargo.toml, etc.) |
| Production URLs | Extracted from .env files, config files, and source code URL patterns |
| Monorepo structure | Checks for workspaces in package.json, lerna.json, pnpm-workspace.yaml |
| Lines of code | File count across all detected languages |
| Contributors | `git shortlog` for the last 12 months |
| Default branch | `git symbolic-ref` on origin/HEAD |
| Current commit | `git rev-parse HEAD` |

Everything is written to `~/audit-{repo-name}/repo_context.md` for transparency.

---

## Run modes

### Full audit (recommended)

Use the prompt above. Takes 4–6 hours, covers everything including HTML reports.

### Security-only audit (~90 min)

```
Read codebase_review_guide.md. Run Phase 0 (bootstrap) first.
Then run Phase 1 (Orientation) to understand the structure.
Then run Phase 6 (Security audit) — all sub-phases 6a through 6f.
Then run Phase 7a (Payment/billing deep read) if applicable.
Then produce the final report (Phase 10), focusing on security findings only.
Then generate both HTML reports (Phase 11).
If a previous audit exists in history/, run Phase 12.
Write everything to findings.md.
```

### Team & collaboration audit (~60 min)

```
Read codebase_review_guide.md. Run Phase 0 (bootstrap) first.
Then run Phase 1 (Orientation).
Then run Phase 5 (Git archaeology) — all sub-phases 5a through 5g.
This covers churn, ownership, per-contributor performance, PR review 
patterns, and DORA metrics.
Then produce the final report (Phase 10), focusing on team findings only.
Then generate both HTML reports (Phase 11).
If a previous audit exists in history/, run Phase 12.
Write everything to findings.md.
```

### Phase by phase (maximum control)

```
Read codebase_review_guide.md. Run Phase 0 (bootstrap) and show me the context.
```

Then after each phase completes:

```
Run Phase [N] now. Append findings to ~/audit-{repo-name}/findings.md.
```

This lets you adjust focus between phases based on what's been found.

---

## What you get when it's done

Two files in `~/audit-{repo-name}/`:

### `findings.md` — raw findings

Chronological log of everything discovered, per phase. Each finding includes severity, evidence (file paths + line numbers), and implications. Security findings include attack vectors and remediation steps.

### `codebase_health.md` — executive report

Structured summary with:

- **Scorecard** — 20 dimensions scored out of 10
- **Critical findings** — needs immediate attention
- **Security findings** — grouped by severity
- **Team & contributor analysis** — per-person commit stats, code review culture, DORA metrics, knowledge silos, bus factor risks
- **High-risk files** — the 10 files that need the most care
- **Bus factor risks** — areas with single-person ownership
- **Beyond this audit** — checklist of things that need DB, server, Sentry, or human access to investigate (so you know what to do next)
- **Recommended next steps** — prioritised action list

### Also in the directory

- `repo_context.md` — auto-detected stack, URLs, contributors (from bootstrap)
- `work_volume_estimate.md` — per-phase token/time/cost estimates with recommendations
- `budget_log.md` — token cost at each phase boundary
- `report_management_YYYY-MM-DD.html` — timestamped management dashboard
- `report_technical_YYYY-MM-DD.html` — timestamped technical dashboard
- `report_management.html` — convenience copy (latest, no timestamp)
- `report_technical.html` — convenience copy (latest, no timestamp)
- `history/YYYY-MM-DD/` — archived copies of all artifacts for this audit run
- `progress.sh` — the progress tracker
- `.phase_state` — raw state file used by the tracker

**If a previous audit exists, you also get:**

- `comparison_PREV-DATE_vs_CURR-DATE.md` — markdown diff between audits
- `report_comparison_management_YYYY-MM-DD.html` — management comparison dashboard
- `report_comparison_technical_YYYY-MM-DD.html` — CTO comparison dashboard

---

## Resuming after interruptions

If Claude Code hits a rate limit or you need to stop:

1. Findings are already saved — the checkpoint system writes after every phase
2. Check where it stopped: `cat ~/audit-{repo-name}/findings.md | grep "Checkpoint"`
3. Restart Claude Code and tell it:

```
Read codebase_review_guide.md and ~/audit-{repo-name}/findings.md.
Resume the audit from Phase [X]. Do not repeat completed phases.
```

---

## Running on multiple repos

```bash
# For each repo:
git clone <repo-url>
cd <repo-name>
git remote set-url --push origin no_push   # push block FIRST
chmod -R a-w . && chmod -R a-w .git        # THEN lock filesystem
mkdir -p ~/audit-$(basename $(pwd))
cp /path/to/CLAUDE.md /path/to/codebase_review_guide.md ~/audit-$(basename $(pwd))/
cd ~/audit-$(basename $(pwd))
claude
# Paste the audit prompt — bootstrap handles the rest
```

Each audit auto-creates its own directory (`~/audit-frontend/`, `~/audit-backend/`, etc.), so there's no conflict between repos. You'll find each repo's findings at:

```
~/audit-frontend/findings.md
~/audit-frontend/codebase_health.md
~/audit-backend/findings.md
~/audit-backend/codebase_health.md
```

---

## Tips

- **Always lock the repo read-only** (`chmod -R a-w .`) before starting. This is the one step that actually prevents damage. Everything else is defence in depth.
- **Don't use `--dangerously-skip-permissions` unless the repo is locked.** In normal mode, Claude Code asks before running commands — that's a safety net you want. If you do skip permissions for speed, the filesystem lock is your only protection.
- **Let it run autonomously.** The full-audit prompt produces the most consistent results because Claude Code doesn't lose context between phases.
- **If a phase produces sparse results**, the codebase is likely healthy in that area. Sparse is good.
- **Cross-reference with your team.** Claude Code sees code, not context — some findings may be intentional trade-offs.
- **Re-run quarterly.** Track the scorecard over time to measure improvement.
- **After the audit**, unlock the repo with `chmod -R u+w .` if you need to work on it again.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Claude Code not reading CLAUDE.md | Make sure CLAUDE.md is in the directory where you ran `claude` |
| "Permission denied" errors during audit | **This is expected and correct.** It means the read-only lock is working. Claude Code should only write to the audit directory, not the repo. If it's trying to write to the repo, it's violating the rules — the `chmod` caught it. |
| Claude Code tries `npm install` or `git commit` | The read-only filesystem blocks it. No harm done. Tell Claude Code to skip that step. |
| Bootstrap can't write `repo_context.md` | You're probably running from inside the locked repo. Run Claude Code from the audit directory instead: `cd ~/audit-{repo-name} && claude` |
| Bootstrap misses production URLs | Tell Claude Code: "Add https://api.example.com to the blocked URLs list in repo_context.md" |
| Bootstrap detects wrong stack | Tell Claude Code: "The stack is actually X — update repo_context.md" |
| Rate limit hit mid-audit | Wait for reset, then resume from the last checkpoint |
| Audit costs more than expected | Check `budget_log.md` — tell Claude Code to skip Phase 11 or use sampling mode |
| No budget_log.md created | Claude Code should run `/cost` after Phase 1 — remind it to follow the budget monitoring rules in CLAUDE.md |
| Audit dir name looks wrong | The bootstrap names it `~/audit-{repo-name}/` using the git root directory name — rename manually if needed |
| Want to undo the read-only lock | Run `chmod -R u+w ~/your-repo` after the audit is complete |
| `npm audit` fails | Repo may not have node_modules installed — Claude Code notes this and moves on |
| Empty findings for a phase | Either the codebase is clean there, or grep patterns don't match the stack — Claude Code adapts |

---

## Quick reference

| Task | Command |
|---|---|
| Start audit | `cd your-repo && claude` |
| Check token usage | `/stats` inside Claude Code |
| Flush context | `/compact` inside Claude Code |
| Cancel a command | `Ctrl+C` |
| View findings so far | `cat ~/audit-{repo-name}/findings.md` in another terminal |
| View final report | `cat ~/audit-{repo-name}/codebase_health.md` |
| View management dashboard | `open ~/audit-{repo-name}/report_management.html` |
| View technical dashboard | `open ~/audit-{repo-name}/report_technical.html` |
| View comparison (management) | `open ~/audit-{repo-name}/report_comparison_management.html` |
| View comparison (CTO) | `open ~/audit-{repo-name}/report_comparison_technical.html` |
| View audit history | `ls ~/audit-{repo-name}/history/` |
| See what was auto-detected | `cat ~/audit-{repo-name}/repo_context.md` |
| Check audit progress | `source ~/audit-{repo-name}/progress.sh && show_progress` |
| View work volume estimate | `cat ~/audit-{repo-name}/work_volume_estimate.md` |
| View budget log | `cat ~/audit-{repo-name}/budget_log.md` |

---

*Guide version: March 2026*
