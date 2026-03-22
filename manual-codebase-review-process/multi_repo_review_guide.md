# Multi-Repo Codebase Review Guide
**Scope:** Cross-repository product audit — integration, coupling, shared concerns  
**Prerequisite:** Individual repo audits completed using `codebase_review_guide.md`  
**Constraint:** Read-only — no modifications to any repository

---

## When to use this guide

Use this when a product spans multiple repositories (e.g., backend + frontend +
landing, or a microservices architecture). Run this AFTER completing individual
audits on each repo.

**What individual audits find:** per-repo code quality, security, tests, docs, team.

**What this guide finds:** problems that live BETWEEN repos — API mismatches,
auth flow gaps, config drift, deployment coupling, version conflicts, and
integration failures that no single-repo audit can detect.

---

## Workflow overview

```
Step 1: Run individual audit on each repo (existing guide)
         ├── ~/audit-backend/codebase_health.md
         ├── ~/audit-frontend/codebase_health.md
         └── ~/audit-landing/codebase_health.md

Step 2: Run this multi-repo guide (THIS FILE)
         └── ~/audit-{product}/
              ├── product_context.md
              ├── product_health.md
              ├── report_management_{date}.html
              ├── report_technical_{date}.html
              └── history/{date}/
```

---

## Setup

### Step 1: Complete individual repo audits

Each repo must have a completed audit with `codebase_health.md` and `findings.md`.
If any repo is missing its audit, run the standard guide on it first.

### Step 2: Create a product-level audit directory

```bash
# Choose a product name
PRODUCT="myproduct"

mkdir -p ~/audit-${PRODUCT}
cp /path/to/CLAUDE_MULTI_REPO.md ~/audit-${PRODUCT}/CLAUDE.md
cp /path/to/multi_repo_review_guide.md ~/audit-${PRODUCT}/multi_repo_review_guide.md
```

### Step 3: Start Claude Code

```bash
cd ~/audit-${PRODUCT}
claude --dangerously-skip-permissions
```

**All repos must be filesystem-locked** (`chmod -R a-w`) from their individual audits.

### Step 4: Give it the multi-repo prompt

```
Read multi_repo_review_guide.md. This is a cross-repo product audit.

The repos are:
- Backend: ~/Projects/backend (audit at ~/audit-backend/)
- Frontend: ~/Projects/frontend (audit at ~/audit-frontend/)
- Landing: ~/Projects/landing (audit at ~/audit-landing/)

All repos are read-only. All individual audits are complete.

Run Phase 0 bootstrap first, then execute all phases in order.
Write findings to findings.md. Produce the unified report and HTML dashboards.

Start now.
```

Adjust repo paths and names to match your setup.

---

## Phase 0 — Multi-repo bootstrap (5 min)

Run the bootstrap script from CLAUDE.md. It will:

1. Discover all repos and verify individual audits exist
2. Extract connection points (API URLs, docker-compose links, shared configs)
3. Write `product_context.md` with the full picture
4. Warn if any individual audit is missing

**If individual audits are missing, STOP and run them first.**

---

## Phase 1 — Individual audit summary (15 min)

```bash
mark_running 1
```

**Goal:** Read all individual audit reports and create a unified baseline.

```bash
# Read each repo's health report
for audit_dir in ~/audit-backend ~/audit-frontend ~/audit-landing; do
  if [ -f "$audit_dir/codebase_health.md" ]; then
    echo "=== $(basename $audit_dir) ==="
    cat "$audit_dir/codebase_health.md"
    echo ""
  fi
done
```

**Produce a summary table:**

```markdown
## Individual Repo Scores

| Dimension | Backend | Frontend | Landing | Product Avg |
|---|---|---|---|---|
| Test coverage | X/10 | X/10 | X/10 | X.X |
| Dependency health | X/10 | X/10 | X/10 | X.X |
| [all 20 dimensions] | | | | |
| **Overall** | X.X/10 | X.X/10 | X.X/10 | **X.X** |

## Combined Stats
- Total source files: [sum across repos]
- Total lines of code: [sum]
- Total contributors: [deduplicated across repos]
- Total critical findings: [sum]
- Total high findings: [sum]
```

```bash
mark_done 1
```

**Run `/compact`.**

---

## Phase 2 — API contract analysis (30 min)

```bash
mark_running 2
```

**Goal:** Find mismatches between what the backend exposes and what the
frontend/landing consume. This is the #1 source of cross-repo bugs.

### 2a — Extract backend API surface

```bash
# Find all route/endpoint definitions in the backend
cd ~/Projects/backend  # adjust path

# Express/NestJS/Fastify routes
grep -rn "app\.\(get\|post\|put\|patch\|delete\)\|@Get\|@Post\|@Put\|@Patch\|@Delete\|router\.\(get\|post\|put\|delete\)" \
  . --include="*.ts" --include="*.js" | \
  grep -v node_modules | grep -v test | grep -v spec | head -50

# Django/Flask/FastAPI routes
grep -rn "path(\|url(\|@app\.\(get\|post\|put\|delete\)\|@router\.\|@api_view" \
  . --include="*.py" | \
  grep -v venv | grep -v test | head -50

# Response shapes — what does the backend return?
grep -rn "res\.json\|return.*Response\|return.*JsonResponse\|@ApiResponse\|@ApiProperty" \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v test | head -30

# OpenAPI/Swagger spec (if exists)
find . -name "swagger*" -o -name "openapi*" -o -name "*.swagger.*" | \
  grep -v node_modules | head -5
```

### 2b — Extract frontend API consumption

```bash
cd ~/Projects/frontend  # adjust path

# API call sites — what does the frontend call?
grep -rn "fetch(\|axios\.\|useQuery\|useMutation\|\$http\.\|api\.\|apiClient\." \
  . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.vue" | \
  grep -v node_modules | grep -v test | head -50

# API route constants/enums
grep -rn "API_URL\|endpoint\|/api/\|BASE_URL" \
  . --include="*.ts" --include="*.js" --include="*.tsx" | \
  grep -v node_modules | grep -v test | head -30

# Expected response types/interfaces
grep -rn "interface.*Response\|type.*Response\|interface.*DTO\|type.*ApiResult" \
  . --include="*.ts" --include="*.tsx" | \
  grep -v node_modules | grep -v test | head -30
```

### 2c — Extract landing page API usage

```bash
cd ~/Projects/landing  # adjust path

# Same pattern — what API calls does the landing page make?
grep -rn "fetch(\|axios\.\|api\.\|/api/" \
  . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.vue" | \
  grep -v node_modules | grep -v test | head -30
```

### 2d — Compare and find mismatches

Claude Code should now compare what it found and identify:

- **Endpoints called by frontend but not defined in backend** (will fail at runtime)
- **Endpoints defined in backend but never called** (dead code or missing integration)
- **Response shape mismatches** — backend returns field X, frontend expects field Y
- **HTTP method mismatches** — frontend POSTs to an endpoint the backend only handles as GET
- **URL path inconsistencies** — `/api/v1/users` vs `/api/users` vs `/users`
- **Missing error handling** — frontend calls endpoint X but doesn't handle its error responses

**Log each mismatch to findings.md with both file paths (backend + frontend).**

```bash
mark_done 2
```

**Run `/compact`.**

---

## Phase 3 — Auth flow tracing (30 min)

```bash
mark_running 3
```

**Goal:** Trace authentication from login through to every protected endpoint,
across all repos. Auth bugs at integration boundaries are the most exploitable.

```bash
# ── Backend: how are tokens created? ──
cd ~/Projects/backend

grep -rn "jwt\|jsonwebtoken\|jose\|JWT_SECRET\|sign(\|createToken\|generateToken\|login\|authenticate" \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v test | head -20

# How are tokens verified?
grep -rn "verify(\|decode(\|JwtGuard\|JwtStrategy\|@UseGuards\|authenticate.*middleware\|verify_token\|get_current_user" \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v test | head -20

# What endpoints are unprotected?
grep -rn "@Public\|@AllowAnonymous\|@SkipAuth\|IsPublic\|permit_all\|allow_unauthenticated" \
  . --include="*.ts" --include="*.js" --include="*.py" | \
  grep -v node_modules | grep -v test | head -15


# ── Frontend: how are tokens stored and sent? ──
cd ~/Projects/frontend

grep -rn "localStorage\|sessionStorage\|cookie\|Authorization\|Bearer\|token\|setToken\|getToken" \
  . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | \
  grep -v node_modules | grep -v test | head -20

# Auth interceptors — how does the frontend attach tokens to requests?
grep -rn "interceptor\|headers\.\|Authorization\|withCredentials\|credentials:" \
  . --include="*.ts" --include="*.tsx" --include="*.js" | \
  grep -v node_modules | grep -v test | head -15

# Token refresh logic
grep -rn "refresh\|refreshToken\|token.*expire\|401\|unauthorized" \
  . --include="*.ts" --include="*.tsx" --include="*.js" | \
  grep -v node_modules | grep -v test | head -15


# ── Landing: does it share auth with the main app? ──
cd ~/Projects/landing

grep -rn "token\|auth\|login\|session\|cookie\|Bearer\|localStorage" \
  . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | \
  grep -v node_modules | grep -v test | head -15
```

**What to look for:**

- Token stored in localStorage (XSS-vulnerable) vs httpOnly cookie (secure)
- JWT algorithm mismatch between creation and verification
- Missing token refresh — what happens when tokens expire?
- Frontend sends token, but some backend routes skip verification
- Landing page shares cookies/tokens with main app (session fixation risk)
- CORS allows credentials from landing domain to backend
- Different auth mechanisms across repos (JWT in one, sessions in another)

```bash
mark_done 3
```

**Run `/compact`.**

---

## Phase 4 — Shared configuration & environment (20 min)

```bash
mark_running 4
```

**Goal:** Find configuration drift between repos — different values for
things that should match, and missing variables that will crash at runtime.

```bash
# Extract ALL env var names from each repo
for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
  REPO_NAME=$(basename "$repo")
  echo "=== $REPO_NAME environment variables ==="

  # From .env.example / .env.template
  cat "$repo"/.env.example "$repo"/.env.sample "$repo"/.env.template 2>/dev/null | \
    grep -oE '^[A-Z_][A-Z0-9_]*' | sort -u

  # From source code
  grep -rhE 'process\.env\.[A-Z_]+|os\.environ\[|os\.getenv\(' \
    "$repo" --include="*.ts" --include="*.js" --include="*.py" 2>/dev/null | \
    grep -v node_modules | \
    grep -oE '[A-Z_][A-Z0-9_]{2,}' | sort -u

  echo ""
done

# ── Compare: shared env vars that might drift ──
echo "=== Common env vars across repos ==="
# Find vars that appear in 2+ repos
for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
  grep -rhE 'process\.env\.[A-Z_]+|os\.environ|os\.getenv' \
    "$repo" --include="*.ts" --include="*.js" --include="*.py" 2>/dev/null | \
    grep -v node_modules | grep -oE '[A-Z_][A-Z0-9_]{2,}'
done | sort | uniq -c | sort -rn | awk '$1 > 1'

# ── Check for version drift in shared dependencies ──
echo ""
echo "=== Shared dependency versions ==="
for dep in react next typescript axios lodash tailwindcss; do
  echo "--- $dep ---"
  for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
    REPO_NAME=$(basename "$repo")
    ver=$(cat "$repo/package.json" 2>/dev/null | grep "\"$dep\"" | head -1 | awk -F'"' '{print $4}')
    [ -n "$ver" ] && echo "  $REPO_NAME: $ver"
  done
done

# ── Docker/docker-compose: how are services wired? ──
echo ""
echo "=== Docker service wiring ==="
for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
  if [ -f "$repo/docker-compose.yml" ] || [ -f "$repo/docker-compose.yaml" ]; then
    echo "--- $(basename $repo) ---"
    cat "$repo"/docker-compose*.yml 2>/dev/null | head -40
  fi
done

# Is there a root-level docker-compose that wires everything?
ls ~/Projects/docker-compose*.yml ~/Projects/*/docker-compose*.yml 2>/dev/null
```

**What to look for:**

- API URL in frontend `.env` doesn't match backend's actual host/port
- Database credentials differ between repos that share a database
- JWT_SECRET differs between backend and any service that verifies tokens
- Same dependency at different major versions (React 17 vs 18)
- Missing .env.example entries — variable used in code but not documented
- Docker services can't find each other (network/hostname mismatch)

```bash
mark_done 4
```

**Run `/compact`.**

---

## Phase 5 — Deployment coupling (20 min)

```bash
mark_running 5
```

**Goal:** Understand if/how repos must be deployed in a specific order,
and what breaks if one deploys without the other.

```bash
# ── CI/CD pipelines ──
for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
  REPO_NAME=$(basename "$repo")
  echo "=== $REPO_NAME CI/CD ==="
  cat "$repo"/.github/workflows/*.yml 2>/dev/null | head -60
  cat "$repo"/.gitlab-ci.yml 2>/dev/null | head -60
  echo ""
done

# ── Database migrations: who owns the schema? ──
for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
  REPO_NAME=$(basename "$repo")
  MIGRATIONS=$(find "$repo" -type d -name "migrations" -o -name "migrate" 2>/dev/null | \
    grep -v node_modules | head -3)
  if [ -n "$MIGRATIONS" ]; then
    echo "$REPO_NAME has migrations: $MIGRATIONS"
    ls -1 $MIGRATIONS/*.* 2>/dev/null | tail -5
  fi
done

# ── API versioning: is there a version contract? ──
for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
  grep -rn "/api/v[0-9]\|/v[0-9]/\|API_VERSION\|apiVersion" \
    "$repo" --include="*.ts" --include="*.js" --include="*.py" \
    --include="*.yaml" --include="*.yml" 2>/dev/null | \
    grep -v node_modules | head -10
done

# ── Feature flags / shared state ──
for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
  grep -rn "featureFlag\|feature_flag\|FEATURE_\|isEnabled\|launchdarkly\|unleash\|split\.io" \
    "$repo" --include="*.ts" --include="*.js" --include="*.py" 2>/dev/null | \
    grep -v node_modules | grep -v test | head -10
done
```

**What to look for:**

- Backend migration runs → frontend assumes new schema → crash if frontend deploys first
- No API versioning → any backend change can break frontend
- CI pipelines are independent → no coordination on deploy order
- Feature flags exist in one repo but not the other → inconsistent behaviour
- Shared database with no migration ownership → schema conflicts

```bash
mark_done 5
```

**Run `/compact`.**

---

## Phase 6 — Cross-repo dependencies (15 min)

```bash
mark_running 6
```

**Goal:** Find shared code, packages, or types that should be in sync.

```bash
# ── Shared types / interfaces / DTOs ──
# Are the same data shapes defined in multiple repos?
for shape in "User\|Customer\|Order\|Payment\|Transaction\|Product\|Invoice"; do
  echo "=== $shape ==="
  for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
    count=$(grep -rn "interface $shape\|type $shape\|class $shape\|model $shape" \
      "$repo" --include="*.ts" --include="*.py" --include="*.java" 2>/dev/null | \
      grep -v node_modules | grep -v test | wc -l)
    [ "$count" -gt 0 ] && echo "  $(basename $repo): $count definitions"
  done
done

# ── Shared internal packages ──
for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
  echo "=== $(basename $repo) internal deps ==="
  cat "$repo/package.json" 2>/dev/null | grep -E '"@|"file:|"link:|"workspace:' | head -10
done

# ── Duplicated utility code ──
echo "=== Potential duplicates ==="
for pattern in "formatDate\|formatCurrency\|parseAmount\|slugify\|sanitize\|validate"; do
  for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
    matches=$(grep -rn "$pattern" "$repo" --include="*.ts" --include="*.js" 2>/dev/null | \
      grep -v node_modules | grep -v test | wc -l)
    [ "$matches" -gt 0 ] && echo "  $(basename $repo): $pattern ($matches)"
  done
done
```

**What to look for:**

- Same type/interface defined in 2+ repos → will diverge over time
- No shared package → copy-paste duplication across repos
- Validation rules differ between frontend and backend (e.g., password length)
- Currency/date formatting inconsistent across repos

```bash
mark_done 6
```

**Run `/compact`.**

---

## Phase 7 — Cross-repo security (30 min)

```bash
mark_running 7
```

**Goal:** Security issues that emerge from how repos interact.

```bash
# ── CORS: does backend allow frontend and landing origins? ──
cd ~/Projects/backend
grep -rn "cors\|Access-Control\|allowedOrigins\|CORS_ORIGIN\|ALLOWED_HOSTS" \
  . --include="*.ts" --include="*.js" --include="*.py" --include="*.yaml" --include="*.env*" | \
  grep -v node_modules | grep -v test | head -15

# ── CSP: does frontend restrict what scripts/origins can load? ──
cd ~/Projects/frontend
grep -rn "Content-Security-Policy\|CSP\|helmet\|meta.*http-equiv" \
  . --include="*.ts" --include="*.js" --include="*.tsx" --include="*.html" | \
  grep -v node_modules | head -10

# ── Cookie domain/path scope ──
for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
  echo "=== $(basename $repo) cookie config ==="
  grep -rn "cookie\|domain:\|path:\|sameSite\|httpOnly\|secure" \
    "$repo" --include="*.ts" --include="*.js" --include="*.py" 2>/dev/null | \
    grep -v node_modules | grep -v test | head -10
done

# ── Shared secrets between repos ──
echo ""
echo "=== Shared secret names ==="
for var in JWT_SECRET DATABASE_URL REDIS_URL API_KEY SECRET_KEY STRIPE_KEY ENCRYPTION_KEY; do
  repos_with_var=""
  for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
    if grep -rq "$var" "$repo" --include="*.ts" --include="*.js" --include="*.py" \
      --include="*.env*" --include="*.yaml" 2>/dev/null; then
      repos_with_var="$repos_with_var $(basename $repo)"
    fi
  done
  [ -n "$repos_with_var" ] && echo "$var →$repos_with_var"
done

# ── Rate limiting: is it per-service or unified? ──
for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
  echo "=== $(basename $repo) rate limiting ==="
  grep -rn "rate.limit\|rateLimit\|throttle\|express-rate-limit" \
    "$repo" --include="*.ts" --include="*.js" --include="*.py" --include="package.json" 2>/dev/null | \
    grep -v node_modules | head -5
done
```

**What to look for:**

- CORS wildcard (`*`) on backend → any site can call your API
- CORS allows landing domain but landing handles user sessions → session leak risk
- JWT_SECRET in frontend code (should NEVER be there — only backend)
- Cookie domain too broad (`.example.com` lets landing read main app cookies)
- No CSP → XSS in landing page can steal tokens from main app
- Rate limiting only on backend → landing page endpoints unprotected

```bash
mark_done 7
```

**Run `/compact`.**

---

## Phase 8 — Unified team analysis (15 min)

```bash
mark_running 8
```

**Goal:** Understand team structure across the full product, not per-repo.

```bash
# ── Deduplicated contributor list ──
echo "=== All contributors across product ==="
for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
  cd "$repo"
  git shortlog -sn --since="12 months ago" 2>/dev/null
done | awk '{name=""; for(i=2;i<=NF;i++) name=name" "$i; commits[$0]+=$1; names[name]+=$1} END {for(n in names) printf "%6d %s\n", names[n], n}' | sort -rn

# ── Who works across multiple repos? ──
echo ""
echo "=== Cross-repo contributors ==="
for author in $(for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
  cd "$repo" && git log --since="12 months ago" --format="%aN" 2>/dev/null
done | sort -u); do
  repos=""
  for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
    count=$(cd "$repo" && git log --since="12 months ago" --author="$author" --oneline 2>/dev/null | wc -l)
    [ "$count" -gt 0 ] && repos="$repos $(basename $repo):${count}"
  done
  echo "$author →$repos"
done

# ── Bus factor per repo ──
echo ""
echo "=== Bus factor ==="
for repo in ~/Projects/backend ~/Projects/frontend ~/Projects/landing; do
  REPO_NAME=$(basename "$repo")
  cd "$repo"
  active=$(git shortlog -sn --since="12 months ago" 2>/dev/null | wc -l)
  top_share=$(git shortlog -sn --since="12 months ago" 2>/dev/null | head -1 | awk '{print $1}')
  total=$(git log --since="12 months ago" --oneline 2>/dev/null | wc -l)
  if [ "$total" -gt 0 ]; then
    top_pct=$(( top_share * 100 / total ))
    echo "$REPO_NAME: $active contributors, top contributor = ${top_pct}% of commits"
  fi
done
```

**What to look for:**

- One person owns backend, another owns frontend, nobody understands both → integration risk
- Someone works across all repos → key person risk, but also the integration knowledge holder
- One repo has 5 contributors, another has 1 → unbalanced team allocation
- No one works on landing page → it's probably stale and insecure

```bash
mark_done 8
```

**Run `/compact`.**

---

## Phase 9 — Unified product health report (20 min)

```bash
mark_running 9
```

Write the unified report to `~/audit-{product}/product_health.md`:

```markdown
# Product Health Report — Multi-Repo Audit
**Date:** [YYYY-MM-DD]
**Audit ID:** [YYYY-MM-DD]
**Product:** [PRODUCT_NAME]
**Repositories:** [list repos with paths]
**Commit hashes:** [HEAD of each repo]

## Executive Summary
[3–5 sentences: overall product health, biggest cross-repo risk,
 most urgent integration fix needed]

## Individual Repo Scores

| Dimension | [Repo1] | [Repo2] | [Repo3] | Product Avg |
|---|---|---|---|---|
| [all 20 dimensions] | | | | |
| **Overall** | | | | |

## Cross-Repo Findings

### API Contract Issues
[From Phase 2 — mismatched endpoints, response shapes, missing error handling]

### Authentication Flow Gaps
[From Phase 3 — token handling across services, session security]

### Configuration Drift
[From Phase 4 — mismatched env vars, version conflicts, missing configs]

### Deployment Risks
[From Phase 5 — ordering dependencies, migration ownership, missing coordination]

### Shared Code Issues
[From Phase 6 — duplicated types, diverging validation, no shared package]

### Cross-Repo Security
[From Phase 7 — CORS, cookie scope, secret exposure, missing CSP]

## Unified Team Analysis
[From Phase 8 — cross-repo contributors, bus factor, knowledge silos]

## Product-Level Risk Matrix

| Risk | Severity | Repos Affected | Business Impact |
|---|---|---|---|
| [issue] | Critical/High | backend + frontend | [impact] |

## Remediation Roadmap
[Unified across all repos — what to fix first, considering dependencies]

### Phase 1 — Emergency (Week 1)
[Critical cross-repo security issues]

### Phase 2 — Integration (Weeks 2-4)
[API contracts, auth flow, config alignment]

### Phase 3 — Foundation (Months 1-2)
[Shared packages, deployment coordination, monitoring]

### Phase 4 — Scale (Months 2-4)
[Per-repo improvements from individual audits]
```

```bash
# Archive
TIMESTAMP=$(date +%Y-%m-%d)
mkdir -p ~/audit-{product}/history/${TIMESTAMP}
cp ~/audit-{product}/product_health.md \
   ~/audit-{product}/product_health_${TIMESTAMP}.md
cp ~/audit-{product}/product_health.md \
   ~/audit-{product}/findings.md \
   ~/audit-{product}/history/${TIMESTAMP}/

mark_done 9
```

**Run `/compact`.**

---

## Phase 10 — HTML reports (30–45 min)

```bash
mark_running 10
```

### 10a — Management report

```
Create a self-contained HTML report at
~/audit-{product}/report_management_${TIMESTAMP}.html
for UPPER MANAGEMENT (non-technical audience).

Same technical requirements as single-repo management report
(no dependencies, CSS-only charts, dark/light toggle, responsive).

ADDITIONAL SECTIONS for multi-repo:

1. Product Dashboard
   - One health gauge per repo + one overall product gauge
   - Traffic light grid showing each repo's status per dimension

2. Integration Risk Map
   - Visual showing repos as boxes with connection lines between them
   - Lines colored by risk: green (healthy), yellow (concerns), red (broken)
   - CSS-only — use flexbox/grid with colored borders

3. Cross-Repo Findings
   - Cards showing issues that span 2+ repos
   - Plain language — "The payment page can't reach the billing service"
     not "API endpoint mismatch on /api/v1/payments"

4. Team Across the Product
   - Which teams own which repos
   - Who bridges multiple repos (key person risk)

5. Unified Remediation Roadmap
   - Timeline showing fixes across all repos
   - Highlight dependencies: "Fix X in backend BEFORE deploying Y in frontend"
```

### 10b — Technical report

```
Create a self-contained HTML report at
~/audit-{product}/report_technical_${TIMESTAMP}.html
for the CTO / engineering team.

Same technical requirements as single-repo technical report
(sidebar nav, dark theme, collapsible sections, file paths in monospace).

ADDITIONAL SECTIONS for multi-repo:

1. Architecture Overview
   - Repo-to-repo dependency diagram (CSS grid)
   - API surface summary per repo

2. API Contract Diff
   - Table: Endpoint | Backend Status | Frontend Usage | Match?
   - Color-coded: green=match, yellow=partial, red=mismatch

3. Auth Flow Diagram
   - Step-by-step token lifecycle across repos
   - Highlight gaps/risks at each handoff

4. Config Matrix
   - Table: Env Var | Backend | Frontend | Landing | Match?
   - Highlight drift and missing vars

5. Deployment Dependency Graph
   - Which repo must deploy first
   - Migration ownership
   - Rollback implications

6. Cross-Repo Security Checklist
   - Two-column: passing/failing, focused on integration security
```

```bash
TIMESTAMP=$(date +%Y-%m-%d)
# Create convenience copies
for f in report_management report_technical; do
  cp ~/audit-{product}/${f}_${TIMESTAMP}.html ~/audit-{product}/${f}.html 2>/dev/null
  cp ~/audit-{product}/${f}_${TIMESTAMP}.html ~/audit-{product}/history/${TIMESTAMP}/ 2>/dev/null
done

mark_done 10
```

---

## Phase 11 — Comparison with previous audit (conditional, 30 min)

Same logic as single-repo Phase 12 — check `history/` for previous
product-level audits. If found, generate comparison reports (markdown +
management HTML + CTO HTML) showing what improved, degraded, and persisted
across the full product.

```bash
PREV=$(ls -d ~/audit-{product}/history/*/ 2>/dev/null | grep -v "$TIMESTAMP" | sort -r | head -1)
if [ -z "$PREV" ]; then
  echo "No previous product audit — skipping comparison"
  mark_skipped 11
else
  mark_running 11
  # [same comparison logic as single-repo Phase 12]
  mark_done 11
fi
show_progress
```

---

## Phase priority if budget runs low

1. **Phase 2 (API contracts)** — highest integration risk
2. **Phase 3 (auth flow)** — most exploitable cross-repo vulnerability
3. **Phase 7 (cross-repo security)** — CORS, cookies, secrets
4. Phase 4 (config drift) — fast, catches deployment-time crashes
5. Phase 1 (summary) — needed for report
6. Phase 5 (deployment coupling) — important for operational safety
7. Phase 8 (unified team) — informational
8. Phase 6 (shared deps) — lower urgency
9. Phase 10 (HTML reports) — budget permitting
10. Phase 11 (comparison) — only if previous audit exists

---

*Multi-repo review guide · Cross-repository product audit · Read-only*
