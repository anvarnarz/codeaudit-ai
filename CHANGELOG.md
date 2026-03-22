# Changelog — CodeAudit AI

All notable changes to CodeAudit will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## 2026-03-22 — v1.0 CodeAudit MVP

### Added

**Phase 1: App Shell & Configuration**
- Local-first app architecture — runs at localhost, no cloud, no auth
- `npx codeaudit-ai` CLI launcher with auto-generated ENCRYPTION_KEY
- SQLite database at `~/.codeaudit-ai/codeaudit.db` (zero-config, no Docker needed)
- API key management with AES-256-GCM encryption, multiple keys per provider with labels
- API key validation via test API call on entry (Anthropic, OpenAI, Gemini)
- Multi-folder picker with path input and per-path validation
- Safety enforcement: `chmod -R a-w` + git push block with guaranteed unlock
- Non-git folder support (skip git-specific phases with user confirmation)
- First-time setup wizard (add API key → done)
- Audit type selection (full, security-only, team, code quality) with card UI
- Audit depth toggle (quick scan / deep audit) with time + cost details
- Model selector fetching available models dynamically from provider API
- Auto mode (cost-optimized model selection per phase)
- Live cost estimate updating as configuration changes
- Confirmation dialog summarizing audit before start
- Dark mode UI with Linear aesthetic, left sidebar navigation

**Phase 2: Audit Engine**
- LLM adapter for Anthropic, OpenAI, and Gemini via Vercel AI SDK 6
- AUTO model selection with 3 complexity tiers (simple/medium/complex)
- Audit orchestrator with cancel polling, phase checkpointing, and guaranteed folder cleanup
- Prompt builder with per-phase guide chunks (not full 93K guide per call)
- `<data_block trust="untrusted">` prompt injection defense
- Structured finding extraction via Zod schemas
- Phase 0 bootstrap: 14 detection commands + LLM context synthesis
- Phases 1-9: shell commands → LLM analysis → structured findings
- Phase 10: final report aggregation with scoring and grading
- Phase 11: HTML dashboard generation (management + technical)
- Audit type filtering (run only relevant phases per type)
- Quick scan depth mode (sampling, reduced grep output)
- SSE progress streaming polling SQLite every 500ms with state replay on reconnect
- Expandable per-phase detail view (status, findings count, duration, token cost)
- Cancel endpoint + resume from checkpoint support
- Budget warning when cost exceeds estimate by >20%
- All output to audit directory, never inside target folder

**Phase 3: Results & Cost**
- Findings dashboard with health score, letter grade (A-F), and severity breakdown chart (Recharts)
- Filterable/sortable findings list by severity (Critical, High, Medium, Low, Info)
- Finding cards with severity badge, file path, line number, evidence snippet, collapsible remediation
- Separate executive and technical report pages (iframe-embedded Phase 11 HTML)
- Cost summary banner (total tokens + cost) with per-phase breakdown table
- Budget overrun warning (yellow banner when >20% over estimate)
- Partial results support for cancelled/failed audits
- "View Results" transition from progress view on completion
- Zip download of all audit artifacts (HTML, markdown, JSON, all files)
- PDF generation via Puppeteer from HTML dashboards
- Raw HTML report serve for iframe embedding

**Phase 4: History & Comparison**
- Audit history page grouped by folder path with score/grade badges
- Per-audit row with date, type, depth, and health score
- Click any audit to view its full results dashboard
- "Compare latest two" button for folders with 2+ audits
- Delta comparison page with score delta banner (colored +/-)
- Side-by-side severity charts (previous vs latest)
- Three-section finding diff: new (red), resolved (green), persisted (gray)
- Set-based finding matching by title + file path

### Changed
- **Architecture pivot**: Switched from cloud webapp (GitHub OAuth, PostgreSQL, BullMQ) to local-first (no auth, SQLite, in-process execution)
- Stripped all GitHub OAuth, Auth.js, GitHub App webhook code from Phase 1 scaffold

### Fixed
- Argument order bug in settings page `createApiKey` call (label/key swap)
- Missing `actualCostMicrodollars` computation in `markPhaseCompleted`
- Import typo `findRunPhaseLlm` → `runPhaseLlm` in phase-00 runner
- Undefined `result.score` variable in phase-10 runner

---

*CodeAudit v1.0 — 4 phases, 10 plans, 22 tasks, 7,860 LOC TypeScript*
