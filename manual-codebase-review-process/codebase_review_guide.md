# Codebase Review Guide — Claude Code
**Role:** Technical lead / CTO conducting engineering due diligence  
**Scope:** Read-only audit — architecture, code quality, security, test coverage, operational readiness  
**Constraint:** No file edits, no commits, no PRs — observation only  
**Style:** Autonomous — run each step to completion, log findings, proceed to the next

---

## How to use this guide

This is a universal codebase review template. Before starting:

1. Clone the target repo with read-only access
2. Copy the companion `CLAUDE.md` into your audit working directory
3. Fill in the `[PLACEHOLDERS]` in CLAUDE.md with repo-specific details
4. Run each phase sequentially — don't skip ahead
5. Write all findings to `~/audit-{repo-name}/findings.md` as you go

The guide is stack-agnostic. Each phase includes detection commands that identify the stack before running stack-specific analysis.

---

## Token budget reality check

Before running a single command, understand what you're working with.

### Estimating token cost for your repo

| Repo size | Files | Est. tokens (full read) | Est. cost (90% cached) |
|---|---|---|---|
| Small (startup MVP) | < 500 files | 1–5M tokens | $1–5 |
| Medium (established product) | 500–5,000 files | 5–25M tokens | $5–15 |
| Large (enterprise monorepo) | 5,000–20,000 files | 25–100M tokens | $15–50 |
| Very large (multi-service) | 20,000+ files | 100M+ tokens | Split across sessions |

Claude Code uses aggressive prompt caching — 90%+ of tokens become cache reads at $0.30/M instead of $3/M input. A full audit of a medium repo typically costs $5–15 of a monthly budget.

### Budget discipline rules

- Do NOT load the entire codebase at once — work module by module
- Use `/compact` after every phase to flush context
- Use `grep` before `cat` — find relevant lines first, then read context
- Use `head -100` on large files — read beginnings, not entireties
- Skip `node_modules/`, `vendor/`, `.venv/`, `target/`, `build/` — always filter these out
- If you hit a rate limit, checkpoint your findings and resume after the window resets

### Token monitoring (mandatory)

- Run `/cost` after Phase 1 and at every budget gate (before Phase 6, 7, and 11)
- Log every `/cost` check to `~/audit-{repo-name}/budget_log.md`
- Phase 1 produces a budget estimate based on repo size — show it to the user
- If cumulative cost exceeds $30, reduce grep result limits from `head -30` to `head -15`
- If cumulative cost exceeds $50, pause and ask the user before continuing
- The markdown report (Phase 10) takes priority over HTML reports (Phase 11)

See CLAUDE.md "TOKEN BUDGET MONITORING" section for full rules and gates.

---

## Setup — before touching the repo

### Step 0: Understand the safety model

CLAUDE.md contains rules that tell Claude Code not to modify the repo.
These are **instructions, not enforcement**. Claude Code follows them
as a strong convention, but there is no technical sandbox preventing
writes — especially in `--dangerously-skip-permissions` mode.

**The setup below adds real technical guardrails** that make it
physically impossible to corrupt the repo, regardless of what Claude
Code does. Always use these protections.

### Step 1: Clone the target repo

```bash
git clone <REPO_URL>
cd <REPO_NAME>
```

### Step 2: Block git push and lock the repo read-only

**Order matters — block push first, then lock the filesystem.**

```bash
# Step 2a: Block push FIRST (while .git/config is still writable)
git remote set-url --push origin no_push

# Verify push is blocked
git push --dry-run 2>&1 | grep -q "no_push\|fatal" && \
  echo "✅ Push is blocked" || echo "❌ Push NOT blocked"

# Step 2b: THEN lock the entire repo read-only
chmod -R a-w .
chmod -R a-w .git

# Verify it's locked
touch test_write 2>&1 | grep -q "Permission denied" && \
  echo "✅ Repo is read-only" || echo "❌ NOT locked"

# To undo after the audit:
# chmod -R u+w .
```

### Step 4: Place CLAUDE.md and this guide

```bash
# These go in the audit output directory, NOT inside the repo
# (since the repo is read-only)
mkdir -p ~/audit-$(basename $(pwd))
cp /path/to/CLAUDE.md ~/audit-$(basename $(pwd))/CLAUDE.md
cp /path/to/codebase_review_guide.md ~/audit-$(basename $(pwd))/codebase_review_guide.md

# Create a symlink so Claude Code still finds CLAUDE.md
# (symlinks don't require write permission on the target)
ln -sf ~/audit-$(basename $(pwd))/CLAUDE.md ./CLAUDE.md 2>/dev/null || \
  echo "⚠️  Can't symlink — run Claude Code from the audit dir instead"
```

**If symlinking fails** (because the repo is fully locked), start Claude
Code from the audit directory instead:

```bash
cd ~/audit-$(basename $(pwd))
claude
# Then tell Claude Code: "The repo to audit is at ~/[repo-name]/"
```

### Step 5: Run bootstrap (Phase 0)

The CLAUDE.md file contains a bootstrap script that auto-detects everything:
repo name, URL, stack, production URLs, monorepo structure, contributors,
and lines of code. It also locks push access automatically.

Tell Claude Code to run Phase 0 first. It will:

1. Detect the stack from manifest files (package.json, go.mod, etc.)
2. Extract production URLs from .env files, config, and source code
3. Identify monorepo workspaces if applicable
4. Count lines of code and recent contributors
5. Write everything to `~/audit-{repo-name}/repo_context.md`
6. Run the work volume estimation (Phase 1d)

After bootstrap, **quickly review `~/audit-{repo-name}/repo_context.md`** — especially
the Production URLs list. Add any that were missed, remove false positives.
Then proceed to Phase 1.

### Safety verification checklist

Before starting the audit, confirm all three layers are active:

```
[ ] Repo filesystem is read-only (chmod -R a-w)
[ ] Git push is disabled (no_push remote)
[ ] CLAUDE.md rules are in place
```

The first two are **technical enforcement** — they work even if Claude
Code ignores CLAUDE.md entirely. The third is defence in depth.

---

## Progress tracking

The bootstrap creates a progress tracker at `~/audit-{repo-name}/progress.sh`.
**Source it once at the start**, then call `mark_running` / `mark_done` at every
phase boundary. The CLAUDE.md file contains the full index reference.

```bash
# Source once (bootstrap does this automatically on first run)
source ~/audit-{repo-name}/progress.sh

# At every phase boundary:
mark_running <index>   # before starting
mark_done <index>      # after completing
show_progress          # any time you want to see the state
```

---

## Phase 1 — Orientation (first, ~30 min)

```bash
mark_running 1
```

**Goal:** Understand the shape of the codebase before reading any code.

### 1a — Detect the stack

```bash
cd [REPO_NAME]

# What language(s)?
find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' \
  -not -path '*/vendor/*' -not -path '*/.venv/*' -not -path '*/target/*' \
  -not -path '*/build/*' -not -path '*/dist/*' | \
  sed 's/.*\.//' | sort | uniq -c | sort -rn | head -20

# Package manager / framework detection
ls -la package.json yarn.lock pnpm-lock.yaml Cargo.toml go.mod requirements.txt \
  Pipfile pyproject.toml Gemfile composer.json build.gradle pom.xml Makefile \
  CMakeLists.txt 2>/dev/null

# Framework-specific markers
ls -la next.config.* nuxt.config.* angular.json vue.config.* \
  nest-cli.json tsconfig.json .eslintrc* .prettierrc* \
  docker-compose* Dockerfile Procfile 2>/dev/null
```

### 1b — Top-level structure

```bash
# Directory tree (2 levels — don't go deeper yet)
find . -maxdepth 2 -type d \
  -not -path '*/node_modules/*' -not -path '*/.git/*' \
  -not -path '*/vendor/*' -not -path '*/.venv/*' | sort

# How big is this codebase
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" \
  -o -name "*.rs" -o -name "*.java" -o -name "*.rb" -o -name "*.php" \
  -o -name "*.tsx" -o -name "*.jsx" -o -name "*.vue" -o -name "*.svelte" \) \
  -not -path '*/node_modules/*' -not -path '*/vendor/*' -not -path '*/.git/*' | \
  xargs wc -l 2>/dev/null | tail -1

# Monorepo detection
ls -la packages/ apps/ services/ libs/ modules/ workspaces/ 2>/dev/null
cat package.json 2>/dev/null | grep -i "workspaces" | head -5
```

### 1c — Runtime and language versions

```bash
# Node
cat .nvmrc .node-version 2>/dev/null; node --version 2>/dev/null
cat package.json 2>/dev/null | grep -A2 '"engines"'

# Python
cat .python-version 2>/dev/null; python3 --version 2>/dev/null
cat runtime.txt 2>/dev/null

# Go
cat go.mod 2>/dev/null | head -3

# Rust
cat rust-toolchain.toml 2>/dev/null; rustc --version 2>/dev/null

# Java/Kotlin
cat .java-version 2>/dev/null
grep -m1 "sourceCompatibility\|java.version" build.gradle pom.xml 2>/dev/null
```

**Log to findings.md:** Stack detected, total file count, lines of code, folder structure, language/runtime versions, monorepo status.

### 1d — Work volume estimation

After orientation, measure the repo's actual dimensions and produce a
per-phase estimate of time, tokens, and cost. This runs once and writes
a full estimation report the user can review before committing to the audit.

```bash
AUDIT_DIR_EST=$(cat ~/audit-*/repo_context.md 2>/dev/null | grep "Audit directory:" | awk '{print $NF}' | head -1)
AUDIT_DIR_EST="${AUDIT_DIR_EST:-~/audit}"
EST_FILE="$AUDIT_DIR_EST/work_volume_estimate.md"

echo "# Work Volume Estimation" > "$EST_FILE"
echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$EST_FILE"
echo "" >> "$EST_FILE"

# ──────────────────────────────────────────────────────
# MEASURE — collect raw numbers from the repo
# ──────────────────────────────────────────────────────

EXCLUDE="-not -path '*/node_modules/*' -not -path '*/vendor/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' -not -path '*/__pycache__/*' -not -path '*/.next/*'"

# Source files
SRC_FILES=$(find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" \
  -o -name "*.rs" -o -name "*.java" -o -name "*.rb" -o -name "*.php" \
  -o -name "*.tsx" -o -name "*.jsx" -o -name "*.vue" -o -name "*.svelte" \) \
  -not -path '*/node_modules/*' -not -path '*/vendor/*' -not -path '*/.git/*' \
  -not -path '*/dist/*' -not -path '*/build/*' | wc -l)

# Lines of code
TOTAL_LOC=$(find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" \
  -o -name "*.rs" -o -name "*.java" -o -name "*.rb" -o -name "*.php" \
  -o -name "*.tsx" -o -name "*.jsx" -o -name "*.vue" -o -name "*.svelte" \) \
  -not -path '*/node_modules/*' -not -path '*/vendor/*' -not -path '*/.git/*' \
  -not -path '*/dist/*' -not -path '*/build/*' | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
TOTAL_LOC=${TOTAL_LOC:-0}

# Test files
TEST_FILES=$(find . \( -name "*.spec.*" -o -name "*.test.*" -o -name "*_test.*" -o -name "test_*" \) \
  -not -path '*/node_modules/*' -not -path '*/vendor/*' -not -path '*/.git/*' | wc -l)

# Config files (yaml, json, toml, env, docker, ci)
CONFIG_FILES=$(find . -maxdepth 4 \( -name "*.yml" -o -name "*.yaml" -o -name "*.json" \
  -o -name "*.toml" -o -name "*.env*" -o -name "Dockerfile*" -o -name "*.config.*" \) \
  -not -path '*/node_modules/*' -not -path '*/vendor/*' -not -path '*/.git/*' | wc -l)

# Git history
COMMITS_12M=$(git log --since="12 months ago" --oneline 2>/dev/null | wc -l)
COMMITS_TOTAL=$(git rev-list --count HEAD 2>/dev/null || echo 0)
CONTRIBUTORS=$(git shortlog -sn --since="12 months ago" 2>/dev/null | wc -l)
MERGE_COMMITS=$(git log --since="12 months ago" --merges --oneline 2>/dev/null | wc -l)
TAGS=$(git tag -l 2>/dev/null | wc -l)

# Largest files (token density proxy — top 20)
LARGE_FILE_LOC=$(find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" \) \
  -not -path '*/node_modules/*' -not -path '*/vendor/*' -not -path '*/.git/*' \
  -not -name "*.spec.*" -not -name "*.test.*" | xargs wc -l 2>/dev/null | sort -rn | head -20 | \
  awk '{sum+=$1} END {print sum+0}')

# Monorepo workspaces
WORKSPACE_COUNT=$(find . -maxdepth 3 -name "package.json" -not -path '*/node_modules/*' 2>/dev/null | wc -l)

# ──────────────────────────────────────────────────────
# CLASSIFY — determine repo size tier
# ──────────────────────────────────────────────────────

if [ "$SRC_FILES" -lt 200 ]; then
  TIER="XS"
  TIER_LABEL="Extra Small (prototype/MVP)"
elif [ "$SRC_FILES" -lt 500 ]; then
  TIER="S"
  TIER_LABEL="Small (startup product)"
elif [ "$SRC_FILES" -lt 2000 ]; then
  TIER="M"
  TIER_LABEL="Medium (established product)"
elif [ "$SRC_FILES" -lt 5000 ]; then
  TIER="L"
  TIER_LABEL="Large (mature product)"
elif [ "$SRC_FILES" -lt 20000 ]; then
  TIER="XL"
  TIER_LABEL="Extra Large (enterprise)"
else
  TIER="XXL"
  TIER_LABEL="Monorepo/platform (very large)"
fi

# ──────────────────────────────────────────────────────
# ESTIMATE — per-phase token and time projections
# ──────────────────────────────────────────────────────

# Token estimation model:
# - grep/find commands return ~100 tokens per result line
# - Reading a file: ~3 tokens per line of code
# - Git log analysis: ~50 tokens per commit processed
# - Prompt overhead per phase: ~2,000 tokens
# - Claude response per phase: ~3,000-10,000 tokens
# - /compact saves ~60% of accumulated context

# Phase 1 — already done, use actual cost
P1_TOKENS=50000
P1_TIME=30

# Phase 2 — dependency health (reads package manifests + runs audit)
P2_TOKENS=$((CONFIG_FILES * 500 + 30000))
P2_TIME=15

# Phase 3 — test coverage (counts + optional test run)
P3_TOKENS=$((TEST_FILES * 200 + 30000))
P3_TIME=20

# Phase 4 — complexity (reads top 20 files + duplication scan)
P4_TOKENS=$((LARGE_FILE_LOC * 3 + SRC_FILES * 50 + 30000))
P4_TIME=30

# Phase 5a-d — git archaeology (log analysis, churn, ownership)
P5_TOKENS=$((COMMITS_12M * 80 + 40000))
P5_TIME=30

# Phase 5e — per-contributor (iterates per author)
P5E_TOKENS=$((CONTRIBUTORS * COMMITS_12M / CONTRIBUTORS * 100 + 30000))
P5E_TIME=$((10 + CONTRIBUTORS * 2))

# Phase 5f — PR patterns (merge analysis)
P5F_TOKENS=$((MERGE_COMMITS * 150 + 30000))
P5F_TIME=10

# Phase 5g — DORA metrics (tag + merge frequency)
P5G_TOKENS=$((TAGS * 100 + MERGE_COMMITS * 100 + 25000))
P5G_TIME=10

# Phase 6a-f — security (6 sub-phases, each greps entire codebase)
P6_TOKENS=$((SRC_FILES * 300 * 6 + 180000))
P6_TIME=60

# Phase 7a-d — deep reads (reads actual files, ~150 lines each)
# Estimate 10-20 files read per sub-phase
DEEP_READ_FILES=$((SRC_FILES < 80 ? SRC_FILES : 80))
P7_TOKENS=$((DEEP_READ_FILES * 450 + 120000))
P7_TIME=75

# Phase 8 — CI/CD (reads config files)
P8_TOKENS=$((CONFIG_FILES * 300 + 20000))
P8_TIME=15

# Phase 9a-e — documentation (5 sub-phases, samples files)
P9_TOKENS=$((SRC_FILES * 50 + 100000))
P9_TIME=20

# Phase 10 — report writing (synthesis, no new reads)
P10_TOKENS=80000
P10_TIME=15

# Phase 11a-b — HTML reports (large output generation)
P11_TOKENS=200000
P11_TIME=40

# Totals
TOTAL_TOKENS=$((P1_TOKENS + P2_TOKENS + P3_TOKENS + P4_TOKENS + P5_TOKENS + \
  P5E_TOKENS + P5F_TOKENS + P5G_TOKENS + P6_TOKENS + P7_TOKENS + \
  P8_TOKENS + P9_TOKENS + P10_TOKENS + P11_TOKENS))
TOTAL_TIME=$((P1_TIME + P2_TIME + P3_TIME + P4_TIME + P5_TIME + \
  P5E_TIME + P5F_TIME + P5G_TIME + P6_TIME + P7_TIME + \
  P8_TIME + P9_TIME + P10_TIME + P11_TIME))

# Cache discount: 90% of input tokens are cache reads ($0.30/M vs $3/M)
# Effective rate: ~$0.57/M tokens (weighted avg of cache + non-cache)
# Output rate: ~$3-15/M tokens depending on model
# Simplified: ~$1.50 per 1M total tokens (input + output, after caching)
COST_LOW=$((TOTAL_TOKENS / 1000000 * 1 + 1))
COST_HIGH=$((TOTAL_TOKENS / 1000000 * 3 + 3))
# Ensure minimums
COST_LOW=$((COST_LOW < 2 ? 2 : COST_LOW))
COST_HIGH=$((COST_HIGH < 5 ? 5 : COST_HIGH))

HOURS=$((TOTAL_TIME / 60))
MINS=$((TOTAL_TIME % 60))

# ──────────────────────────────────────────────────────
# WRITE — the estimation report
# ──────────────────────────────────────────────────────

cat >> "$EST_FILE" << EOF
## Repo Dimensions

| Metric | Value |
|---|---|
| Source files | $SRC_FILES |
| Lines of code | $TOTAL_LOC |
| Test files | $TEST_FILES |
| Config files | $CONFIG_FILES |
| Commits (12 months) | $COMMITS_12M |
| Commits (all time) | $COMMITS_TOTAL |
| Contributors (12 months) | $CONTRIBUTORS |
| Merge commits (12 months) | $MERGE_COMMITS |
| Release tags | $TAGS |
| Monorepo packages | $WORKSPACE_COUNT |
| Top 20 files (LOC) | $LARGE_FILE_LOC |
| **Size tier** | **$TIER — $TIER_LABEL** |

## Per-Phase Estimates

| Phase | Description | Est. Tokens | Est. Time | Priority |
|---|---|---|---|---|
| 1 | Orientation | ~${P1_TOKENS} | ${P1_TIME}min | Required |
| 2 | Dependency health | ~${P2_TOKENS} | ${P2_TIME}min | High |
| 3 | Test coverage | ~${P3_TOKENS} | ${P3_TIME}min | High |
| 4 | Code complexity | ~${P4_TOKENS} | ${P4_TIME}min | Medium |
| 5a-d | Git archaeology | ~${P5_TOKENS} | ${P5_TIME}min | Medium |
| 5e | Contributor performance | ~${P5E_TOKENS} | ${P5E_TIME}min | High |
| 5f | PR review patterns | ~${P5F_TOKENS} | ${P5F_TIME}min | High |
| 5g | DORA metrics | ~${P5G_TOKENS} | ${P5G_TIME}min | High |
| 6a-f | Security audit | ~${P6_TOKENS} | ${P6_TIME}min | **Critical** |
| 7a-d | Deep module reads | ~${P7_TOKENS} | ${P7_TIME}min | High |
| 8 | CI/CD | ~${P8_TOKENS} | ${P8_TIME}min | Medium |
| 9a-e | Documentation | ~${P9_TOKENS} | ${P9_TIME}min | High |
| 10 | Final report (md) | ~${P10_TOKENS} | ${P10_TIME}min | Required |
| 11a-b | HTML reports | ~${P11_TOKENS} | ${P11_TIME}min | Recommended |
| | **TOTAL** | **~${TOTAL_TOKENS}** | **${HOURS}h ${MINS}m** | |

## Cost Estimate

| Scenario | Est. Cost | Notes |
|---|---|---|
| With prompt caching (typical) | \$${COST_LOW} – \$${COST_HIGH} | 90% cache hit rate |
| Without caching (worst case) | \$$(( COST_HIGH * 3 )) – \$$(( COST_HIGH * 5 )) | Rare — only if session restarts repeatedly |

## Recommendations

EOF

if [ "$TIER" = "XS" ] || [ "$TIER" = "S" ]; then
  cat >> "$EST_FILE" << 'EOF'
**✅ PROCEED with all phases.** This repo is small enough for a complete audit
in a single session with budget to spare. No sampling needed.
EOF
elif [ "$TIER" = "M" ]; then
  cat >> "$EST_FILE" << 'EOF'
**✅ PROCEED with all phases.** Compact aggressively between phases.
Monitor cost at budget gates (before Phase 6, 7, 11). HTML reports
should fit within budget.
EOF
elif [ "$TIER" = "L" ]; then
  cat >> "$EST_FILE" << 'EOF'
**⚠️ PROCEED with sampling.** This is a large repo. Apply these adaptations:
- Phase 4: Sample top 50 files only
- Phase 5e: Limit to top 10 contributors
- Phase 6a-f: Use `head -20` instead of `head -30` on grep results
- Phase 7: Read first 100 lines per file, not 200
- Phase 9c: Sample 30 files instead of 50
- Phase 11: Generate only if cost < $30 at Phase 10

**If budget is tight, skip these phases:**
- Phase 4 (complexity) — use top 20 files estimate from orientation
- Phase 9c-9e (code/env/db docs) — project-level and API docs are enough
EOF
elif [ "$TIER" = "XL" ]; then
  cat >> "$EST_FILE" << 'EOF'
**⚠️ CONSIDER SPLITTING across 2 sessions.** Recommended split:

**Session 1 (core audit):** Phases 1-5g, 8, 10
**Session 2 (security + deep reads + reports):** Phases 6a-f, 7a-d, 9a-e, 11a-b

Adaptations for single-session attempt:
- All grep results capped at `head -15`
- Phase 5e: Top 7 contributors only
- Phase 7: Top 3 highest-risk modules only, 100 lines each
- Phase 9: Project-level docs (9a) only, skip 9b-9e
- Phase 11: Skip entirely — markdown report is sufficient
EOF
else
  cat >> "$EST_FILE" << 'EOF'
**🛑 SPLIT across 3+ sessions.** This repo is too large for a single pass.

**Session 1:** Phase 1 (orientation) + Phase 6a-f (security) — highest risk
**Session 2:** Phase 5a-5g (git + team) + Phase 7a (payment deep read)
**Session 3:** Phase 2-4, 8, 9a, 10, 11a

Each session: read `findings.md` and `budget_log.md` on start to avoid
repeating work. Use progress tracker to resume from exact checkpoint.

Adaptations: all grep capped at `head -10`, deep reads limited to 80 lines,
contributor analysis limited to top 5, skip Phase 4/9c-9e/11b entirely.
EOF
fi

echo "" >> "$EST_FILE"
echo "---" >> "$EST_FILE"
echo "*Estimates are based on repo dimensions measured during Phase 1.*" >> "$EST_FILE"
echo "*Actual cost depends on Claude Code model, caching efficiency, and compaction frequency.*" >> "$EST_FILE"

# ──────────────────────────────────────────────────────
# DISPLAY — show summary to the user
# ──────────────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  WORK VOLUME ESTIMATION                      ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                              ║"
echo "║  Repo tier:        $TIER — $TIER_LABEL"
echo "║                                                              ║"
echo "║  Source files:      $SRC_FILES"
echo "║  Lines of code:     $TOTAL_LOC"
echo "║  Commits (12mo):    $COMMITS_12M"
echo "║  Contributors:      $CONTRIBUTORS"
echo "║  Test files:        $TEST_FILES"
echo "║                                                              ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                              ║"
echo "║  Est. total tokens: ~$TOTAL_TOKENS"
echo "║  Est. total time:   ${HOURS}h ${MINS}m"
echo "║  Est. cost range:   \$${COST_LOW} – \$${COST_HIGH} (with caching)"
echo "║                                                              ║"

if [ "$TIER" = "XS" ] || [ "$TIER" = "S" ] || [ "$TIER" = "M" ]; then
  echo "║  ✅ Recommendation:  PROCEED with all phases                ║"
elif [ "$TIER" = "L" ]; then
  echo "║  ⚠️  Recommendation:  PROCEED with sampling                 ║"
elif [ "$TIER" = "XL" ]; then
  echo "║  ⚠️  Recommendation:  SPLIT into 2 sessions                 ║"
else
  echo "║  🛑 Recommendation:  SPLIT into 3+ sessions                ║"
fi

echo "║                                                              ║"
echo "║  Full breakdown: $EST_FILE"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
```

**After the estimation displays, wait for user acknowledgment:**

- If tier is S/M: proceed automatically
- If tier is L: show the sampling adaptations and proceed unless user objects
- If tier is XL/XXL: **STOP and ask the user** which session split they prefer

**Initialize the budget log:**

```bash
echo "# Budget Log" > ~/audit-{repo-name}/budget_log.md
echo "Repo: $(basename $(git rev-parse --show-toplevel 2>/dev/null))" >> ~/audit-{repo-name}/budget_log.md
echo "Tier: $TIER" >> ~/audit-{repo-name}/budget_log.md
echo "Estimated total: ~$TOTAL_TOKENS tokens, \$${COST_LOW}–\$${COST_HIGH}" >> ~/audit-{repo-name}/budget_log.md
echo "" >> ~/audit-{repo-name}/budget_log.md
echo "| Time | Phase | Cost so far | Notes |" >> ~/audit-{repo-name}/budget_log.md
echo "|---|---|---|---|" >> ~/audit-{repo-name}/budget_log.md
```

**Run `/cost` now** and add the first row to `budget_log.md`:

```bash
echo "| $(date +%H:%M) | Phase 1 complete | [INSERT /cost OUTPUT] | Baseline — orientation + estimation done |" \
  >> ~/audit-{repo-name}/budget_log.md
```

```bash
mark_done 1
```

**Run `/compact`. Proceed to Phase 2.**

---

## Phase 2 — Dependency health (15 min)

```bash
mark_running 2
```

**Goal:** Find outdated or vulnerable packages — automated, objective, fast.

### For Node.js / npm / yarn / pnpm

```bash
# Security vulnerabilities
npm audit --json 2>/dev/null | jq '{
  total: .metadata.vulnerabilities.total,
  critical: .metadata.vulnerabilities.critical,
  high: .metadata.vulnerabilities.high,
  moderate: .metadata.vulnerabilities.moderate
}' 2>/dev/null

# How outdated are packages (top 15 most behind)
npm outdated --json 2>/dev/null | jq 'to_entries | map({
  package: .key,
  current: .value.current,
  latest: .value.latest
}) | .[0:15]' 2>/dev/null

# Lockfile presence (discipline signal)
ls -la package-lock.json yarn.lock pnpm-lock.yaml 2>/dev/null
```

### For Python / pip

```bash
# If a requirements file exists
pip-audit -r requirements.txt 2>/dev/null || \
  pip audit 2>/dev/null

# Check for pinned vs unpinned dependencies
grep -c "==" requirements.txt 2>/dev/null
grep -vc "==" requirements.txt 2>/dev/null | grep -v "^#"
```

### For Go

```bash
go list -m -u all 2>/dev/null | grep "\[" | head -15  # outdated modules
govulncheck ./... 2>/dev/null  # vulnerability scan
```

### For Rust

```bash
cargo audit 2>/dev/null
cargo outdated 2>/dev/null | head -20
```

### Universal checks

```bash
# Look for vendored / committed dependencies (bad practice)
du -sh node_modules/ vendor/ .venv/ 2>/dev/null
git ls-files node_modules/ vendor/ 2>/dev/null | head -5

# License audit (are you pulling in GPL into a commercial product?)
ls LICENSE* COPYING* 2>/dev/null
```

**Log:** Vulnerability count by severity, top outdated packages, lockfile status, vendoring status.

```bash
mark_done 2
```

**Run `/compact`. Proceed to Phase 3.**

---

## Phase 3 — Test coverage (20 min)

```bash
mark_running 3
```

**Goal:** Find out what's tested and what isn't.

### 3a — Detect the test setup

```bash
# Node.js
cat package.json 2>/dev/null | jq '.scripts | to_entries | map(select(.key | test("test|jest|mocha|vitest|cypress|playwright"))) | from_entries'

# Python
ls pytest.ini setup.cfg pyproject.toml tox.ini 2>/dev/null | head -5
grep -l "pytest\|unittest\|nose" pyproject.toml setup.cfg 2>/dev/null

# Go — tests are built-in
find . -name "*_test.go" -not -path '*/vendor/*' | wc -l

# General — count test files vs source files
echo "=== Test files ==="
find . -name "*.spec.*" -o -name "*.test.*" -o -name "*_test.*" -o -name "test_*" | \
  grep -v node_modules | grep -v vendor | grep -v .git | wc -l

echo "=== Source files ==="
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" \
  -o -name "*.rs" -o -name "*.java" \) \
  -not -name "*.spec.*" -not -name "*.test.*" -not -name "*_test.*" \
  -not -path '*/node_modules/*' -not -path '*/vendor/*' -not -path '*/.git/*' | wc -l
```

### 3b — Run tests in safe/dry-run mode (if available)

```bash
# Node.js — coverage only, skip integration
npm test -- --coverage --passWithNoTests 2>&1 | tail -50

# Python
python -m pytest --co -q 2>/dev/null | tail -20  # collect only, don't run

# Go
go test ./... -count=0 2>/dev/null  # compile check only
```

### 3c — Find untested critical paths

```bash
# Identify business-critical directories that lack tests
# (adapt these patterns to the repo's domain)
for dir in payment auth user order billing subscription checkout invoice; do
  src_count=$(find . -path "*/$dir/*" -name "*.ts" -o -path "*/$dir/*" -name "*.py" | \
    grep -v spec | grep -v test | grep -v node_modules | wc -l)
  test_count=$(find . -path "*/$dir/*" \( -name "*.spec.*" -o -name "*.test.*" \) | \
    grep -v node_modules | wc -l)
  if [ "$src_count" -gt 0 ]; then
    echo "$dir: $src_count source files, $test_count test files"
  fi
done
```

**Log:** Test/source ratio, coverage % if available, untested critical paths.

```bash
mark_done 3
```

**Run `/compact`. Proceed to Phase 4.**

---

## Phase 4 — Code complexity and duplication (30 min)

```bash
mark_running 4
```

**Goal:** Find the files that will hurt you — high complexity = slow fixes, high bugs.

### 4a — Largest files (complexity proxy)

```bash
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" \
  -o -name "*.java" -o -name "*.rs" \) \
  -not -path '*/node_modules/*' -not -path '*/vendor/*' -not -path '*/.git/*' \
  -not -name "*.spec.*" -not -name "*.test.*" | \
  xargs wc -l 2>/dev/null | sort -rn | head -20
```

### 4b — Code duplication

```bash
# Install globally (doesn't touch repo)
npm install -g jscpd 2>/dev/null

# Run duplication analysis
jscpd src/ --reporters json --output ~/audit-{repo-name}/duplication/ 2>/dev/null
cat ~/audit-{repo-name}/duplication/jscpd-report.json 2>/dev/null | jq '{
  totalDuplication: .statistics.total.percentage,
  duplicatedLines: .statistics.total.duplicatedLines,
  totalLines: .statistics.total.lines
}'
```

### 4c — Type safety (for TypeScript / typed languages)

```bash
# TypeScript strict mode
cat tsconfig.json 2>/dev/null | jq '.compilerOptions | {strict, noImplicitAny, strictNullChecks, noUncheckedIndexedAccess}'

# Any usage — how much untyped code?
grep -rn ": any" . --include="*.ts" --include="*.tsx" | \
  grep -v node_modules | grep -v spec | grep -v test | wc -l

# Python type hints coverage
grep -rn "def " . --include="*.py" | grep -v venv | grep -v test | wc -l
grep -rn "def .*->.*:" . --include="*.py" | grep -v venv | grep -v test | wc -l
```

**Log:** Duplication %, top 10 largest files, TypeScript strictness, `any` count.

```bash
mark_done 4
```

**Run `/compact`. Proceed to Phase 5.**

---

## Phase 5 — Git archaeology (30 min)

```bash
mark_running 5
```

**Goal:** Let commit history reveal what the code can't — churn, ownership, discipline.

### 5a — File churn (files that keep changing = files that keep breaking)

```bash
git log --name-only --since="12 months ago" --pretty=format: | \
  grep -E "\.(ts|js|py|go|rs|java|tsx|jsx)$" | \
  sort | uniq -c | sort -rn | head -20
```

### 5b — Ownership and bus factor

```bash
# Who commits the most
git shortlog -sn --since="12 months ago" | head -10

# Bus factor per directory — how many people touch each area
for dir in $(find . -maxdepth 2 -type d -not -path '*/.git/*' -not -path '*/node_modules/*' | head -20); do
  authors=$(git log --since="12 months ago" --format="%aN" -- "$dir" 2>/dev/null | sort -u | wc -l)
  if [ "$authors" -gt 0 ]; then
    echo "$authors authors — $dir"
  fi
done | sort -rn | head -15
```

### 5c — Commit hygiene

```bash
# Sample recent commit messages
git log --oneline --since="6 months ago" | head -30

# Average files per commit (small = disciplined, giant = cowboy)
git log --since="6 months ago" --pretty=format:"%H" | head -50 | while read hash; do
  git diff-tree --no-commit-id -r --stat "$hash" 2>/dev/null | tail -1
done | awk '{sum+=$1; count++} END {if(count>0) print "avg files per commit: " sum/count}'

# Hotfix/urgent commits
git log --oneline --since="12 months ago" --grep="fix\|hotfix\|urgent\|patch\|revert" | wc -l

# Weekend/off-hours commits (burnout signal)
git log --since="12 months ago" --format="%ad" --date=format:"%A" | sort | uniq -c
```

### 5d — Force pushes and reverts (instability signals)

```bash
# Reverts
git log --oneline --since="12 months ago" --grep="revert" | wc -l

# Merge conflicts (proxy via merge commits)
git log --oneline --since="12 months ago" --merges | wc -l
```

**Log:** Top 10 churn files, bus factor concerns, commit quality, hotfix count, weekend patterns.

```bash
mark_done 5
```

### 5e — Per-contributor performance

```bash
mark_running 6
```

```bash
# Commits per author per month (last 12 months) — activity trends
echo "=== Monthly commit activity per author ==="
for author in $(git log --since="12 months ago" --format="%aN" | sort -u); do
  echo ""
  echo "--- $author ---"
  git log --since="12 months ago" --author="$author" --format="%ad" --date=format:"%Y-%m" | \
    sort | uniq -c | sort -k2
done

# Lines added/removed per author (net contribution)
echo ""
echo "=== Code volume per author (last 12 months) ==="
git log --since="12 months ago" --format="%aN" | sort -u | while read author; do
  stats=$(git log --since="12 months ago" --author="$author" --numstat --pretty="" | \
    awk '{add+=$1; del+=$2} END {printf "%d added, %d removed, net %d", add, del, add-del}')
  commits=$(git log --since="12 months ago" --author="$author" --oneline | wc -l)
  echo "$author: $commits commits, $stats"
done

# Average commit size per author (discipline signal)
echo ""
echo "=== Avg files per commit per author ==="
git log --since="12 months ago" --format="%aN" | sort -u | while read author; do
  avg=$(git log --since="12 months ago" --author="$author" --pretty=format:"%H" | head -30 | while read hash; do
    git diff-tree --no-commit-id -r "$hash" 2>/dev/null | wc -l
  done | awk '{sum+=$1; count++} END {if(count>0) printf "%.1f", sum/count; else print "0"}')
  echo "$author: $avg files/commit"
done

# Who introduces the most churn (their code gets changed again quickly)?
echo ""
echo "=== Churn authors — whose code gets changed within 2 weeks ==="
git log --since="12 months ago" --diff-filter=M --name-only --pretty=format:"%H %aN" | \
  awk '/^[a-f0-9]/ {author=$2; for(i=3;i<=NF;i++) author=author" "$i} /^[^a-f0-9]/ && NF>0 {print author, $0}' | \
  sort -k2 | head -30

# Who works on what areas (knowledge map)
echo ""
echo "=== Author × directory heatmap ==="
for author in $(git shortlog -sn --since="12 months ago" | head -7 | awk '{$1=""; print $0}' | sed 's/^ //'); do
  echo ""
  echo "--- $author ---"
  git log --since="12 months ago" --author="$author" --name-only --pretty=format: | \
    grep -v "^$" | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn | head -10
done
```

**What to look for:**
- Is one person doing 50%+ of all commits? (bus factor risk)
- Are there contributors with declining activity? (departure risk)
- Large avg commit sizes suggest insufficient PR discipline
- Who owns which areas? Would their departure create knowledge gaps?

```bash
mark_done 6
```

**Run `/compact` after this sub-step.**

### 5f — PR and merge review patterns

```bash
mark_running 7
```

```bash
# Are merges happening via PRs or direct pushes?
echo "=== Merge commits vs direct commits (last 6 months) ==="
total_commits=$(git log --since="6 months ago" --oneline | wc -l)
merge_commits=$(git log --since="6 months ago" --oneline --merges | wc -l)
echo "Total commits: $total_commits"
echo "Merge commits: $merge_commits"
echo "Direct pushes (approx): $((total_commits - merge_commits * 2))"

# PR merge patterns — sample merge commit messages for PR references
echo ""
echo "=== PR merge pattern sample ==="
git log --since="6 months ago" --merges --oneline | head -20

# Average time between PR creation and merge (from merge commits)
# This uses the parent commit timestamps as a proxy
echo ""
echo "=== Time to merge sample (last 20 merges) ==="
git log --since="6 months ago" --merges --pretty=format:"%H" | head -20 | while read merge_hash; do
  # Get merge timestamp
  merge_time=$(git show -s --format="%ct" "$merge_hash" 2>/dev/null)
  # Get the first parent's timestamp (when the branch diverged)
  branch_start=$(git log --pretty=format:"%ct" "${merge_hash}^2" 2>/dev/null | tail -1)
  if [ -n "$merge_time" ] && [ -n "$branch_start" ] && [ "$branch_start" -gt 0 ]; then
    hours=$(( (merge_time - branch_start) / 3600 ))
    msg=$(git log --oneline -1 "$merge_hash" 2>/dev/null)
    echo "${hours}h — $msg"
  fi
done 2>/dev/null

# Who merges whose code? (review culture signal)
echo ""
echo "=== Merge authors (who presses the merge button) ==="
git log --since="6 months ago" --merges --format="%aN" | sort | uniq -c | sort -rn

# Self-merges vs cross-reviews
echo ""
echo "=== Self-merge detection (author = committer on merge) ==="
git log --since="6 months ago" --merges --pretty=format:"%aN|%cN" | \
  awk -F'|' '{if($1==$2) self++; else cross++} END {
    printf "Self-merges: %d\nCross-reviews: %d\nReview rate: %.0f%%\n", 
    self, cross, (cross/(self+cross+0.001))*100
  }'

# Are there branch protection patterns? (look for squash merges, signed commits)
echo ""
echo "=== Merge strategies used ==="
git log --since="6 months ago" --oneline | grep -ic "squash\|merge\|rebase" | head -5
git log --since="6 months ago" --pretty=format:"%G?" | sort | uniq -c
```

**What to look for:**
- High direct-push rate = no code review culture
- Self-merge rate > 50% = rubber-stamping
- Very fast merge times (< 1 hour) on large PRs = insufficient review
- One person doing all merges = bottleneck

```bash
mark_done 7
```

**Run `/compact` after this sub-step.**

### 5g — DORA metrics (lite)

```bash
mark_running 8
```

```bash
# Deployment frequency — from tags/releases
echo "=== Release/deployment tags (last 12 months) ==="
git tag -l --sort=-creatordate | head -30
git tag -l --sort=-creatordate --format='%(creatordate:short) %(refname:short)' | head -20

deploy_count=$(git tag -l | wc -l)
echo "Total tags: $deploy_count"

# If no tags, estimate from merges to main/master branch
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
if [ -z "$DEFAULT_BRANCH" ]; then
  DEFAULT_BRANCH=$(git branch -r | grep -E "origin/(main|master)" | head -1 | sed 's/.*origin\///')
fi

echo ""
echo "=== Merges to $DEFAULT_BRANCH per month (deploy frequency proxy) ==="
git log --since="12 months ago" --merges --first-parent "origin/$DEFAULT_BRANCH" \
  --format="%ad" --date=format:"%Y-%m" 2>/dev/null | sort | uniq -c

# Change failure rate — reverts and hotfixes as % of all merges
echo ""
echo "=== Change failure rate ==="
total_merges=$(git log --since="12 months ago" --merges --first-parent "origin/$DEFAULT_BRANCH" --oneline 2>/dev/null | wc -l)
failures=$(git log --since="12 months ago" --first-parent "origin/$DEFAULT_BRANCH" --oneline \
  --grep="revert\|hotfix\|rollback\|fix.*prod\|emergency" 2>/dev/null | wc -l)
if [ "$total_merges" -gt 0 ]; then
  rate=$(( failures * 100 / total_merges ))
  echo "Total merges to $DEFAULT_BRANCH: $total_merges"
  echo "Failure-related commits: $failures"
  echo "Change failure rate: ${rate}%"
else
  echo "Could not calculate — no merge history found on $DEFAULT_BRANCH"
fi

# Lead time for changes — avg time from first commit on branch to merge
echo ""
echo "=== Lead time for changes (sample of last 15 merges) ==="
git log --since="6 months ago" --merges --first-parent "origin/$DEFAULT_BRANCH" \
  --pretty=format:"%H" 2>/dev/null | head -15 | while read merge; do
  merge_date=$(git show -s --format="%ci" "$merge" 2>/dev/null)
  first_commit_date=$(git log "${merge}^1..${merge}^2" --format="%ci" 2>/dev/null | tail -1)
  if [ -n "$merge_date" ] && [ -n "$first_commit_date" ]; then
    merge_epoch=$(date -d "$merge_date" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S %z" "$merge_date" +%s 2>/dev/null)
    first_epoch=$(date -d "$first_commit_date" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S %z" "$first_commit_date" +%s 2>/dev/null)
    if [ -n "$merge_epoch" ] && [ -n "$first_epoch" ]; then
      hours=$(( (merge_epoch - first_epoch) / 3600 ))
      echo "${hours}h — $(git log --oneline -1 "$merge" 2>/dev/null)"
    fi
  fi
done 2>/dev/null

# Mean time to recovery — time between failure and fix
echo ""
echo "=== Revert response times ==="
git log --since="12 months ago" --grep="revert\|Revert" --format="%H %ci" 2>/dev/null | head -10 | while read hash date time tz; do
  # Find what was reverted and when it was originally merged
  reverted=$(git log -1 --format="%s" "$hash" 2>/dev/null | grep -oE '[a-f0-9]{7,40}' | head -1)
  if [ -n "$reverted" ]; then
    original_date=$(git show -s --format="%ci" "$reverted" 2>/dev/null)
    echo "Reverted $reverted ($original_date) at $date $time"
  fi
done 2>/dev/null
```

**What to look for:**
- Deployment frequency: daily = elite, weekly = high, monthly = medium, quarterly = low
- Change failure rate: < 15% = elite, 16-30% = high, 31-45% = medium, > 45% = low
- Lead time: < 1 day = elite, 1-7 days = high, 1-4 weeks = medium, > 1 month = low
- These are DORA Research benchmarks — compare against them

```bash
mark_done 8
```

**Run `/compact`. Proceed to Phase 6.**

**BUDGET CHECK:** Run `/cost` and log to `budget_log.md` before starting Phase 6.
Phase 6 (security) is token-intensive — it greps the entire codebase multiple times.
If cumulative cost exceeds $30, consider using `head -15` instead of `head -30`
on all grep results to reduce token consumption.

---

## Phase 6 — Security audit (60 min)

```bash
mark_running 9
```

**Goal:** Identify security vulnerabilities, misconfigurations, and missing protections. This is the most critical phase for production systems.

### 6a — Secrets and credentials

```bash
# Hardcoded secrets in source code
grep -rn "password\|secret\|apiKey\|API_KEY\|api_key\|token\|private_key\|PRIVATE_KEY" \
  . --include="*.ts" --include="*.js" --include="*.py" --include="*.go" \
  --include="*.java" --include="*.rb" --include="*.php" --include="*.yaml" \
  --include="*.yml" --include="*.json" --include="*.toml" --include="*.env*" | \
  grep -v node_modules | grep -v vendor | grep -v .git | \
  grep -v "process.env\|os.environ\|os.Getenv\|System.getenv\|ENV\[" | \
  grep -v "// \|# \|/\*\|\.spec\.\|\.test\." | head -30

# .env files committed to git (should NEVER be tracked)
git ls-files | grep -i "\.env" | grep -v ".example\|.sample\|.template"

# .gitignore coverage for secrets
cat .gitignore 2>/dev/null | grep -i "env\|secret\|key\|credential"

# AWS/GCP/Azure credentials in code or config
grep -rn "AKIA\|aws_secret\|GOOG\|azure_client_secret\|service_account" \
  . --include="*.ts" --include="*.js" --include="*.py" --include="*.json" \
  --include="*.yaml" --include="*.yml" --include="*.toml" | \
  grep -v node_modules | grep -v vendor | head -15

# Private keys committed
find . -name "*.pem" -o -name "*.key" -o -name "*.p12" -o -name "*.pfx" | \
  grep -v node_modules | grep -v vendor
git ls-files | grep -E "\.(pem|key|p12|pfx)$"

# CRITICAL: Secrets deleted from code but still in git history
# These are exploitable — anyone with repo access can find them
echo ""
echo "=== Deleted secrets still in git history ==="
for pattern in "password" "secret" "API_KEY" "apiKey" "PRIVATE_KEY" "aws_secret" "AKIA"; do
  count=$(git log -p --all -S "$pattern" --diff-filter=D -- '*.ts' '*.js' '*.py' '*.env' '*.json' '*.yaml' '*.yml' 2>/dev/null | grep -c "^-.*$pattern" 2>/dev/null || echo 0)
  if [ "$count" -gt 0 ]; then
    echo "FOUND: '$pattern' was committed and later removed — $count occurrences"
    echo "  Run: git log -p --all -S \"$pattern\" to see details"
  fi
done
```

**CRITICAL: If you find real secrets, log their file path and line number in findings.md but NEVER log the actual values.**

```bash
mark_done 9
```

**Run `/compact` after this sub-step.**

### 6b — Authentication and authorization

```bash
mark_running 10
```

```bash
# Find auth-related code
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" \) | \
  xargs grep -l "auth\|guard\|middleware\|permission\|role\|jwt\|session\|oauth\|passport" 2>/dev/null | \
  grep -v node_modules | grep -v vendor | grep -v test | grep -v spec | head -20

# JWT configuration — is it secure?
grep -rn "jwt\|jsonwebtoken\|jose\|JWT" . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v vendor | grep -v test | head -15

# Check for JWT algorithm confusion vulnerabilities
grep -rn "algorithm\|alg.*none\|HS256\|RS256" . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v vendor | head -10

# Session configuration
grep -rn "session\|cookie\|httpOnly\|secure\|sameSite\|maxAge\|expires" \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v vendor | grep -v test | head -15

# Is role-based access centralised or duplicated?
grep -rn "isAdmin\|hasRole\|canAccess\|authorize\|@Roles\|@Permissions" \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v vendor | grep -v test | wc -l
```

**What to look for:**
- Is auth logic centralised in middleware/guards, or scattered per route?
- Is JWT secret from env or hardcoded?
- Are cookies set with `httpOnly`, `secure`, `sameSite`?
- Is there an algorithm whitelist on JWT verification?

```bash
mark_done 10
```

**Run `/compact` after this sub-step.**

### 6c — Input validation and injection

```bash
mark_running 11
```

```bash
# SQL injection risk — raw queries
grep -rn "query(\|execute(\|raw(\|rawQuery\|\$queryRaw\|text(" \
  . --include="*.ts" --include="*.js" --include="*.py" --include="*.go" | \
  grep -v node_modules | grep -v vendor | grep -v test | \
  grep -v "\.d\.ts" | head -20

# String interpolation in queries (HIGH RISK)
grep -rn '`.*\$.*`.*query\|f".*{.*}.*SELECT\|f".*{.*}.*INSERT\|".*%s.*".*execute\|".*" +.*query' \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v vendor | grep -v test | head -15

# NoSQL injection risk (MongoDB)
grep -rn "find(\|findOne(\|updateOne(\|deleteOne(\|aggregate(" \
  . --include="*.ts" --include="*.js" | \
  grep -v node_modules | grep -v vendor | grep -v test | \
  grep "\$where\|eval\|mapReduce" | head -10

# XSS risk — dangerouslySetInnerHTML / innerHTML / v-html
grep -rn "dangerouslySetInnerHTML\|innerHTML\|v-html\|__html\|html_safe\|safe\|mark_safe" \
  . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.vue" --include="*.py" | \
  grep -v node_modules | grep -v vendor | grep -v test | head -15

# Command injection risk
grep -rn "exec(\|execSync\|spawn(\|child_process\|os.system\|subprocess\|popen\|shell_exec" \
  . --include="*.ts" --include="*.js" --include="*.py" --include="*.rb" --include="*.php" | \
  grep -v node_modules | grep -v vendor | grep -v test | head -15

# Path traversal risk
grep -rn "path.join\|path.resolve\|readFile\|readFileSync\|open(" \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v vendor | grep -v test | \
  grep "req\.\|request\.\|params\.\|query\.\|body\." | head -15

# Is there input validation middleware?
grep -rn "class-validator\|joi\|yup\|zod\|ajv\|express-validator\|cerberus\|pydantic\|marshmallow" \
  . --include="*.ts" --include="*.js" --include="*.py" --include="package.json" | \
  grep -v node_modules | grep -v vendor | head -10
```

```bash
mark_done 11
```

**Run `/compact` after this sub-step.**

### 6d — API security

```bash
mark_running 12
```

```bash
# Rate limiting
grep -rn "rate.limit\|rateLimit\|throttle\|Throttle\|slowDown\|express-rate-limit\|bottleneck" \
  . --include="*.ts" --include="*.js" --include="*.py" --include="package.json" | \
  grep -v node_modules | grep -v vendor | head -10

# CORS configuration
grep -rn "cors\|Access-Control\|allowedOrigins\|CORS" \
  . --include="*.ts" --include="*.js" --include="*.py" --include="*.yaml" | \
  grep -v node_modules | grep -v vendor | grep -v test | head -10

# Is CORS set to wildcard? (bad)
grep -rn "origin.*\*\|origin.*true\|allow_all_origins\|AllowAllOrigins" \
  . --include="*.ts" --include="*.js" --include="*.py" --include="*.go" | \
  grep -v node_modules | grep -v vendor | head -5

# CSRF protection
grep -rn "csrf\|csurf\|CSRF\|csrfToken\|X-CSRF" \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v vendor | head -10

# Security headers (helmet, secure headers)
grep -rn "helmet\|security-headers\|X-Frame-Options\|Content-Security-Policy\|X-Content-Type-Options\|Strict-Transport-Security" \
  . --include="*.ts" --include="*.js" --include="*.py" --include="*.yaml" | \
  grep -v node_modules | grep -v vendor | head -10

# API endpoints without auth guards — look for unprotected routes
grep -rn "@Public\|@AllowAnonymous\|@NoAuth\|@SkipAuth\|isPublic\|allow_unauthenticated" \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v vendor | grep -v test | head -15
```

```bash
mark_done 12
```

**Run `/compact` after this sub-step.**

### 6e — Data protection and cryptography

```bash
mark_running 13
```

```bash
# Password hashing — is it bcrypt/argon2 or something weak?
grep -rn "bcrypt\|argon2\|scrypt\|pbkdf2\|md5\|sha1\|sha256\|hashSync\|createHash" \
  . --include="*.ts" --include="*.js" --include="*.py" --include="*.go" | \
  grep -v node_modules | grep -v vendor | grep -v test | head -15

# Are passwords stored as plaintext anywhere?
grep -rn "password.*=.*req\.\|password.*=.*body\.\|save.*password" \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v vendor | grep -v test | \
  grep -v "hash\|bcrypt\|argon\|encrypt" | head -10

# Encryption at rest — is sensitive data encrypted?
grep -rn "encrypt\|decrypt\|cipher\|AES\|crypto\|createCipheriv" \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v vendor | grep -v test | head -10

# PII handling — does the codebase handle sensitive user data?
grep -rn "ssn\|social_security\|credit_card\|creditCard\|cardNumber\|passport\|national_id" \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v vendor | grep -v test | head -10

# Logging — are sensitive fields logged?
grep -rn "console.log\|logger\.\|logging\.\|log\." \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -i "password\|secret\|token\|key\|credit" | \
  grep -v node_modules | grep -v vendor | grep -v test | head -10
```

```bash
mark_done 13
```

**Run `/compact` after this sub-step.**

### 6f — Infrastructure security

```bash
mark_running 14
```

```bash
# Dockerfile security
cat Dockerfile 2>/dev/null | head -40
# Check: running as root? multi-stage? secrets in build args?
grep -n "USER\|root\|ARG.*SECRET\|ARG.*PASSWORD\|ARG.*KEY" Dockerfile 2>/dev/null

# Docker Compose — exposed ports, secrets in env
cat docker-compose*.yml 2>/dev/null | grep -A2 "ports:\|environment:" | head -30

# Kubernetes configs — RBAC, network policies, secrets
find . -name "*.yaml" -o -name "*.yml" | xargs grep -l "kind: Secret\|kind: NetworkPolicy\|kind: Role" 2>/dev/null | grep -v node_modules

# Are secrets in k8s manifests committed as plaintext?
find . \( -name "*.yaml" -o -name "*.yml" \) -not -path '*/.git/*' | \
  xargs grep -l "kind: Secret" 2>/dev/null | while read f; do
    grep -c "stringData\|data:" "$f" 2>/dev/null && echo "  -> $f"
  done

# SSL/TLS configuration
grep -rn "rejectUnauthorized.*false\|verify.*false\|VERIFY_NONE\|InsecureSkipVerify" \
  . --include="*.ts" --include="*.js" --include="*.py" --include="*.go" \
  --include="*.yaml" | grep -v node_modules | grep -v vendor | head -10
```

```bash
mark_done 14
```

**Run `/compact`. Proceed to Phase 7.**

**BUDGET CHECK:** Run `/cost` and log to `budget_log.md`. Phase 7 reads
actual source files — the most token-intensive phase. If cumulative cost
exceeds $40, limit `cat` reads to `head -100` per file and skip Phase 7d
(integrations) if not business-critical.

---

## Phase 7 — High-risk module deep reads (60–90 min)

```bash
mark_running 15
```

**Goal:** Read actual code in the highest-risk areas of the codebase. Adapt these to the repo's domain.

### 7a — Payment / billing / financial logic

```bash
# Find payment-related code (adapt keywords to the domain)
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" \) | \
  xargs grep -l "payment\|billing\|charge\|invoice\|subscription\|stripe\|paypal\|refund\|installment" 2>/dev/null | \
  grep -v node_modules | grep -v vendor | grep -v test | head -15

# Read the core payment service (adapt path after finding)
# cat src/modules/payment/payment.service.ts 2>/dev/null | head -200
```

**What to look for:**
- Is payment logic centralised or scattered?
- Is there validation before any charge?
- Are financial calculations unit-tested?
- Are payment webhook signatures verified?
- Is idempotency handled for payment operations?

```bash
mark_done 15
```

**Run `/compact` after this sub-step.**

### 7b — User data and privacy

```bash
mark_running 16
```

```bash
# What user data is collected and stored
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" \) | \
  xargs grep -l "user\|profile\|account\|registration\|signup" 2>/dev/null | \
  grep -v node_modules | grep -v vendor | grep -v test | head -15

# Data deletion / GDPR compliance
grep -rn "delete.*user\|remove.*account\|gdpr\|right.to.forget\|data.export\|anonymize\|anonymise" \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v vendor | head -10
```

```bash
mark_done 16
```

### 7c — Error handling consistency

```bash
mark_running 17
```

```bash
# Is there a global error handler?
find . -name "*exception*" -o -name "*error*filter*" -o -name "*error*handler*" -o -name "*error*middleware*" | \
  grep -v node_modules | grep -v vendor | grep -v test | head -10

# Unhandled async operations (crashes waiting to happen)
grep -rn "async " . --include="*.ts" --include="*.js" | \
  grep -v "try\|catch\|await" | grep -v node_modules | grep -v test | wc -l

# Are error responses leaking stack traces?
grep -rn "stack\|stackTrace\|traceback\|err.message" \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v vendor | grep -v test | \
  grep "res\.\|response\.\|send\|json(" | head -10
```

```bash
mark_done 17
```

### 7d — Third-party integrations

```bash
mark_running 18
```

```bash
# External API calls — what does this system talk to?
grep -rn "fetch(\|axios\.\|http\.\|https\.\|request(\|urllib\|requests\." \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v vendor | grep -v test | head -20

# Webhook handlers — are signatures verified?
grep -rn "webhook\|signature\|verify\|hmac" \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v vendor | head -10
```

```bash
mark_done 18
```

**Run `/compact`. Proceed to Phase 8.**

---

## Phase 8 — CI/CD and deployment pipeline (15 min)

```bash
mark_running 19
```

```bash
# What CI system?
ls -la .github/workflows/ .gitlab-ci.yml .circleci/ Jenkinsfile \
  .travis.yml bitbucket-pipelines.yml .buildkite/ 2>/dev/null

# Read CI config
cat .github/workflows/*.yml 2>/dev/null | head -100
cat .gitlab-ci.yml 2>/dev/null | head -100

# What runs on PRs? Tests? Lint? Security scan?
grep -A5 "pull_request\|merge_request\|on:" .github/workflows/*.yml 2>/dev/null | head -30

# Is there linting?
cat .eslintrc* eslint.config.* .flake8 .pylintrc .golangci.yml 2>/dev/null | head -30

# Pre-commit hooks?
cat .husky/pre-commit .pre-commit-config.yaml 2>/dev/null | head -20

# Static analysis / security scanning in CI
grep -rn "snyk\|sonar\|semgrep\|bandit\|gosec\|brakeman\|sast\|dast\|codeql\|trivy\|grype" \
  .github/ .gitlab-ci.yml 2>/dev/null | head -10

# Docker / deployment config
ls -la Dockerfile docker-compose* k8s/ kubernetes/ helm/ 2>/dev/null
cat Dockerfile 2>/dev/null | head -30

# Environment management
ls -la .env.example .env.sample .env.template 2>/dev/null
```

**Log:** What's automated (tests, lint, security scans, deploy), quality gates before merge, deployment strategy.

```bash
mark_done 19
```

**Run `/compact`. Proceed to Phase 9.**

---

## Phase 9 — Documentation health (20 min)

**Goal:** Assess whether a new developer (or an AI agent) could understand the system from its documentation alone. Poor docs are a multiplier on every other problem — they slow onboarding, increase incident response time, and make AI-assisted development unreliable.

### 9a — Project-level documentation

```bash
mark_running 20
```

```bash
# README — does it exist and is it substantive?
ls -la README* readme* 2>/dev/null
wc -l README* readme* 2>/dev/null

# Does it cover the basics?
for term in "install" "setup" "run" "deploy" "test" "environment" "contributing" "architecture" "license"; do
  count=$(grep -ic "$term" README* readme* 2>/dev/null | awk -F: '{sum+=$2} END {print sum+0}')
  echo "$term: $count mentions"
done

# Other top-level docs
ls -la CONTRIBUTING* CHANGELOG* SECURITY* ARCHITECTURE* \
  docs/ doc/ wiki/ 2>/dev/null

# Is there an architecture document or diagram?
find . -maxdepth 3 \( -name "ARCHITECTURE*" -o -name "architecture*" \
  -o -name "DESIGN*" -o -name "design*" -o -name "*.drawio" \
  -o -name "*.mermaid" -o -name "system-design*" \) \
  -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null

# Changelog — is it maintained?
if [ -f CHANGELOG.md ] || [ -f CHANGELOG ] || [ -f CHANGES.md ]; then
  echo "=== Last 10 lines of changelog ==="
  tail -10 CHANGELOG* CHANGES* 2>/dev/null
else
  echo "No changelog found"
fi
```

```bash
mark_done 20
```

### 9b — API documentation

```bash
mark_running 21
```

```bash
# OpenAPI / Swagger spec
find . -maxdepth 4 \( -name "swagger*" -o -name "openapi*" -o -name "api-spec*" \
  -o -name "*.swagger.*" -o -name "*.openapi.*" \) \
  -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null

# Swagger/OpenAPI tooling in dependencies
grep -i "swagger\|openapi\|@nestjs/swagger\|drf-spectacular\|swaggo\|springdoc" \
  package.json requirements.txt pyproject.toml go.mod Cargo.toml \
  build.gradle pom.xml 2>/dev/null

# GraphQL schema
find . -maxdepth 4 \( -name "*.graphql" -o -name "*.gql" -o -name "schema.graphql" \) \
  -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null

# API route files — are endpoints commented/documented?
# (Find route files, then check comment density)
ROUTE_FILES=$(find . -type f \( -name "*.controller.ts" -o -name "*.routes.ts" \
  -o -name "*.router.ts" -o -name "routes.py" -o -name "urls.py" \
  -o -name "views.py" -o -name "*_handler.go" \) \
  -not -path '*/node_modules/*' -not -path '*/vendor/*' 2>/dev/null | head -10)

if [ -n "$ROUTE_FILES" ]; then
  for f in $ROUTE_FILES; do
    total=$(wc -l < "$f")
    comments=$(grep -c "//\|#\|/\*\|\*\|@Api\|@swagger\|@description\|\"\"\"" "$f" 2>/dev/null || echo 0)
    echo "$f: $total lines, $comments comment lines ($(( comments * 100 / (total + 1) ))%)"
  done
fi

# Postman / Insomnia collections
find . -maxdepth 3 \( -name "*.postman_collection*" -o -name "*insomnia*" \
  -o -name "*.http" -o -name "*.rest" \) \
  -not -path '*/node_modules/*' 2>/dev/null
```

```bash
mark_done 21
```

### 9c — Code-level documentation

```bash
mark_running 22
```

```bash
# Comment density across the codebase (sample top 50 source files)
echo "=== Comment density sample ==="
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" \
  -o -name "*.java" -o -name "*.rs" \) \
  -not -path '*/node_modules/*' -not -path '*/vendor/*' -not -path '*/.git/*' \
  -not -name "*.spec.*" -not -name "*.test.*" | head -50 | while read f; do
  total=$(wc -l < "$f" 2>/dev/null || echo 0)
  if [ "$total" -gt 20 ]; then
    comments=$(grep -c "^\s*//\|^\s*#\|^\s*/\*\|^\s*\*\|^\s*\"\"\"" "$f" 2>/dev/null || echo 0)
    pct=$(( comments * 100 / (total + 1) ))
    if [ "$pct" -lt 3 ]; then
      echo "LOW ($pct%): $f ($total lines, $comments comments)"
    fi
  fi
done | head -15

# JSDoc / TSDoc / docstrings presence in public interfaces
grep -rn "@param\|@returns\|@throws\|@example\|:param\|:returns\|Args:\|Returns:\|Raises:" \
  . --include="*.ts" --include="*.js" --include="*.py" --include="*.go" | \
  grep -v node_modules | grep -v vendor | grep -v test | wc -l

# TODO/FIXME/HACK — unresolved technical notes
grep -rn "TODO\|FIXME\|HACK\|XXX\|TEMP\|WORKAROUND" \
  . --include="*.ts" --include="*.js" --include="*.py" --include="*.go" \
  --include="*.java" --include="*.rs" | \
  grep -v node_modules | grep -v vendor | wc -l

# Sample the TODOs — are they actionable or ancient?
grep -rn "TODO\|FIXME" \
  . --include="*.ts" --include="*.js" --include="*.py" --include="*.go" | \
  grep -v node_modules | grep -v vendor | head -15
```

```bash
mark_done 22
```

### 9d — Environment and setup documentation

```bash
mark_running 23
```

```bash
# .env.example — does it exist and is it complete?
if [ -f .env.example ] || [ -f .env.sample ] || [ -f .env.template ]; then
  echo "=== .env template found ==="
  wc -l .env.example .env.sample .env.template 2>/dev/null
  # How many vars are documented vs just listed?
  grep -c "#" .env.example .env.sample .env.template 2>/dev/null
else
  echo "WARNING: No .env.example/.env.sample/.env.template found"
fi

# Docker setup docs
if [ -f Dockerfile ] || [ -f docker-compose.yml ] || [ -f docker-compose.yaml ]; then
  # Is there a docker section in the README?
  grep -ic "docker" README* readme* 2>/dev/null
fi

# Makefile or scripts — is there a "make help" equivalent?
if [ -f Makefile ]; then
  echo "=== Makefile targets ==="
  grep -E "^[a-zA-Z_-]+:" Makefile | head -15
fi

# package.json scripts — are they self-documenting?
cat package.json 2>/dev/null | jq '.scripts | keys' 2>/dev/null

# Is there a development setup guide?
find . -maxdepth 3 \( -name "DEVELOPMENT*" -o -name "SETUP*" \
  -o -name "GETTING_STARTED*" -o -name "LOCAL_SETUP*" \
  -o -name "dev-setup*" -o -name "onboarding*" \) \
  -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null
```

```bash
mark_done 23
```

### 9e — Database and data model documentation

```bash
mark_running 24
```

```bash
# Is the data model documented anywhere?
find . -maxdepth 4 \( -name "*.erd" -o -name "*erd*" -o -name "*schema*" \
  -o -name "*data-model*" -o -name "*database*" \) \
  -not -path '*/node_modules/*' -not -path '*/.git/*' \
  -not -name "*.ts" -not -name "*.js" -not -name "*.py" 2>/dev/null | head -10

# Are database migrations documented / named clearly?
find . -maxdepth 5 -type d -name "migrations" -o -name "migrate" 2>/dev/null | \
  grep -v node_modules | while read dir; do
    count=$(ls -1 "$dir" 2>/dev/null | wc -l)
    sample=$(ls -1 "$dir" 2>/dev/null | tail -5)
    echo "$dir: $count migration files"
    echo "  Recent: $sample"
  done

# ORM model files — do they have comments?
find . -type f \( -name "*.entity.ts" -o -name "*.model.ts" -o -name "*.schema.ts" \
  -o -name "models.py" -o -name "*.model.go" \) \
  -not -path '*/node_modules/*' -not -path '*/vendor/*' 2>/dev/null | head -10 | while read f; do
  total=$(wc -l < "$f")
  comments=$(grep -c "//\|#\|/\*\|\*\|\"\"\"" "$f" 2>/dev/null || echo 0)
  echo "$f: $total lines, $comments comment lines"
done
```

**Log:** README quality, API docs presence, comment density, TODO count, env template status, data model docs.

```bash
mark_done 24
```

**Run `/compact`. Proceed to Phase 10.**

---

## Phase 10 — Produce the report (15 min)

```bash
mark_running 25
```

Synthesize everything into a structured report. Write to `~/audit-{repo-name}/codebase_health.md`.

Use this template:

```markdown
# Codebase Health Report
**Date:** [today's date in YYYY-MM-DD format]
**Audit ID:** [YYYY-MM-DD] (used for historical comparison)
**Reviewer:** Claude Code (CTO audit)
**Repo:** [REPO_NAME]
**Commit:** [git rev-parse HEAD]
**Stack:** [detected stack]

## Executive summary
[3–5 sentences: biggest strength, biggest risk, most urgent action]

## Scorecard

| Dimension                | Score  | Evidence |
|--------------------------|--------|----------|
| Test coverage            | ?/10   | |
| Dependency health        | ?/10   | |
| Code duplication         | ?/10   | |
| Complexity (hot files)   | ?/10   | |
| Secret management        | ?/10   | |
| Auth & access control    | ?/10   | |
| Input validation         | ?/10   | |
| API security             | ?/10   | |
| Data protection          | ?/10   | |
| Error handling           | ?/10   | |
| CI/CD discipline         | ?/10   | |
| Commit hygiene           | ?/10   | |
| Infrastructure security  | ?/10   | |
| README & project docs    | ?/10   | |
| API documentation        | ?/10   | |
| Code-level documentation | ?/10   | |
| Setup & onboarding docs  | ?/10   | |
| Contributor balance      | ?/10   | |
| Code review culture      | ?/10   | |
| Deployment maturity      | ?/10   | |

## Critical findings (fix immediately)
[Anything scored 3/10 or below with specific file paths]

## Security findings
[All security issues grouped by severity: Critical, High, Medium, Low]

## Team & contributor analysis
[From Phases 5e–5g]
- **Contributor concentration:** [Is work spread evenly or concentrated?]
- **Per-contributor summary table:**

| Contributor | Commits (12mo) | Lines added | Avg files/commit | Primary areas | Risk |
|---|---|---|---|---|---|
| [name] | | | | | |

- **Code review culture:** [Self-merge rate, avg time to merge, review bottlenecks]
- **DORA metrics:**

| Metric | Value | DORA Rating |
|---|---|---|
| Deploy frequency | | Elite / High / Medium / Low |
| Change failure rate | | Elite / High / Medium / Low |
| Lead time for changes | | Elite / High / Medium / Low |
| Mean time to recovery | | Elite / High / Medium / Low |

- **Key risks:** [Bus factor, knowledge silos, departure risk, burnout signals]

## High-risk files
[The 10 files that need the most care during any changes]

## Bus factor risks
[Areas with single-person ownership]

## Beyond this audit — requires additional access
[Items that need more than repo access to investigate]
- [ ] Incident history (Sentry / error tracking) — actual production failure rate
- [ ] Monitoring dashboards (Grafana / Datadog) — response times, error rates, queue depths
- [ ] Database performance — query plans on hot tables, index coverage, pool utilization
- [ ] Penetration test against staging — what code review misses
- [ ] Actual .env contents on servers — credential rotation history, shared credentials
- [ ] Network architecture — firewall rules, VPC config, external access to internal services
- [ ] Team interviews — who's active, on-call rotation, institutional knowledge
- [ ] Financial/business data — transaction volumes, revenue, default rates
- [ ] Compliance & regulatory — licensing requirements, data processing agreements, PCI scope

## Recommended next steps
[Prioritised list: what to fix first, second, third]
```

```bash
mark_done 25
show_progress
```

### Archive with timestamp

After the markdown report is complete, create timestamped copies of all
audit artifacts. This enables comparison with future audits.

```bash
AUDIT_DIR=$(pwd)
TIMESTAMP=$(date +%Y-%m-%d)

# Create archive directory
mkdir -p "$AUDIT_DIR/history/$TIMESTAMP"

# Copy all artifacts with timestamps
for f in findings.md codebase_health.md work_volume_estimate.md repo_context.md budget_log.md; do
  if [ -f "$AUDIT_DIR/$f" ]; then
    cp "$AUDIT_DIR/$f" "$AUDIT_DIR/history/$TIMESTAMP/$f"
  fi
done

# Also create timestamped copies in the main directory for quick reference
cp "$AUDIT_DIR/codebase_health.md" "$AUDIT_DIR/codebase_health_${TIMESTAMP}.md" 2>/dev/null
cp "$AUDIT_DIR/findings.md" "$AUDIT_DIR/findings_${TIMESTAMP}.md" 2>/dev/null

echo "✅ Archived audit artifacts to history/$TIMESTAMP/"
ls -la "$AUDIT_DIR/history/$TIMESTAMP/"
```

**BUDGET CHECK — GATE:** Run `/cost` and log to `budget_log.md`.
Phase 11 generates two large HTML files (~15-60KB each) which requires
significant token output. The markdown report (`codebase_health.md`) is
already complete at this point.

- If cumulative cost < $30: proceed with both reports
- If cumulative cost $30–$50: generate management report only (11a), skip 11b
- If cumulative cost > $50: **skip Phase 11 entirely** — the markdown report
  is sufficient, and HTML reports can be generated in a separate session

Log the decision in `budget_log.md`.

---

## Phase 11 — Interactive HTML reports (30–45 min)

**Goal:** Generate two self-contained HTML reports from the audit findings — one for non-technical management, one for the engineering team. Both render instantly with zero external dependencies.

### 11a — Management report

```bash
mark_running 26
```

Generate `~/audit-{repo-name}/report_management.html` using this prompt. Feed it the contents of `findings.md` and `codebase_health.md` as context.

**Important:** Name the file with a timestamp: `report_management_YYYY-MM-DD.html`
(using today's date). Also create a copy without the timestamp for convenience.

```
Create a self-contained HTML report at ~/audit-{repo-name}/report_management_[DATE].html
for UPPER MANAGEMENT (non-technical audience).

Include the audit date prominently in the report header and footer.
The header should show: "Codebase Audit — [REPO_NAME] — [DATE]"
The footer should show: "Confidential — Codebase Audit Report — [DATE] — Audit ID: [DATE]"

CRITICAL REQUIREMENTS:
- NO external dependencies (no Chart.js, no CDN, no JavaScript libraries)
- ALL charts must be CSS-only (progress bars, conic-gradient gauges,
  colored div-width bars, CSS grid matrices)
- Minimal JavaScript — only smooth scroll navigation, counter animation,
  and dark/light theme toggle with localStorage persistence
- Must render INSTANTLY with zero loading delay
- Single HTML file, all CSS inline in <style> tag
- Dark/light theme toggle (pill-shaped switch in nav bar, defaults to light)
- Use CSS custom properties on :root for light theme, html.dark class for
  dark overrides
- Severity colors (red/orange/yellow/green) stay constant across themes —
  only backgrounds, cards, text, borders switch
- Print-friendly (@media print), responsive layout

DATA SOURCE:
- Read ~/audit-{repo-name}/findings.md and ~/audit-{repo-name}/codebase_health.md
- Extract ALL scores, findings, team data, and metrics from those files
- Every number in the report must come from the actual audit data

LANGUAGE RULES — this is for NON-TECHNICAL management:
- NO code snippets, NO file paths, NO technical jargon
- Translate technical terms to business language:
  "endpoint" → "page/service", "auth guard" → "login requirement",
  "CI pipeline" → "automated deployment process",
  "rate limiting" → "brute-force protection",
  "SQL injection" → "database attack vulnerability",
  "XSS" → "script injection attack",
  "CORS" → "cross-site access control"
- Focus on: risk, money, timelines, business impact

DESIGN:
- Light theme: background #f8fafc, cards white with subtle shadows, text #1e293b
- Dark theme: background #0f172a, cards #1e293b, text #e2e8f0
- Colors: Critical=#dc2626, High=#ea580c, Warning=#ca8a04, Good=#16a34a,
  Neutral=#6b7280
- Sticky top navigation bar with section links, smooth scroll
- Large stat cards with animated counters
- Traffic light indicators (red/yellow/green circles)
- Professional executive dashboard feel
- Footer: "Confidential — Codebase Audit Report — [DATE] — Audit ID: [DATE]"

REQUIRED SECTIONS (adapt content to actual audit findings):

1. Executive Dashboard
   - CSS conic-gradient health gauge (overall score out of 10)
   - 6 big stat cards: critical issues count, code review rate,
     test coverage %, documentation score, security score, deployment maturity
   - 8-item traffic light status grid (green/yellow/red for each audit dimension)

2. Critical Business Risks
   - One red-bordered card per Critical finding from the audit
   - Each card: plain-language description, business impact,
     estimated fix effort (Small/Medium/Large)
   - If no Critical findings, show a green "No critical risks" card

3. Team Performance
   - CSS horizontal bars for contribution share per team member
   - Individual assessment table: Name, Commits, Share %, Primary Areas,
     Concerns, Rating
   - Pull data from the per-contributor analysis in codebase_health.md

4. Code Review Process
   - 4 stat cards: review rate, self-merge rate, avg merge time,
     branch protection status
   - Traffic light rating for each

5. Risk Matrix
   - CSS grid (4×4) with colored circles positioned by
     likelihood (x-axis) vs business impact (y-axis)
   - Place each Critical and High finding on the matrix

6. Industry Comparison
   - Side-by-side CSS horizontal bars per scorecard dimension:
     blue = industry standard (7/10), colored = actual score
     (red if ≤2, orange if ≤4, yellow if ≤6, green if >6)

7. Remediation Roadmap
   - CSS vertical timeline with 4 colored phases:
     Emergency (RED, Week 1) → High Priority (ORANGE, Weeks 2-4) →
     Foundation (YELLOW, Months 1-2) → Scale (GREEN, Months 2-4)
   - Each phase: timeline, effort estimate, bullet list of items
   - Items must come from actual findings, prioritised by severity

8. Investment Summary
   - Table: Phase / Timeline / Effort / Risk Reduction
   - Before/after CSS bars: current overall score vs projected score
     after remediation
```

**After generating, create convenience copy and verify:**

```bash
TIMESTAMP=$(date +%Y-%m-%d)

# Create convenience copy without timestamp
cp ~/audit-{repo-name}/report_management_${TIMESTAMP}.html \
   ~/audit-{repo-name}/report_management.html 2>/dev/null

# Archive timestamped copy
cp ~/audit-{repo-name}/report_management_${TIMESTAMP}.html \
   ~/audit-{repo-name}/history/${TIMESTAMP}/ 2>/dev/null

# Verify
wc -c ~/audit-{repo-name}/report_management_${TIMESTAMP}.html
# Should be 15-40KB for a well-structured report
head -5 ~/audit-{repo-name}/report_management_${TIMESTAMP}.html
# Should start with <!DOCTYPE html>
```

```bash
mark_done 26
```

**Run `/compact` after this sub-step.**

### 11b — Technical report

```bash
mark_running 27
```

Generate `~/audit-{repo-name}/report_technical.html` using this prompt. Feed it the contents of `findings.md` and `codebase_health.md` as context.

**Important:** Name the file with a timestamp: `report_technical_YYYY-MM-DD.html`
(using today's date). Also create a copy without the timestamp for convenience.

```
Create a self-contained HTML report at ~/audit-{repo-name}/report_technical_[DATE].html
for the CTO / engineering team (technical audience).

Include the audit date in the report header: "Technical Audit — [REPO_NAME] — [DATE]"
Include audit ID in the sidebar footer: "Audit ID: [DATE]"

CRITICAL REQUIREMENTS:
- NO external dependencies (no Chart.js, no CDN, no JavaScript libraries)
- ALL charts must be CSS-only (conic-gradient donuts, div-width bars,
  CSS grid heatmaps)
- Minimal JavaScript — only smooth scroll, collapsible sections,
  active nav highlight, and dark/light theme toggle with localStorage
- Must render INSTANTLY
- Single HTML file, all CSS inline
- Dark/light theme toggle (pill-shaped switch in sidebar, defaults to dark)
- Use CSS custom properties on :root for dark theme, html.light class for
  light overrides
- Severity colors remain constant across themes
- Collapsible finding cards via <details>/<summary> (CSS-only, no JS)
- File paths in monospace font
- Print-friendly, responsive

DATA SOURCE:
- Read ~/audit-{repo-name}/findings.md and ~/audit-{repo-name}/codebase_health.md
- Extract ALL scores, findings, file paths, team data, and metrics
- Every number, file path, and finding must come from the actual audit data

DESIGN:
- Dark theme: background #0f172a, cards #1e293b, text #e2e8f0, sidebar #0b1120
- Light theme: background #f8fafc, cards #ffffff, text #1e293b, sidebar #1e293b
- Accent colors: Critical=#ef4444, High=#f97316, Medium=#eab308, Low=#3b82f6,
  Info=#6b7280, Good=#22c55e
- Fixed sidebar navigation on the left with section links
- Smooth scrolling, active section highlighting

REQUIRED SECTIONS (adapt content to actual audit findings):

1. Executive Summary
   - Repo metadata pills (stack, LOC, files, detected frameworks)
   - 5 stat cards: overall score, critical count, high count,
     review rate, test coverage

2. Quality Scorecard
   - 20-dimension CSS horizontal bar chart, each bar colored by score:
     1-2=red, 3-4=orange, 5-6=yellow, 7-8=green, 9-10=blue
   - Dimensions from the scorecard in codebase_health.md

3. Findings by Severity
   - CSS conic-gradient donut chart showing count distribution
     (Critical/High/Medium/Low/Info)
   - Critical findings as collapsible <details> cards with:
     file path, line numbers, description, remediation steps
   - High findings as compact two-column list with orange dot indicators
   - Medium/Low findings as counts with expandable lists

4. Security Deep Dive
   - Group all security findings by category
     (Secrets, Auth, Injection, API, Data Protection, Infrastructure)
   - Each finding: severity badge, file path, description, remediation
   - Issue attribution table if contributor data is available

5. PR Review & Collaboration Analysis
   - 5 stat cards: review rate, self-merge %, merge time,
     branch protection, direct push count
   - Merge pattern analysis from Phase 5f findings

6. Developer Evaluation
   - CSS horizontal bars for commit share per contributor
   - Quality matrix table: Contributor | Commits | Areas |
     Avg Commit Size | Churn Rate | Rating
   - Cells color-coded: Low=red bg, Moderate=yellow bg,
     High=green bg, Excellent=blue bg
   - Data from Phase 5e findings

7. DORA Metrics
   - 4 large cards, one per DORA metric:
     Deploy Frequency, Lead Time, Change Failure Rate, MTTR
   - Each card shows value + DORA rating (Elite/High/Medium/Low)
     with corresponding color
   - Data from Phase 5g findings

8. High-Risk Files
   - CSS horizontal bars sized proportionally by line count,
     colored by risk level (Critical=red, High=orange, Medium=yellow)
   - File path in monospace, risk reason beside each bar

9. Documentation Gaps
   - Table: Area | Status | Gap
   - Color-coded status cells (Present=green, Partial=yellow, Missing=red)
   - Data from Phase 9a-9e findings

10. Remediation Roadmap
    - CSS vertical timeline with 4 phases:
      Phase 1 RED (Week 1, critical fixes) →
      Phase 2 ORANGE (Weeks 2-4, high priority) →
      Phase 3 YELLOW (Months 1-2, foundation work) →
      Phase 4 GREEN (Months 2-4, scaling & hardening)
    - Each item links to a specific finding

11. Security Checklist
    - Two-column grid: left "Passing" (green checkmarks),
      right "Failing" (red X marks)
    - Pull from security checklist results in findings.md
```

**After generating, verify the file renders correctly:**

```bash
wc -c ~/audit-{repo-name}/report_technical.html
# Should be 25-60KB for a detailed technical report
head -5 ~/audit-{repo-name}/report_technical.html
# Should start with <!DOCTYPE html>
```

**After generating, create convenience copy and verify:**

```bash
TIMESTAMP=$(date +%Y-%m-%d)

# Create convenience copy without timestamp
cp ~/audit-{repo-name}/report_technical_${TIMESTAMP}.html \
   ~/audit-{repo-name}/report_technical.html 2>/dev/null

# Archive timestamped copy
cp ~/audit-{repo-name}/report_technical_${TIMESTAMP}.html \
   ~/audit-{repo-name}/history/${TIMESTAMP}/ 2>/dev/null

# Verify
wc -c ~/audit-{repo-name}/report_technical_${TIMESTAMP}.html
# Should be 25-60KB for a detailed technical report
head -5 ~/audit-{repo-name}/report_technical_${TIMESTAMP}.html
# Should start with <!DOCTYPE html>
```

```bash
mark_done 27
show_progress
```

---

## Phase 12 — Comparison with previous audit (conditional, 30–45 min)

**This phase runs ONLY if a previous audit exists.** If this is the first
audit, skip to "Phase priority" below.

```bash
# Check for previous audits
AUDIT_DIR=$(pwd)
TIMESTAMP=$(date +%Y-%m-%d)
PREV_AUDITS=$(ls -d "$AUDIT_DIR/history"/*/ 2>/dev/null | grep -v "$TIMESTAMP" | sort -r)

if [ -z "$PREV_AUDITS" ]; then
  echo "No previous audits found — skipping Phase 12"
  mark_skipped 28
  mark_skipped 29
  mark_skipped 30
  show_progress
else
  PREV_DATE=$(basename $(echo "$PREV_AUDITS" | head -1))
  echo ""
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║         PREVIOUS AUDIT FOUND                         ║"
  echo "╠══════════════════════════════════════════════════════╣"
  echo "║  Previous audit: $PREV_DATE"
  echo "║  Current audit:  $TIMESTAMP"
  echo "║  Days between:   $(( ( $(date -d "$TIMESTAMP" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$TIMESTAMP" +%s) - $(date -d "$PREV_DATE" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$PREV_DATE" +%s) ) / 86400 )) days"
  echo "║"
  echo "║  Proceeding with comparison analysis..."
  echo "╚══════════════════════════════════════════════════════╝"
fi
```

### 12a — Generate comparison report (markdown)

```bash
mark_running 28
```

Read both the current and previous `codebase_health.md` files and produce
a comparison report:

```bash
PREV_DATE=$(ls -d "$AUDIT_DIR/history"/*/ 2>/dev/null | grep -v "$TIMESTAMP" | sort -r | head -1 | xargs basename)
PREV_HEALTH="$AUDIT_DIR/history/$PREV_DATE/codebase_health.md"
CURR_HEALTH="$AUDIT_DIR/codebase_health.md"
PREV_FINDINGS="$AUDIT_DIR/history/$PREV_DATE/findings.md"
CURR_FINDINGS="$AUDIT_DIR/findings.md"
```

**Prompt Claude Code to generate the comparison:**

```
Read these two audit reports and generate a comparison:

PREVIOUS AUDIT ($PREV_DATE): [contents of $PREV_HEALTH]
CURRENT AUDIT ($TIMESTAMP): [contents of $CURR_HEALTH]

Also read the findings files for detailed comparison:
PREVIOUS FINDINGS: [contents of $PREV_FINDINGS]
CURRENT FINDINGS: [contents of $CURR_FINDINGS]

Write the comparison to ~/audit-{repo-name}/comparison_${PREV_DATE}_vs_${TIMESTAMP}.md

Use this structure:

# Audit Comparison: [PREV_DATE] → [TIMESTAMP]
**Repo:** [REPO_NAME]
**Period:** [PREV_DATE] to [TIMESTAMP] ([X] days)

## Executive Summary
[3–5 sentences: what improved, what degraded, what's new, biggest change]

## Scorecard Comparison

| Dimension | Previous | Current | Change | Trend |
|---|---|---|---|---|
| Test coverage | X/10 | Y/10 | +/-Z | ▲ Improved / ▼ Declined / ─ Same |
| [all 20 dimensions] | | | | |
| **Overall average** | X.X/10 | Y.Y/10 | +/-Z.Z | |

## What Improved
[List findings from previous audit that are now resolved]

## What Degraded
[List new findings not present in previous audit, or scores that dropped]

## Persistent Issues
[List findings present in BOTH audits — these are the ones being ignored]

## New Risks
[List Critical/High findings that appeared since the previous audit]

## Team Changes
[Compare contributor data: who's new, who left, volume changes]

## DORA Metrics Trend
| Metric | Previous | Current | Change |
|---|---|---|---|
| Deploy frequency | | | |
| Change failure rate | | | |
| Lead time | | | |
| MTTR | | | |

## Remediation Progress
[Which items from the previous audit's roadmap were actually completed?]

## Recommendation
[Based on the trend: is the codebase getting healthier or not?
 What should be prioritised for the next audit cycle?]
```

```bash
mark_done 28
```

**Run `/compact` after this sub-step.**

### 12b — Comparison report for management (HTML)

```bash
mark_running 29
```

```
Create a self-contained HTML report at
~/audit-{repo-name}/report_comparison_management_${TIMESTAMP}.html
for UPPER MANAGEMENT (non-technical audience).

This is a COMPARISON report between two audits:
- Previous audit: [PREV_DATE]
- Current audit: [TIMESTAMP]

Read ~/audit-{repo-name}/comparison_${PREV_DATE}_vs_${TIMESTAMP}.md for the data.

CRITICAL REQUIREMENTS:
- Same technical requirements as the main management report
  (no dependencies, CSS-only charts, dark/light toggle, responsive)
- Same language rules (no technical jargon, business language only)

REQUIRED SECTIONS:

1. Executive Dashboard
   - Two CSS conic-gradient gauges side by side:
     left = previous overall score, right = current overall score
   - Large +/- delta indicator between them (green if improved, red if declined)
   - 6 stat cards showing: issues resolved, new issues found,
     persistent issues, score change, team changes, days between audits

2. Progress Scorecard
   - 20 horizontal CSS bars, each showing previous (faded) and current (solid)
     side by side
   - Green arrow if improved, red arrow if declined, grey dash if same
   - Overall trend indicator at the top

3. What Got Fixed
   - Green-bordered cards for each resolved finding
   - Plain-language description of what the risk was and that it's now addressed
   - If nothing was fixed, a red warning card: "No previous findings were resolved"

4. New Risks
   - Red-bordered cards for each new Critical/High finding
   - Business impact and urgency

5. Persistent Issues
   - Orange-bordered cards for findings present in both audits
   - "Days unresolved" counter on each card
   - These are the most important items — they signal organisational inertia

6. Team Trend
   - Before/after CSS bars for contributor activity
   - Highlight: new contributors, departed contributors, workload shifts

7. Investment Effectiveness
   - If the previous audit included a remediation roadmap:
     What was recommended vs what was actually done?
   - CSS progress bars: recommended items completed / total

8. Next Steps
   - Prioritised action list based on what the comparison reveals

Footer: "Confidential — Audit Comparison — [PREV_DATE] vs [TIMESTAMP]"
```

```bash
# Create convenience copy and archive
cp ~/audit-{repo-name}/report_comparison_management_${TIMESTAMP}.html \
   ~/audit-{repo-name}/report_comparison_management.html 2>/dev/null
cp ~/audit-{repo-name}/report_comparison_management_${TIMESTAMP}.html \
   ~/audit-{repo-name}/history/${TIMESTAMP}/ 2>/dev/null

mark_done 29
```

**Run `/compact` after this sub-step.**

### 12c — Comparison report for CTO (HTML)

```bash
mark_running 30
```

```
Create a self-contained HTML report at
~/audit-{repo-name}/report_comparison_technical_${TIMESTAMP}.html
for the CTO / engineering team (technical audience).

This is a COMPARISON report between two audits:
- Previous audit: [PREV_DATE]
- Current audit: [TIMESTAMP]

Read ~/audit-{repo-name}/comparison_${PREV_DATE}_vs_${TIMESTAMP}.md for the data.

CRITICAL REQUIREMENTS:
- Same technical requirements as the main technical report
  (no dependencies, CSS-only charts, sidebar nav, dark/light toggle)
- File paths in monospace, collapsible sections

REQUIRED SECTIONS:

1. Executive Summary
   - Repo metadata pills + audit period indicator
   - 6 stat cards: overall delta, resolved count, new count,
     persistent count, DORA trend, review rate change

2. Scorecard Diff
   - 20-dimension bar chart with TWO bars per dimension:
     faded = previous score, solid = current score
   - Sorted by largest negative change first (regressions at top)

3. Resolved Findings
   - Collapsible <details> cards for each finding from the previous
     audit that no longer appears
   - File path, what it was, when it was introduced, when it was fixed

4. New Findings
   - Collapsible <details> cards for each finding NOT in the previous audit
   - Severity badge, file path, description, remediation

5. Persistent Findings
   - Table: Finding | Severity | First Seen | Days Open | Status
   - Sorted by severity then age
   - Color-coded: Critical/open > 30 days = red highlight

6. Security Trend
   - Side-by-side security checklist: previous vs current
   - Green highlights for newly passing items
   - Red highlights for newly failing items

7. Team Performance Diff
   - Per-contributor comparison table:
     Contributor | Prev Commits | Curr Commits | Change | Areas
   - Highlight departures and new contributors

8. DORA Metrics Trend
   - 4 large cards with before/after values and delta
   - DORA rating change indicator (e.g., "Medium → High")

9. Remediation Accountability
   - Table: Previous Recommendation | Status (Done/Partial/Not Started)
   - Completion rate percentage

10. Code Quality Trend
    - File churn comparison: are the same files still churning?
    - Duplication trend: better or worse?
    - Test coverage trend

Footer: "Audit Comparison — [PREV_DATE] vs [TIMESTAMP] — [REPO_NAME]"
```

```bash
# Create convenience copy and archive
cp ~/audit-{repo-name}/report_comparison_technical_${TIMESTAMP}.html \
   ~/audit-{repo-name}/report_comparison_technical.html 2>/dev/null
cp ~/audit-{repo-name}/report_comparison_technical_${TIMESTAMP}.html \
   ~/audit-{repo-name}/history/${TIMESTAMP}/ 2>/dev/null

mark_done 30
show_progress
```

---

## Phase priority if budget runs low

If you must cut phases short, prioritise in this order:

1. **Always complete Phase 6a–6d** (security) — highest risk
2. **Always complete Phase 7a** (payment/financial) — business risk
3. **Always complete Phase 2** (dependencies) — fastest risk signal
4. Phase 3 (tests) — essential context
5. Phase 1 (orientation) — needed for everything else
6. Phase 5e–5g (team performance) — critical for CTO takeover decisions
7. Phase 9 (documentation) — critical for onboarding and AI readiness
8. Phase 5a–5d (git archaeology) — informational, can be partial
9. Phase 4 (complexity) — top 20 files is enough
10. Phase 8 (CI/CD) — quick, do if time permits
11. **Phase 11 (HTML reports) — generate after Phase 10, budget permitting**
12. **Phase 12 (comparison) — only if previous audit exists and budget permits**

---

## Appendix A: Security checklist summary

Use this as a quick reference after the full audit. Mark each item:

```
[ ] No hardcoded secrets in source code
[ ] .env files not committed to git
[ ] .gitignore covers all secret file patterns
[ ] No private keys in the repository
[ ] Auth logic is centralised (guards/middleware)
[ ] JWT uses strong algorithm with env-sourced secret
[ ] Session cookies use httpOnly, secure, sameSite
[ ] Input validation exists on all user-facing endpoints
[ ] No raw SQL with string interpolation
[ ] No dangerouslySetInnerHTML with user input
[ ] No command injection vectors
[ ] Rate limiting on API endpoints
[ ] CORS not set to wildcard in production
[ ] CSRF protection on state-changing operations
[ ] Security headers present (helmet / equivalent)
[ ] Passwords hashed with bcrypt/argon2 (not MD5/SHA1)
[ ] Sensitive data not logged
[ ] Error responses don't leak stack traces
[ ] Webhook signatures verified
[ ] Docker not running as root
[ ] SSL/TLS verification not disabled
[ ] CI pipeline includes security scanning
[ ] Dependencies have no critical vulnerabilities
[ ] PII handling follows data protection principles
```

---

## Appendix B: Documentation checklist summary

```
[ ] README exists and covers: purpose, install, run, test, deploy
[ ] README is up to date (references match current stack/scripts)
[ ] Architecture document or diagram exists
[ ] CONTRIBUTING guide exists for new developers
[ ] CHANGELOG is maintained (or releases are tagged with notes)
[ ] API documentation exists (OpenAPI/Swagger spec, or equivalent)
[ ] API docs are generated or synced (not manually maintained and stale)
[ ] Postman/Insomnia collection or .http files for API testing
[ ] .env.example exists with ALL variables listed and commented
[ ] Setup/onboarding guide exists (or README covers local dev setup)
[ ] Docker usage documented (if Docker is used)
[ ] Database schema/ERD documented or self-documenting via migrations
[ ] Migration files have clear, descriptive names
[ ] Public functions/methods have JSDoc/TSDoc/docstrings
[ ] Comment density > 5% in complex modules
[ ] TODO/FIXME count is manageable (< 50 across codebase)
[ ] TODOs are actionable (include context, not just "fix this")
[ ] No orphaned docs (docs that reference removed features/endpoints)
[ ] Makefile or package.json scripts are self-documenting
[ ] Business-critical logic has inline comments explaining "why"
```

---

*Guide version: March 2026 · Universal codebase audit · Read-only*
