<p align="center">
  <img src="docs/assets/logo.svg" alt="CodeAudit AI" width="120" height="120" />
</p>

<h1 align="center">CodeAudit AI</h1>

<p align="center">
  <strong>Run thorough codebase health audits from your browser — powered by LLMs</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#supported-providers">Providers</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#usage-guide">Usage Guide</a> •
  <a href="#development">Development</a>
</p>

<p align="center">
  <a href="https://github.com/user/codeaudit-ai/actions"><img src="https://img.shields.io/github/actions/workflow/status/user/codeaudit-ai/ci.yml?branch=main&style=flat-square&logo=github&label=CI" alt="CI Status" /></a>
  <img src="https://img.shields.io/badge/version-0.6.0-blue?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

<br />

<!-- TODO: Add screenshot once app is running
<p align="center">
  <img src="docs/assets/screenshot-dashboard.png" alt="CodeAudit AI Dashboard" width="800" />
</p>
-->

---

## What Is This?

CodeAudit AI is a **local-first** web application that wraps a comprehensive 12-phase codebase review process into a browser UI. Point it at any local folder, pick an LLM provider, and get a structured health report with severity scores, actionable findings, and downloadable reports.

**No code ever leaves your machine** — only LLM API calls go outbound, using your own API key.

---

## Features

- **12-phase structured audit** — from bootstrap detection to final HTML reports
- **Any programming language** — polyglot engine adapts commands per detected stack
- **4 LLM providers** — Anthropic, OpenAI, Gemini, plus any OpenAI-compatible endpoint (Ollama, LM Studio, vLLM)
- **Live progress** — SSE streaming with per-phase detail, cancel anytime
- **Results dashboard** — health score, severity charts, filterable findings
- **Downloadable reports** — HTML, Markdown, JSON, PDF, zip bundle
- **Audit history** — re-run audits, compare what improved or degraded
- **Safety first** — folder locked read-only, git push blocked, guaranteed cleanup
- **Dark/light themes** — Linear-inspired UI with yellow accent
- **BYOK** — bring your own key, you control the cost

---

## Supported Providers

<p align="center">
  <img src="https://img.shields.io/badge/Anthropic-D97757?style=for-the-badge&logo=anthropic&logoColor=white" alt="Anthropic" />&nbsp;&nbsp;
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />&nbsp;&nbsp;
  <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini" />&nbsp;&nbsp;
  <img src="https://img.shields.io/badge/OpenAI--Compatible-333333?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI-Compatible" />
</p>

| Provider | Models | Get API Key |
|----------|--------|-------------|
| **Anthropic** | Claude Opus 4.6 / Sonnet 4.6 / Haiku 4.5 | [console.anthropic.com](https://console.anthropic.com/) |
| **OpenAI** | GPT-4o / GPT-4o-mini | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Google Gemini** | Gemini 2.5 Pro / Flash | [aistudio.google.com](https://aistudio.google.com/apikey) |
| **OpenAI-Compatible** | Any model via custom endpoint | Ollama, LM Studio, vLLM, llama.cpp, etc. |

> **AUTO mode** minimizes cost by using cheaper models for simple phases and stronger models for security & architecture analysis. (Not available for OpenAI-compatible — requires explicit model selection.)

---

## Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- An API key from Anthropic, OpenAI, or Google — or any OpenAI-compatible endpoint (see [Supported Providers](#supported-providers))

### Install & Run

```bash
# Clone the repo
git clone https://github.com/user/codeaudit-ai.git
cd codeaudit-ai

# Install dependencies
pnpm install

# Start the app
pnpm dev:web
```

Open **http://localhost:3000** in your browser.

> **First run:** The app auto-creates a SQLite database at `~/.codeaudit-ai/codeaudit.db` and generates an encryption key at `~/.codeaudit-ai/.env`. No manual config needed.

---

## Usage Guide

### 1. Setup Wizard

On first visit, the wizard walks you through two steps:

| Step | What Happens |
|------|-------------|
| **Welcome** | Overview of features and capabilities |
| **Add API Key** | Paste your Anthropic, OpenAI, Gemini, or OpenAI-compatible endpoint key. Cloud keys are validated with a test API call before saving. |

Your key is encrypted at rest with **AES-256-GCM** and never shown again — only the label and last 4 characters are displayed.

### 2. Start a New Audit

Navigate to **New Audit** in the sidebar, then:

<table>
<tr><td width="180"><strong>Pick a folder</strong></td><td>Type or paste the absolute path to any local codebase (e.g., <code>~/Projects/my-app</code>). Recent folders appear as quick-select chips.</td></tr>
<tr><td><strong>Choose audit type</strong></td><td>Full, Security Only, Team & Collaboration, or Code Quality (see <a href="#audit-types">Audit Types</a> below)</td></tr>
<tr><td><strong>Choose depth</strong></td><td><strong>Quick Scan</strong> (~30 min, samples files) or <strong>Deep Audit</strong> (1-6 hours, full analysis)</td></tr>
<tr><td><strong>Select model</strong></td><td>Pick a specific model or use <strong>Auto</strong> for cost-optimized selection per phase</td></tr>
<tr><td><strong>Review estimate</strong></td><td>See the estimated cost range before starting</td></tr>
<tr><td><strong>Confirm & Start</strong></td><td>Review the summary dialog and click Start — folder locks automatically</td></tr>
</table>

### 3. Watch Progress

The progress view shows real-time status:

- **Progress bar** — animated gradient with overall percentage
- **Live stats** — token count, running cost, elapsed time
- **Phase list** — expand to see all 12 phases with status icons:
  - ✅ Completed (with findings count, duration, cost)
  - 🔄 Running
  - ⏳ Pending
  - ❌ Failed
- **Cancel** — stop anytime; partial results are saved, folder is unlocked

> You can close the tab and come back — progress persists server-side.

### 4. View Results

When the audit completes, the results dashboard shows:

| Section | Details |
|---------|---------|
| **Health Score** | Letter grade (A-F) with SVG ring gauge, color-coded by threshold |
| **Severity Chart** | Bar chart breakdown: Critical / High / Medium / Low / Info |
| **Findings List** | Filterable by severity pills, each card shows title, file path, line number, evidence, and expandable remediation |
| **Cost Summary** | Total tokens + cost, expandable per-phase breakdown, budget warning if >20% over estimate |
| **Reports** | Executive Report and Technical Report as separate full-page views |

### 5. Download Reports

Click **Download All** to get a zip containing:

| File | Format |
|------|--------|
| Management dashboard | HTML |
| Technical dashboard | HTML |
| Findings report | Markdown |
| Codebase health report | Markdown |
| Structured data | JSON |
| Both dashboards | PDF |
| Audit metadata | Budget log, repo context |

### 6. Compare Audits Over Time

Re-run an audit on the same folder, then go to **History** in the sidebar:

- All past audits grouped by folder with score badges
- Select audits with checkboxes for bulk delete
- Click **Compare** on any folder with 2+ audits to see:
  - **Score delta** — point difference with direction arrow (green = improved, red = degraded)
  - **Side-by-side** — health score rings and severity bars for previous vs latest
  - **Finding diff** — Resolved (green strikethrough), New (red), Persisted (gray)

### 7. Manage API Keys

Go to **Settings > API Keys** in the sidebar to:

- View all stored keys (masked display with provider icon)
- Edit labels or delete keys
- Add new keys for any provider
- Store multiple keys per provider (e.g., "Personal" and "Work")

---

## Audit Types

| Type | What It Checks | Phases Run |
|------|---------------|------------|
| **Full Audit** | Everything — architecture, dependencies, tests, complexity, git history, security, code quality, CI/CD, docs | 0-11 (all) |
| **Security Only** | Secrets, auth, injection, API security, data protection | 0, 1, 6, 7, 10, 11 |
| **Team & Collaboration** | Git archaeology, contributor patterns, PR workflow | 0, 1, 5, 10, 11 |
| **Code Quality** | Dependencies, test coverage, complexity, CI/CD, docs | 0, 1, 2, 3, 4, 8, 9, 10, 11 |

### The 12 Audit Phases

| Phase | Name | What It Does |
|-------|------|-------------|
| 0 | **Bootstrap** | Auto-detects language, frameworks, package manager, CI system, LOC — builds a RepoContext for all subsequent phases |
| 1 | **Orientation** | Maps project structure, discovers entry points, counts test files |
| 2 | **Dependency Health** | Runs vulnerability audits (npm audit, pip-audit, cargo audit, etc.) |
| 3 | **Test Coverage** | Finds tests, measures coverage using language-appropriate tools |
| 4 | **Code Complexity** | Counts functions/classes, identifies complex hotspots |
| 5 | **Git Archaeology** | Analyzes commit history, churn, contributor patterns |
| 6 | **Security Audit** | Searches for secrets, injection vectors, auth issues, env access |
| 7 | **Deep Reads** | Examines payment, auth, and error handling code paths |
| 8 | **CI/CD** | Checks pipeline configuration across all major CI systems |
| 9 | **Documentation** | Evaluates doc coverage (JSDoc, docstrings, GoDoc, etc.) |
| 10 | **Final Report** | Aggregates all findings, computes health score and grade |
| 11 | **HTML Reports** | Generates management and technical dashboards |

> Phases adapt per language — the LLM generates and executes appropriate commands for the detected stack (TypeScript, Python, Go, Rust, Java, and more).

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│  Browser (localhost:3000)                                │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐  │
│  │ Setup   │→ │ New Audit│→ │Progress │→ │ Results  │  │
│  │ Wizard  │  │   Form   │  │  (SSE)  │  │Dashboard │  │
│  └─────────┘  └──────────┘  └─────────┘  └──────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                    Next.js API
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐    ┌──────▼──────┐   ┌────▼────┐
   │  SQLite  │    │ Audit Engine│   │   LLM   │
   │  (local) │    │ (12 phases) │   │ Adapter │
   │          │    │             │   │         │
   │ api_keys │    │ lock folder │   │Anthropic│
   │ audits   │    │ exec cmds   │   │ OpenAI  │
   │ phases   │    │ parse JSON  │   │ Gemini  │
   │ settings │    │unlock folder│   │OAI-comp│
   │          │    │             │   │  AUTO   │
   └──────────┘    └─────────────┘   └─────────┘
```

### Safety Model

| Layer | What It Does |
|-------|-------------|
| **Filesystem lock** | `chmod -R a-w` — writes physically blocked during audit |
| **Git push block** | `git remote set-url --push origin no_push` — pushes fail |
| **Output isolation** | All findings go to `~/audit-{name}-{timestamp}/`, never inside the repo |
| **Sandbox** | `execCommand` tool rejects write, delete, and network commands |
| **Prompt injection** | Repo content wrapped in `<data_block trust="untrusted">` tags |
| **Guaranteed cleanup** | Folder unlocked in `finally` block — even on crash or cancel |

---

## Cost

You pay your LLM provider directly. The app shows estimates before and during audits:

| Repo Size | Quick Scan | Deep Audit |
|-----------|-----------|------------|
| Small (<500 files) | $1–3 | $3–8 |
| Medium (500–5K files) | $3–8 | $8–20 |
| Large (5K+ files) | $5–15 | $15–50 |

**AUTO mode** routes simple phases (orientation, docs) to cheaper models and complex phases (security, architecture) to stronger models, saving 30-50% vs using the most capable model for everything.

---

## Tech Stack

<table>
  <tr>
    <td align="center" width="100">
      <img src="https://cdn.simpleicons.org/nextdotjs/000000" width="28" height="28" alt="Next.js" /><br />
      <sub>Next.js 16</sub>
    </td>
    <td align="center" width="100">
      <img src="https://cdn.simpleicons.org/typescript/3178C6" width="28" height="28" alt="TypeScript" /><br />
      <sub>TypeScript 5.7</sub>
    </td>
    <td align="center" width="100">
      <img src="https://cdn.simpleicons.org/sqlite/003B57" width="28" height="28" alt="SQLite" /><br />
      <sub>SQLite</sub>
    </td>
    <td align="center" width="100">
      <img src="https://cdn.simpleicons.org/tailwindcss/06B6D4" width="28" height="28" alt="Tailwind" /><br />
      <sub>Tailwind CSS 4</sub>
    </td>
    <td align="center" width="100">
      <img src="https://cdn.simpleicons.org/react/61DAFB" width="28" height="28" alt="React" /><br />
      <sub>React 19</sub>
    </td>
    <td align="center" width="100">
      <img src="https://cdn.simpleicons.org/vitest/6E9F18" width="28" height="28" alt="Vitest" /><br />
      <sub>Vitest</sub>
    </td>
    <td align="center" width="100">
      <img src="https://cdn.simpleicons.org/zod/3E67B1" width="28" height="28" alt="Zod" /><br />
      <sub>Zod</sub>
    </td>
  </tr>
</table>

**Full stack:** Next.js 16 (App Router) · React 19 · TypeScript 5.7 · SQLite (better-sqlite3) · Drizzle ORM · Vercel AI SDK 6 · Tailwind CSS 4 · shadcn/ui · Radix UI · Recharts · Puppeteer · Archiver · TanStack Query · Zod

---

## Project Structure

```
codeaudit-ai/
├── apps/
│   └── web/                    Next.js 16 frontend + API routes
│       ├── app/                App Router pages
│       │   ├── (app)/          Authenticated layout (sidebar)
│       │   │   ├── dashboard/  Main dashboard
│       │   │   ├── audit/      New audit, progress, results, compare
│       │   │   ├── history/    Audit history
│       │   │   └── settings/   API key management
│       │   ├── setup/          First-time setup wizard
│       │   └── api/            REST endpoints (audit, stream, report, download)
│       ├── actions/            Server Actions (mutations)
│       ├── components/         UI components (shadcn/ui + custom)
│       └── lib/                Utilities (folder safety, formatters)
├── packages/
│   ├── audit-engine/           12-phase audit orchestrator
│   │   ├── phases/             Phase runners (phase-00 through phase-11)
│   │   ├── tools/              Sandboxed execCommand tool
│   │   └── prompt-builder.ts   LLM prompt construction with injection defense
│   ├── cli/                    npx entry point (tsup compiled)
│   ├── db/                     Drizzle schema + SQLite client
│   └── llm-adapter/            Multi-LLM abstraction (4 providers + AUTO)
│       └── providers/          Anthropic, OpenAI, Gemini, OpenAI-compatible adapters
├── manual-codebase-review-process/
│   └── codebase_review_guide.md   Source-of-truth audit methodology
└── .planning/                  Roadmap, milestones, phase plans
```

---

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/models` | List available models for a provider |
| `POST` | `/api/audit/[id]` | Start audit execution (returns 202) |
| `POST` | `/api/audit/[id]/stream` | SSE progress stream |
| `POST` | `/api/audit/[id]/cancel` | Cancel running audit |
| `GET` | `/api/audit/[id]/report/[type]` | Serve HTML report (executive/technical) |
| `GET` | `/api/audit/[id]/pdf/[type]` | Generate PDF from HTML report |
| `POST` | `/api/audit/[id]/download` | Download zip of all artifacts |

---

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev:web

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Build for production
pnpm build

# Build CLI package
pnpm --filter codeaudit-ai build
```

### Scripts

| Command | What It Does |
|---------|-------------|
| `pnpm dev:web` | Start Next.js dev server on localhost:3000 |
| `pnpm test` | Run Vitest test suite |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm typecheck` | TypeScript type checking (no emit) |
| `pnpm lint` | ESLint across all packages |
| `pnpm build` | Production build |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:studio` | Open Drizzle Studio (database browser) |

### Data Storage

All data is stored locally at `~/.codeaudit-ai/`:

| File | Purpose |
|------|---------|
| `codeaudit.db` | SQLite database (audits, findings, API keys, settings) |
| `.env` | Auto-generated AES-256-GCM master encryption key |

### API Key Security

Your API keys are encrypted at rest using **AES-256-GCM** with a unique IV per key. The master encryption key is auto-generated on first run. Keys are never returned to the browser after storage — only the label and last 4 characters are shown in the UI.

---

## Roadmap

| Version | Status | Focus |
|---------|--------|-------|
| **0.5.0** | ✅ Released | CLI packaging, CI, tests, cost tracking, dead code cleanup |
| **0.6.0** | ✅ Released | OpenAI-compatible provider support (Ollama, LM Studio, vLLM) |
| **0.7.0** | Planned | npm publish, Homebrew, E2E tests, error UX, screenshots |
| **0.8.0** | Planned | Multi-repo cross-product analysis |
| **1.0.0** | Planned | Public release — quality metrics, perf, docs, license |

See [TODOS.md](TODOS.md) for detailed task list.

---

## License

[MIT](LICENSE)

---

<p align="center">
  <sub>Built with</sub><br />
  <a href="https://nextjs.org"><img src="https://cdn.simpleicons.org/nextdotjs/000000" width="20" height="20" alt="Next.js" /></a>&nbsp;&nbsp;
  <a href="https://www.typescriptlang.org"><img src="https://cdn.simpleicons.org/typescript/3178C6" width="20" height="20" alt="TypeScript" /></a>&nbsp;&nbsp;
  <a href="https://tailwindcss.com"><img src="https://cdn.simpleicons.org/tailwindcss/06B6D4" width="20" height="20" alt="Tailwind CSS" /></a>&nbsp;&nbsp;
  <a href="https://sqlite.org"><img src="https://cdn.simpleicons.org/sqlite/003B57" width="20" height="20" alt="SQLite" /></a>&nbsp;&nbsp;
  <a href="https://orm.drizzle.team"><img src="https://cdn.simpleicons.org/drizzle/C5F74F" width="20" height="20" alt="Drizzle" /></a>&nbsp;&nbsp;
  <a href="https://sdk.vercel.ai"><img src="https://cdn.simpleicons.org/vercel/000000" width="20" height="20" alt="Vercel AI SDK" /></a>
</p>
