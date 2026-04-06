# CodeAudit AI — Production-Ready Design Spec

**Date:** 2026-04-06
**Target:** Open-source npm package, community-driven
**Timeline:** 2-3 months, three phased releases
**Approach:** Phased releases (v0.5 → v0.8 → v1.0)

---

## Context

CodeAudit AI is a local-first, 13-phase codebase audit tool. Users run `npx codeaudit-ai`, point it at a local folder, and get a structured health report powered by LLMs.

Current state: working MVP with solid architecture (AES-256-GCM encryption, prompt injection defense, command execution sandbox, graceful degradation). But not shippable: CLI packaging broken, 2% test coverage, no CI/CD, stale infrastructure artifacts, unreliable cost tracking, no validation of finding accuracy.

Goal: full production-grade open-source tool on npm with local LLM support, plugin system, configurable profiles, telemetry, and 80%+ test coverage.

---

## v0.5 "It Works" (Weeks 1-3)

Foundation fixes. Ship as beta on npm.

### 1. Fix CLI Packaging

**Problem:** `bin` points to raw `.ts` file. `npx codeaudit-ai` fails for real users.

**Solution:**
- Add `tsup` to compile `packages/cli/src/index.ts` to `dist/index.js`
- Update `package.json` bin: `"./dist/index.js"` with `#!/usr/bin/env node` shebang
- Add `prepublishOnly` script that builds all packages in dependency order
- Test with `npm pack` + `npx` in a clean temp directory
- Publish as `codeaudit-ai` on npm

**Acceptance criteria:**
- `npx codeaudit-ai` starts the server and opens browser on a clean machine with Node 20+
- `npm pack --dry-run` produces a clean tarball with no dev artifacts

**ccc assignable:** Yes

### 2. CI/CD Pipeline

**Solution:**
- GitHub Actions workflow on push/PR: lint, typecheck, test, build
- Node matrix: 20, 22
- pnpm store cache for speed
- Add `pnpm lint` and `pnpm typecheck` root scripts
- README badge

**Acceptance criteria:**
- Green CI on main branch
- PRs blocked on CI failure

**ccc assignable:** Yes

### 3. Clean Dead Code

**Solution:**
- Remove `worker/` package (BullMQ/ioredis stub doing nothing)
- Remove `packages/repo-sandbox/` (35-line stub)
- Remove PostgreSQL/Redis references from `.env.example` and Docker Compose
- Update `pnpm-workspace.yaml` to drop removed packages
- Update README project structure to match reality

**Acceptance criteria:**
- `pnpm install` succeeds without worker/repo-sandbox
- `.env.example` only references SQLite and ENCRYPTION_KEY
- No references to Redis, PostgreSQL, or BullMQ in source

**ccc assignable:** Yes

### 4. Fix Cost Tracking

**Problem:** 75/25 input/output token split assumption can be off by 50%. Pricing hardcoded.

**Solution:**
- Extract actual `promptTokens` and `completionTokens` from AI SDK `usage` object (already returned by `generateText` and `generateObject`)
- Replace the 75/25 split in `progress-emitter.ts` with real token counts
- Move pricing to `packages/audit-engine/src/pricing.json` (updatable per release)
- Store per-phase cost in `audit_phases` table (add `costMicrodollars` column)

**Acceptance criteria:**
- Cost displayed in UI matches actual API usage within 5% margin
- Per-phase cost breakdown visible in results dashboard
- No hardcoded token split ratios in codebase

**ccc assignable:** Yes

### 5. Critical Path Tests (Target: 50%)

**Scope:**
- `exec-command-tool.ts`: allowlist enforcement, dangerous pattern blocking, path containment, symlink escape, timeout
- `tool-phase-runner.ts`: JSON repair, schema validation fallbacks, empty result handling
- `finding-extractor.ts`: valid/invalid/truncated JSON parsing
- `prompt-builder.ts`: data_block wrapping, injection boundary
- API routes: SSE streaming behavior, cancel endpoint
- Server actions: `startAudit` validation, `addApiKey` validation

**Acceptance criteria:**
- 50%+ line coverage on `packages/audit-engine/src/`
- All new tests pass in CI
- Zero skipped tests

**ccc assignable:** Yes

### 6. Fix Symlink Escape

**Problem:** Path containment in `exec-command-tool.ts` doesn't resolve symlinks. Symlink inside repo pointing to `/etc/passwd` passes checks.

**Solution:**
- Add `fs.realpath()` resolution before path containment check
- Return `(blocked: symlink escapes repository)` for resolved paths outside repo
- Add test with symlink fixture

**Acceptance criteria:**
- Symlink pointing outside repo is blocked
- Test proves it

**ccc assignable:** Yes

---

## v0.8 "It's Useful" (Weeks 4-7)

New capabilities. Ship as release candidate.

### 7. Local LLM Support (Ollama)

**Problem:** BYOK API keys are an adoption barrier. Free local option needed.

**Solution:**
- Add Ollama as 4th provider in `packages/llm-adapter/`
- Use `@ai-sdk/openai` pointed at Ollama's base URL (`http://localhost:11434/v1`). No new SDK dependency.
- Auto-detect on audit start: `GET http://localhost:11434/api/tags`. Offer as option if running, skip if not.
- Model resolution for Ollama AUTO mode:
  - Simple phases: `qwen3:8b` or `llama3.1:8b`
  - Medium phases: `qwen3:14b` or `codellama:34b`
  - Complex phases: `qwen3:32b` or `deepseek-coder-v2:latest`
- Cost tracking shows $0.00 for Ollama
- Provider entry in `api_keys` table: provider="ollama", no encryption (no key). Just connection URL.
- Setup wizard: "Local (Ollama)" option with link to Ollama install docs if not detected

**Limitations to document:** Local models produce lower quality findings. Tool-use support varies by model. Phase 10/11 (synthesis/reports) may degrade with smaller models.

**Acceptance criteria:**
- User with Ollama running can complete a full audit with $0 cost
- Setup wizard detects Ollama presence automatically
- Audit completes (possibly lower quality) with qwen3:8b

**ccc assignable:** Yes

### 8. Audit Profiles

**Problem:** Manual type+depth selection is friction. Named presets simplify the experience.

**Solution:**
- New `profiles.ts` in `packages/audit-engine/`:
  ```
  quick-security  -> phases [0,6], depth=quick, model=auto
  full-security   -> phases [0,1,6,7,10,11], depth=deep, model=auto
  code-quality    -> phases [0,1,2,3,4,9,10,11], depth=deep, model=auto
  team-health     -> phases [0,1,5,9,10,11], depth=quick, model=auto
  full-audit      -> all phases, depth=deep, model=auto
  ci-gate         -> phases [0,2,3,6], depth=quick, model=cheapest, exit-code=1 if any critical OR high findings
  ```
- Profile selection replaces type+depth dropdowns in the new audit form
- Advanced mode toggle for manual phase picking (power users)
- `ci-gate` profile: CLI-only, exits with code 1 on critical/high findings. For CI integration.
- Profiles stored as JSON config, extensible by plugins in v1.0

**Acceptance criteria:**
- User can select a profile from dropdown and start audit
- `ci-gate` profile exits with code 1 when critical findings exist
- Advanced mode allows manual phase selection

**ccc assignable:** Yes

### 9. Validation Framework

**Problem:** Finding accuracy not systematically tested. Can't ship what you can't verify.

**Solution:**
- Create `validation/` directory with known-state fixture repos:
  - `validation/fixtures/leaked-secrets/` — .env leaks, hardcoded API keys
  - `validation/fixtures/sql-injection/` — known injection vulnerabilities
  - `validation/fixtures/no-tests/` — zero test coverage project
  - `validation/fixtures/clean-repo/` — well-maintained repo (should score A)
- Each fixture has `expected-findings.json`: expected findings (severity, category, approximate count)
- Validation runner script:
  - Runs audit on each fixture 3 times (LLM output is non-deterministic)
  - Measures precision (no false positives) and recall (no false negatives)
  - Finding detected in >=2/3 runs = "reliable"; <1/3 = "unreliable"
  - Scoring accuracy: health score within +/- 10 of expected
- Output: validation report (per-phase precision/recall, unreliable findings flagged)
- Use results to identify weak phases for prompt improvement

**Acceptance criteria:**
- Validation runner produces a structured report
- `leaked-secrets` fixture: Phase 6 catches >=80% of planted secrets
- `clean-repo` fixture: health score >= 85
- Report identifies which phases need prompt improvement

**ccc assignable:** Partially. Framework and fixtures = ccc. Analyzing results and tuning prompts = cc.

### 10. Phase Prompt Improvements

**Problem:** Guide chunks are truncated summaries. LLMs miss domain-specific patterns.

**Solution:**
- Based on validation framework results, identify 3-5 weakest phases
- Per weak phase:
  - Expand guide chunk from ~500 bytes to ~2KB with specific patterns
  - Add 1-2 few-shot examples (command output -> expected finding JSON)
  - Add stack-specific hints (e.g., Phase 6 for Node.js: check eval(), prototype pollution)
- Keep total prompt under 8K tokens per phase
- A/B test: run validation fixtures before and after, measure improvement

**Acceptance criteria:**
- Validation precision improves by >=15% on targeted phases
- No phase prompt exceeds 8K tokens
- Before/after comparison documented

**ccc assignable:** No. Complex multi-file reasoning, prompt engineering, LLM behavior analysis. Stays on cc.

---

## v1.0 "It's Ready" (Weeks 8-12)

Full production grade. Public launch.

### 11. Plugin System

**Solution:**
- Plugin = directory in `~/.codeaudit-ai/plugins/<name>/`:
  ```
  plugin.json          # manifest: name, version, phase config, guide chunk
  commands.sh          # optional: custom commands before LLM analysis
  expected-findings.json  # optional: self-validation fixture
  ```
- `plugin.json` schema:
  ```json
  {
    "name": "hipaa-check",
    "version": "1.0.0",
    "displayName": "HIPAA Compliance Check",
    "phaseNumber": 100,
    "complexity": "complex",
    "guideChunk": "Check for PHI exposure, encryption at rest...",
    "commands": ["commands.sh"],
    "includedInProfiles": ["full-security", "full-audit"]
  }
  ```
- Phase numbers 100+ reserved for plugins (built-in: 0-11)
- Plugin discovery: scan plugins dir on startup, register with orchestrator
- Same `execCommand` sandbox: allowlist, pattern blocking, path containment. No escape.
- Plugin commands.sh: runs before LLM analysis, output as additional context. Same timeouts.
- Install: `codeaudit-ai plugin add <git-url>` clones to plugins dir. Or manual copy.
- UI: Settings page shows installed plugins with enable/disable toggles
- No plugin registry for v1.0. Git URLs and local directories only.

**Acceptance criteria:**
- User can install a plugin via CLI and see it in Settings
- Plugin phase runs in audit alongside built-in phases
- Plugin commands.sh respects the same sandbox as built-in commands
- Plugin can be enabled/disabled per audit

**ccc assignable:** Yes

### 12. Telemetry

**Solution:**
- First-run prompt: "Help improve CodeAudit AI? Anonymous usage data (phases, duration, error rates). No code, no file paths, no API keys ever sent."
- Three levels: `off` (default), `anonymous` (no device ID), `community` (stable ID)
- Events: audit started (profile, phases, provider), audit completed (duration, finding counts, score), phase failed (phase number, error category), plugin used (name)
- Local storage: `~/.codeaudit-ai/telemetry.jsonl`
- Batch send: weekly POST to PostHog/Plausible instance
- `codeaudit-ai telemetry off` disables permanently
- Telemetry status visible in Settings page

**Acceptance criteria:**
- Default is off. User must explicitly opt in.
- `telemetry.jsonl` contains only the specified event fields
- No code, file paths, API keys, or finding content in telemetry
- `codeaudit-ai telemetry off` works

**ccc assignable:** Yes

### 13. Auto-Update Check

**Solution:**
- On CLI startup: fetch `https://registry.npmjs.org/codeaudit-ai/latest`
- If newer version: print `Update available: 0.8.2 -> 1.0.0. Run: npm update -g codeaudit-ai`
- Cache check for 24 hours in `~/.codeaudit-ai/.update-check`
- No auto-install. Notify only.
- Suppress: `--no-update-check` flag or `CODEAUDIT_NO_UPDATE_CHECK=1`

**Acceptance criteria:**
- Update notice appears when outdated
- No notice when current
- Cache prevents repeated checks within 24h
- Suppressible via flag or env var

**ccc assignable:** Yes

### 14. Comprehensive Tests (Target: 80%+)

**Note:** Task 5 covers audit-engine unit tests (50% of that package). This task covers everything else: UI, API routes, CLI, integration tests, and fills remaining gaps to reach 80% project-wide.

**Solution:**
- Integration tests: full audit on small fixture repo (end-to-end with Ollama, no mock)
- React component tests: new audit form, results dashboard, progress view
- Snapshot tests: HTML report generation
- API route tests with mock DB
- CLI tests: spawn process, verify server starts, verify browser open
- CI integration: Ollama as Docker service container for integration tests

**Acceptance criteria:**
- 80%+ line coverage across all packages
- Integration test completes a full audit in CI
- All tests green, zero skipped

**ccc assignable:** Yes

### 15. Contributor Guide and Docs

**Solution:**
- `CONTRIBUTING.md`: dev setup, architecture, how to add a phase, how to write a plugin, PR checklist
- `docs/architecture.md`: data flow diagrams, package responsibilities
- `docs/plugins.md`: plugin authoring guide with examples
- `docs/profiles.md`: built-in profiles, custom profiles
- `docs/local-llm.md`: Ollama setup, model recommendations, quality trade-offs
- `docs/validation.md`: run validation suite, interpret results
- README overhaul: hero section, GIF/screenshot, quick start, feature list, comparison table vs eslint/sonarqube/codeclimate
- Create `VERSION` file synced with package.json

**Acceptance criteria:**
- New contributor can set up dev environment following CONTRIBUTING.md without asking questions
- Plugin authoring guide includes a working example
- README has screenshot/GIF of audit in progress

**ccc assignable:** Yes

### 16. Polish and Hardening

**Solution:**
- Structured logging: replace console.log/error with `consola` (lightweight, level-based, JSON output)
- SSE auth: tie audit streams to a session token in localStorage. Reject streams without valid token.
- Rate limiting: cap concurrent audits at 2 (prevent resource exhaustion)
- Graceful shutdown: handle SIGTERM in CLI, cancel running audit, unlock folder, exit clean
- React error boundaries: catch component crashes, show retry UI

**Acceptance criteria:**
- Logs are structured JSON with levels (debug/info/warn/error)
- SSE endpoint rejects requests without session token
- Third concurrent audit is queued, not rejected
- SIGTERM during audit unlocks folder within 5 seconds
- React crash shows error boundary, not white screen

**ccc assignable:** Yes

---

## ccc/cc Task Routing Summary

| # | Task | ccc | cc | Reason |
|---|------|-----|-----|--------|
| 1 | CLI Packaging | Yes | - | Build config, single file |
| 2 | CI/CD Pipeline | Yes | - | YAML boilerplate |
| 3 | Clean Dead Code | Yes | - | Deletions, doc updates |
| 4 | Fix Cost Tracking | Yes | - | Single-file refactor |
| 5 | Critical Path Tests | Yes | - | Test writing |
| 6 | Symlink Escape Fix | Yes | - | Small fix + test |
| 7 | Ollama Support | Yes | - | Thin provider adapter |
| 8 | Audit Profiles | Yes | - | Config-driven routing |
| 9 | Validation Framework | Split | Split | Framework=ccc, analysis=cc |
| 10 | Prompt Improvements | - | Yes | Multi-file reasoning, prompt engineering |
| 11 | Plugin System | Yes | - | Config loading, directory scanning |
| 12 | Telemetry | Yes | - | JSONL, HTTP POST, config |
| 13 | Auto-Update Check | Yes | - | HTTP fetch, file cache |
| 14 | Comprehensive Tests | Yes | - | Test writing |
| 15 | Docs and Contributor Guide | Yes | - | File creation |
| 16 | Polish and Hardening | Yes | - | Small isolated changes |

**Result:** 14.5 of 16 tasks are ccc-assignable. Only prompt improvements (task 10) and validation analysis (part of task 9) require cc.

---

## Out of Scope for v1.0

- Hosted/cloud version
- User authentication
- Plugin registry / marketplace
- Paid tiers / billing
- Real-time collaboration
- Automatic fix suggestions (just findings, not fixes)
- VS Code / JetBrains extensions
