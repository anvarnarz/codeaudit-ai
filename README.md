# CodeAudit

A local-first codebase audit tool with a browser UI. Run a thorough 13-phase code health audit on any local folder using your own LLM API key (Anthropic, OpenAI, or Gemini). No code ever leaves your machine.

## What It Does

CodeAudit wraps a comprehensive manual codebase review process into a single command. It:

- **Locks your folder read-only** (same safety model as a manual audit)
- **Runs 13 audit phases** via LLM API calls: orientation, dependencies, tests, complexity, git archaeology, security (6 sub-phases), deep reads, CI/CD, documentation, final report, and HTML dashboards
- **Shows live progress** in your browser with expandable per-phase detail
- **Generates reports**: in-app dashboard, downloadable HTML/markdown/JSON/PDF
- **Tracks history**: re-run audits and compare what improved or degraded

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- An API key from [Anthropic](https://console.anthropic.com/), [OpenAI](https://platform.openai.com/api-keys), or [Google AI Studio](https://aistudio.google.com/apikey)

### 1. Clone and Install

```bash
git clone <repo-url> codeaudit
cd codeaudit
pnpm install
```

### 2. Start the App

```bash
pnpm dev:web
```

This starts the Next.js dev server at `http://localhost:3000`. Open it in your browser.

> **First run**: The app auto-creates a SQLite database at `~/.codeaudit/codeaudit.db` and generates an encryption key at `~/.codeaudit/.env`. No manual setup needed.

### 3. Setup Wizard

On first visit, the setup wizard guides you through:

1. **Welcome** — overview of what the tool does
2. **Add API Key** — paste your Anthropic, OpenAI, or Gemini API key. The app validates it with a test call before saving.

That's it. You're ready to audit.

### 4. Run Your First Audit

1. Click **New Audit** in the sidebar
2. **Pick a folder** — type or paste the path to any local codebase (e.g., `~/Projects/my-app`)
3. **Choose audit type**:
   - **Full Audit** — all 13 phases (recommended for first run)
   - **Security Only** — Phases 0, 1, 6a-6f, 7a, 10, 11
   - **Team & Collaboration** — Phases 0, 1, 5a-5g, 10, 11
   - **Code Quality** — Phases 0, 1, 2, 3, 4, 10, 11
4. **Choose depth**:
   - **Quick Scan** (~30 min) — samples files, skips some phases
   - **Deep Audit** (1-6 hours) — full analysis of every file
5. **Select model** — pick from available models for your provider, or use **Auto** (cost-optimized: cheaper models for simple phases, stronger models for security)
6. **Review cost estimate** — the app shows a rough range (e.g., "$3–$8") based on folder size
7. **Confirm** — review the summary dialog and click Start

### 5. Watch It Run

The progress view shows:
- Current phase name and overall percentage
- Expand to see per-phase status: ✓ complete, ▶ running, ○ pending
- Live token count and estimated cost
- **Cancel** anytime — partial results are saved, folder is unlocked

You can close the tab and come back — progress persists.

### 6. View Results

When the audit completes, click **View Results** to see:

- **Health score** with letter grade (A-F)
- **Severity chart** — bar chart of Critical/High/Medium/Low/Info findings
- **Findings list** — filterable by severity, each card shows:
  - Title with severity badge
  - File path and line number
  - Evidence snippet
  - Remediation suggestion (click to expand)
- **Cost summary** — total tokens, total cost, per-phase breakdown
- **Executive report** and **Technical report** as separate pages

### 7. Download Reports

Click **Download** to get a zip containing:
- HTML dashboards (management + technical)
- Markdown reports (findings.md + codebase_health.md)
- Structured JSON data
- PDF versions of both dashboards
- All audit artifacts (budget log, repo context, etc.)

### 8. Compare Over Time

Re-run an audit on the same folder. Go to **History** in the sidebar to see all past audits grouped by folder. Click **Compare** to see:
- Score delta (improved/degraded)
- Resolved findings (green)
- New findings (red)
- Persisted findings (gray)

## Audit Types

| Type | What It Checks | Phases |
|------|---------------|--------|
| **Full** | Everything — architecture, dependencies, tests, complexity, git history, security, code quality, CI/CD, docs | 0-11 |
| **Security Only** | Secrets, auth, injection, API security, data protection, infrastructure | 0, 1, 6a-6f, 7a, 10, 11 |
| **Team & Collaboration** | Git archaeology, contributor performance, PR patterns, DORA metrics | 0, 1, 5a-5g, 10, 11 |
| **Code Quality** | Dependencies, test coverage, complexity, duplication | 0, 1, 2, 3, 4, 10, 11 |

## How It Works

1. **Locks the folder** — `chmod -R a-w` + git push block (same as the manual process)
2. **Runs Phase 0 bootstrap** — auto-detects stack, structure, production URLs, contributors, LOC
3. **Executes each phase** — runs bash commands (grep, find, git log) locally, feeds results to the LLM with per-phase prompts from the audit guide
4. **Stores structured findings** — JSON in SQLite, not just markdown
5. **Generates HTML reports** — management and technical dashboards via LLM
6. **Unlocks the folder** — guaranteed cleanup on complete, cancel, or crash

All LLM calls use your API key. The app never sends code to any server — only to the LLM API you chose.

## Safety Model

CodeAudit replicates the same defense-in-depth safety model as the manual audit process:

| Layer | What It Does |
|-------|-------------|
| **Filesystem lock** | `chmod -R a-w` — writes are physically impossible |
| **Git push block** | `no_push` remote URL — pushes fail even if writes succeed |
| **Output isolation** | All findings go to `~/audit-{name}/`, never inside the repo |
| **Prompt injection defense** | Repo content wrapped in `<data_block trust="untrusted">` tags |

The folder is always unlocked after the audit, even if it crashes or is cancelled.

## Project Structure

```
codeaudit/
├── apps/web/                    # Next.js 16 app (UI + API routes)
├── packages/
│   ├── cli/                     # npx entry point
│   ├── db/                      # SQLite schema + Drizzle ORM
│   ├── audit-engine/            # 13-phase audit orchestrator
│   ├── llm-adapter/             # Anthropic/OpenAI/Gemini abstraction
│   └── repo-sandbox/            # Git cloning utilities
├── manual-codebase-review-process/  # Source-of-truth audit guides
├── docker/                      # Docker Compose (dev convenience)
└── .planning/                   # GSD project planning artifacts
```

## Development

```bash
# Install dependencies
pnpm install

# Start the web app (development)
pnpm dev:web

# Run tests
pnpm test

# Type check
pnpm --filter web exec tsc --noEmit
```

### Scripts

| Command | What It Does |
|---------|-------------|
| `pnpm dev:web` | Start Next.js dev server on localhost:3000 |
| `pnpm dev` | Start everything (Docker + web + worker) |
| `pnpm test` | Run Vitest test suite |
| `pnpm build` | Build for production |

## API Key Storage

Your API keys are encrypted at rest using AES-256-GCM with a unique IV per key. The master encryption key is auto-generated on first run and stored at `~/.codeaudit/.env`. Keys are never returned to the browser after storage — only the label and last 4 characters are shown.

## Cost

You pay your LLM provider directly. The app shows cost estimates before and during audits:

| Repo Size | Quick Scan | Deep Audit |
|-----------|-----------|------------|
| Small (<500 files) | $1–3 | $3–8 |
| Medium (500–5,000 files) | $3–8 | $8–20 |
| Large (5,000+ files) | $5–15 | $15–50 |

**Auto mode** minimizes cost by using cheaper models for simple phases (orientation, docs) and stronger models for complex phases (security, architecture).

## License

MIT
