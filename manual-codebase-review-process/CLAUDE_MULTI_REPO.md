# CLAUDE.md — Multi-Repo Codebase Audit
**Session type:** Read-only cross-repo audit  
**Role:** Technical lead conducting full product audit across multiple repositories  
**Companion guides:** `multi_repo_review_guide.md` + per-repo `codebase_review_guide.md`

---

## MISSION

Cross-repository product audit. After individual repo audits are complete,
analyse how the repositories connect, interact, and fail together. Produce
a unified product health report covering integration points, shared
infrastructure, and cross-cutting concerns.

All individual repo audits must be completed first using the standard
`codebase_review_guide.md`. This guide covers ONLY the cross-repo analysis.

---

## PHASE 0 — MULTI-REPO BOOTSTRAP

Run this from a dedicated product-level audit directory. It auto-detects
all repos and their individual audit results.

```bash
#!/bin/bash
# Run from a directory that can see all repo clones

PRODUCT_NAME="${1:-product}"
AUDIT_DIR=~/audit-${PRODUCT_NAME}
mkdir -p "$AUDIT_DIR"
CTX="$AUDIT_DIR/product_context.md"
TIMESTAMP=$(date +%Y-%m-%d)

echo "# Product Context — Multi-Repo Audit" > "$CTX"
echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$CTX"
echo "Product: $PRODUCT_NAME" >> "$CTX"
echo "Audit ID: $TIMESTAMP" >> "$CTX"
echo "" >> "$CTX"

# ── Discover repos ──
echo "## Repositories" >> "$CTX"
echo "" >> "$CTX"

REPO_COUNT=0
REPO_PATHS=""

# Check for repo paths passed as arguments, or scan common locations
shift  # remove product name from args
if [ $# -gt 0 ]; then
  # Repos passed as arguments
  for repo_path in "$@"; do
    if [ -d "$repo_path/.git" ]; then
      REPO_NAME=$(basename "$repo_path")
      REPO_URL=$(cd "$repo_path" && git remote get-url origin 2>/dev/null || echo "local")
      LOC=$(find "$repo_path" -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" \
        -o -name "*.java" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.vue" \) \
        -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' | \
        xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
      AUDIT_EXISTS="no"
      [ -d ~/audit-${REPO_NAME} ] && AUDIT_EXISTS="yes"

      echo "### $REPO_NAME" >> "$CTX"
      echo "- Path: $repo_path" >> "$CTX"
      echo "- URL: $REPO_URL" >> "$CTX"
      echo "- LOC: ${LOC:-unknown}" >> "$CTX"
      echo "- Individual audit exists: $AUDIT_EXISTS" >> "$CTX"
      [ "$AUDIT_EXISTS" = "yes" ] && echo "- Audit dir: ~/audit-${REPO_NAME}" >> "$CTX"
      echo "" >> "$CTX"

      REPO_PATHS="$REPO_PATHS $repo_path"
      REPO_COUNT=$((REPO_COUNT + 1))
    fi
  done
fi

echo "" >> "$CTX"
echo "Total repositories: $REPO_COUNT" >> "$CTX"

# ── Check individual audits are complete ──
echo "" >> "$CTX"
echo "## Individual Audit Status" >> "$CTX"
echo "" >> "$CTX"

MISSING_AUDITS=""
for repo_path in $REPO_PATHS; do
  REPO_NAME=$(basename "$repo_path")
  if [ -f ~/audit-${REPO_NAME}/codebase_health.md ]; then
    SCORE=$(grep -A1 "Overall average\|overall" ~/audit-${REPO_NAME}/codebase_health.md 2>/dev/null | head -1)
    echo "- ✅ $REPO_NAME — audit complete ($SCORE)" >> "$CTX"
  else
    echo "- ❌ $REPO_NAME — NO AUDIT FOUND" >> "$CTX"
    MISSING_AUDITS="$MISSING_AUDITS $REPO_NAME"
  fi
done

if [ -n "$MISSING_AUDITS" ]; then
  echo "" >> "$CTX"
  echo "⚠️ WARNING: Missing audits for:$MISSING_AUDITS" >> "$CTX"
  echo "Run individual audits first using codebase_review_guide.md" >> "$CTX"
fi

# ── Detect connections between repos ──
echo "" >> "$CTX"
echo "## Detected Connections" >> "$CTX"
echo "" >> "$CTX"

for repo_path in $REPO_PATHS; do
  REPO_NAME=$(basename "$repo_path")

  # API URLs pointing to other repos
  echo "### $REPO_NAME → outbound connections" >> "$CTX"

  grep -rh "BASE_URL\|API_URL\|BACKEND_URL\|FRONTEND_URL\|NEXT_PUBLIC_API\|VITE_API\|fetch(\|axios\." \
    "$repo_path" --include="*.ts" --include="*.js" --include="*.py" --include="*.env*" \
    --include="*.yaml" --include="*.yml" 2>/dev/null | \
    grep -v node_modules | grep -v .git | \
    grep -oE 'https?://[a-zA-Z0-9._~:/?#@!$&()*+,;=-]+' | \
    grep -v 'localhost\|127\.0\.0\.1\|schema\.org\|cdn\.\|fonts\.\|github\.com\|npmjs' | \
    sort -u >> "$CTX"

  # Docker compose / k8s service references
  grep -rh "depends_on\|service:\|container_name\|ports:" \
    "$repo_path" --include="docker-compose*" --include="*.yaml" --include="*.yml" 2>/dev/null | \
    grep -v node_modules | head -10 >> "$CTX"

  echo "" >> "$CTX"
done

echo "---" >> "$CTX"
echo "*Auto-detected. Review for accuracy.*" >> "$CTX"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║        MULTI-REPO BOOTSTRAP COMPLETE                 ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Product: $PRODUCT_NAME"
echo "║  Repositories: $REPO_COUNT"
echo "║  Audit directory: $AUDIT_DIR"
if [ -n "$MISSING_AUDITS" ]; then
echo "║"
echo "║  ⚠️  MISSING AUDITS:$MISSING_AUDITS"
echo "║  Run individual audits first!"
fi
echo "╚══════════════════════════════════════════════════════╝"
echo ""
cat "$CTX"
```

---

## ABSOLUTE RULES

All rules from the single-repo CLAUDE.md apply. Additional rules:

### RULE: NO CROSS-REPO FILE MODIFICATIONS

Do not modify files in ANY repository. All repos should be filesystem-locked
(`chmod -R a-w`). All output goes to the product-level audit directory.

### RULE: READ ALL INDIVIDUAL AUDITS FIRST

Before starting any cross-repo analysis, read the `codebase_health.md` and
`findings.md` from EACH individual repo audit. This provides the baseline.
Do not re-run individual repo analysis — reference the existing findings.

### RULE: FOCUS ON INTEGRATION

The cross-repo analysis exists to find problems that live BETWEEN repos.
Do not duplicate findings already captured in individual audits. Every
finding in the cross-repo report must involve 2+ repositories.

---

## PROGRESS TRACKING

```bash
PROGRESS="$AUDIT_DIR/progress.sh"
# Same progress tracker structure as single-repo, with these phases:

PHASES=(
  "Phase 0:  Multi-repo bootstrap"
  "Phase 1:  Individual audit summary"
  "Phase 2:  API contract analysis"
  "Phase 3:  Auth flow tracing"
  "Phase 4:  Shared config & environment"
  "Phase 5:  Deployment coupling"
  "Phase 6:  Cross-repo dependencies"
  "Phase 7:  Cross-repo security"
  "Phase 8:  Unified team analysis"
  "Phase 9:  Produce unified report"
  "Phase 10: HTML reports (management + CTO)"
  "Phase 11: Comparison with previous (conditional)"
)
```

---

*CLAUDE.md · Multi-repo product audit · Read-only*
