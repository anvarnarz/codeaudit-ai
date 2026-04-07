# Changelog — CodeAudit AI

All notable changes to CodeAudit will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.6.0] — 2026-04-07 — OpenAI-Compatible Provider Support

### Added
- **OpenAI-compatible provider** — connect any OpenAI-compatible endpoint (Ollama, LM Studio, vLLM, llama.cpp, etc.) with custom base URL
- Model discovery for custom endpoints via `/v1/models` API
- API key management UI supports base URL field for openai-compatible provider
- Cost estimation defaults for openai-compatible provider (zero-cost for local models)
- Pricing entry for openai-compatible in `pricing.json`

### Changed
- Provider type extended to `"anthropic" | "openai" | "gemini" | "openai-compatible"` across all packages
- AUTO mode disabled for openai-compatible provider (requires explicit model selection)
- API key validation skipped for openai-compatible (custom auth schemes vary)

### Fixed
- `phase-10.ts`: `result` variable used outside `try` block scope — hoisted token counters
- `phase-11.ts`: `markPhaseCompleted` called with 5 args instead of required 6
- `tool-phase-runner.ts`: `inputTokensTotal`/`outputTokensTotal` referenced before declaration
- `progress-emitter.ts`: pricing.json type cast failed due to metadata fields (`_comment`, `_updated`)
- `schema.ts`: Drizzle `.default(null)` not valid for text columns

---

## [0.5.0] — 2026-04-XX — Production Foundation

### Added
- CLI packaging with tsup — `npx codeaudit-ai` now works on clean machines
- GitHub Actions CI pipeline (lint, typecheck, test, build) on Node 20/22
- Symlink escape detection in command execution sandbox
- Accurate cost tracking using real token counts from AI SDK (replaces 75/25 estimate)
- Pricing config file (`pricing.json`) for per-release price updates
- Test suite for exec-command-tool (allowlist, patterns, path containment, symlinks)
- Test suite for tool-phase-runner (JSON repair, schema validation, finding rescue)
- Test suite for prompt-builder (injection boundary verification)
- Test suite for finding-extractor (Zod schema validation)
- Test suite for cost calculation (per-provider accuracy)
- VERSION file for release tracking

### Removed
- Dead `worker/` package (BullMQ stub — not needed for v1)
- Dead `packages/repo-sandbox/` (placeholder — not needed for v1)
- Docker Compose for PostgreSQL/Redis (app uses SQLite only)
- Stale .env.example references to DATABASE_URL, REDIS_URL, AUTH_SECRET, GitHub OAuth

### Fixed
- CLI bin path pointing to nonexistent `./src/index.ts` (now compiled to `./dist/index.js`)
- Cost tracking off by up to 50% due to hardcoded 75/25 input/output token split
- Symlink inside audited repo could read files outside repository boundary

---

## 2026-03-22 — Complete Design Overhaul (Prototype-Faithful)

### Changed

- **All 8 page components** rewritten to use inline `style={{...}}` with CSS custom properties (`var(--accent)`, `var(--surface)`, etc.), matching the JSX prototype (`docs/codeaudit-ai.jsx`) exactly
- **Setup Wizard**: Welcome screen with 2x2 feature grid, floating theme toggle, provider SelectCards with accent glow, mono font API key input
- **Dashboard**: Quick action cards with hover lift/glow, recent audits table with folder icon, monospace folder names, accent/depth badges, HealthScore rings, re-audit edit button
- **New Audit Form**: Inline SelectCards for audit type (2x2 grid) and depth (1x2 grid) with accent glow when selected, section labels in uppercase muted style
- **Progress View**: Gradient progress bar with `progressPulse` animation, phase list with colored status circles (green check, spinner, red X, muted dot), cancel button with destructive styling, completion banner with green accent
- **Results View**: Full page layout with header badges, side-by-side Health Score and Severity cards, cost summary, download buttons, severity filter pills, finding cards with severity left borders
- **History**: Folder-grouped audit rows with `div role="checkbox"` checkboxes, bulk selection bar, delete confirmation modal with destructive styling, compare button
- **Compare Page**: Delta banner with arrow icon and success/destructive coloring, side-by-side HealthScore rings, resolved (green strikethrough) / new (red) / persisted (muted) finding sections
- **API Keys**: Flat key list with provider initials, inline edit/delete, add key form with provider buttons, delete confirmation modal
- **Page wrappers** simplified -- removed duplicate headers from results, progress, and settings page wrappers since client components now include their own prototype-faithful headers

---

## 2026-03-22 — Restyle Progress & Results Pages

### Changed

- **Progress page header**: Monospace folder name with audit type/depth badges (accent-styled)
- **Progress bar**: Gradient fill (`accent` to `amber-500`), `progressPulse` animation while running, turns green on completion
- **Stats row**: Monospace font for token count and cost display
- **Phase list**: Grid layout with colored status icons in rounded circles (green check for completed, blue spinner for running, muted circle for pending, red X for failed), findings count, duration, and cost columns
- **Cancel button**: Destructive variant with red bg/border
- **Completion banner**: Green-tinted surface with check icon and "View Results" primary button with chevron
- **Results page header**: Monospace folder name with type/depth badges
- **Health Score + Severity**: Two side-by-side cards with `HealthScore` ring (lg size) and severity breakdown chart
- **Cost summary**: Surface bg card with rounded-[14px], large monospace total cost, expandable per-phase breakdown table with monospace numbers, yellow budget warning with icon
- **Action buttons**: "Executive Report", "Technical Report", "Download All" as outline buttons with icons
- **Filter bar**: Severity pills with severity-colored bg/border when active, count badges
- **Findings list**: fadeIn + stagger animations on each finding card
- **Finding card**: Surface bg with rounded-[14px], 3px left border in severity color, category tag in elevated bg, monospace file path in accent color, collapsible remediation with accent left border on elevated bg, hover shadow lift

---

## 2026-03-22 — Dashboard & New Audit Restyle

### Changed

- **Dashboard quick actions**: Surface bg cards with rounded-[14px], accent-subtle icon bg for "New Audit", elevated bg for others, hover lift animation
- **Dashboard recent audits**: Surface bg card with rounded-[14px], folder names in monospace, type/depth badges with accent styling, grid layout with proper columns
- **Dashboard animations**: Added fadeIn + stagger animations to all sections
- **Audit type cards**: Replaced custom selection styling with `SelectCard` component, 2x2 grid, 36x36 rounded-[10px] icon containers (accent-subtle when selected, elevated when not)
- **Depth toggle**: Replaced custom buttons with `SelectCard`, side-by-side 2-column layout showing time estimate and description
- **Folder picker**: Input uses monospace font with elevated bg and accent focus; added recent folder suggestion chips (elevated bg, mono font, rounded-lg, text-xs)
- **Confirm dialog**: Surface bg modal with rounded-[18px], grid layout summary with muted labels, warning note in elevated bg with rounded-[10px], outline "Go Back" and primary "Start Audit" buttons
- **New audit form**: Section labels now uppercase text-xs font-semibold tracking-wider text-muted, max-w-2xl centered layout, increased spacing between sections, staggered fadeIn animations per section

---

## 2026-03-22 — Setup Wizard Restyle

### Changed

- **Setup wizard Step 1 (Welcome)**: 72x72 gradient icon with Shield, `text-[30px]` bold heading, 2x2 feature card grid with stagger animations, full-width primary button, absolute-positioned theme toggle
- **Setup wizard Step 2 (API Key)**: Provider selector uses `SelectCard` component, API key input uses `Input` with mono font, label input uses `Input`, full-width primary submit button
- **Step indicator**: Switched from pill bars to accent/muted dots
- **Design tokens**: All colors reference CSS custom properties (`--accent`, `--text-secondary`, `--surface`, etc.) instead of Tailwind defaults

---

## 2026-03-22 — Design Overhaul Phase 1 & 2: Foundation & UI Primitives

### Added

- **CSS design tokens**: Full dark/light theme color system matching design prototype (accent yellow, surface/elevated layers, severity colors)
- **Keyframe animations**: `fadeIn`, `slideIn`, `progressPulse`, `shimmer` with staggered delay utility classes
- **JetBrains Mono font**: Added via `next/font/google` as `--font-jetbrains-mono` CSS variable
- **`SelectCard` component**: Reusable selection card with accent border, subtle bg, and box-shadow glow on selected state
- **`HealthScore` component**: SVG ring gauge with score/grade display, color-coded by threshold (green >70, yellow >40, red <40), sm/lg sizes
- **`primary` button variant**: Yellow accent bg with dark text, hover brightness lift

### Changed

- **CSS variables rewritten**: Mapped all Shadcn HSL variables to CodeAudit design tokens; `--primary`/`--accent` now map to yellow accent color; `--radius` set to 14px
- **Button component**: All variants now use `rounded-[10px]`, `transition-all duration-150`, `hover:-translate-y-[1px]`; destructive variant switched to subtle red bg/border style
- **Input component**: Updated to elevated bg, accent border on focus, `rounded-[10px]`, added `mono` prop for JetBrains Mono
- **Select trigger**: Matches input styling — elevated bg, accent focus, 10px radius
- **Alert dialog**: Content uses surface bg, 18px radius, border from design tokens; overlay already had backdrop blur
- **Severity badge**: Uses exact hex severity colors as inline styles for bg (10% opacity) and border (20% opacity)
- **Severity chart**: Tooltip uses surface bg with enhanced shadow

---

## 2026-03-22 — Replace LLM-Generated HTML Reports with Local Templates

### Changed

- **Phase 11 rewritten**: HTML report generation now uses deterministic local templates instead of LLM `generateText` calls
- **New file `report-templates.ts`**: Two exported functions (`generateManagementReport`, `generateTechnicalReport`) produce self-contained HTML via template literals
- **Removed `ai` / `generateText` dependency** from phase-11.ts — zero LLM tokens consumed for report generation
- **Dark theme by default** (#0d1117) with light theme toggle, inspired by reference report designs
- **Management report**: health score ring, severity pills + table, finding cards with severity borders, summary section
- **Technical report**: score badge, severity stat grid, all findings as expandable `<details>` cards grouped by severity, remediation priority list
- Both reports handle edge cases: empty findings, missing fields, zero scores

---

## 2026-03-22 — UI Polish: 6 Feedback Issues

### Fixed

- **Selected buttons indistinguishable**: Provider, audit-type, depth, and filter buttons now use solid white background with ring highlight when selected
- **No light theme toggle**: Added light/dark theme toggle in sidebar with localStorage persistence; removed forced dark mode from root layout; added proper light mode CSS variables
- **Display name "CodeAudit" missing "AI"**: Updated metadata title, sidebar logo, and setup wizard to say "CodeAudit AI"
- **Folder picker browse button useless**: Removed the broken `<input type="file" webkitdirectory>` and Browse button; kept only the text input for pasting absolute paths
- **Design too minimalistic**: Added visible borders (`border-zinc-300`/`border-zinc-700`), shadow on cards, solid button backgrounds, hover states (`hover:bg-zinc-100`/`hover:bg-zinc-800`), focus rings, and clear active states across all components

### Changed

- CSS variables restructured: light mode is now `:root` default, dark mode under `.dark` class
- Button variants updated: outline/secondary have visible borders, ghost has proper hover bg
- Input and select components have stronger border contrast

---

## 2026-03-22 — Improved HTML Report Design

### Changed

- **Phase-11 HTML report prompts** now include a full design system extracted from reference templates
- Management report uses sidebar layout, health score ring (SVG), traffic light tables, risk cards, stat cards, and action items
- Technical report uses expandable finding cards grouped by severity, score grids with progress bars, alert boxes, and remediation lists
- Both reports support dark/light theme toggle, responsive layout, and print styles
- Increased maxOutputTokens from 8192 to 16384 for richer report generation

---

## 2026-03-22 — Onboarding Welcome Screen

### Added

- **Onboarding welcome/about screen** as Step 1 of the setup wizard before API key entry
- Feature highlights: 13-phase audit, multi-provider support, live cost tracking, audit comparison
- Step indicator dots showing progress through the setup flow
- "Get Started" button to transition from welcome screen to API key setup

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
