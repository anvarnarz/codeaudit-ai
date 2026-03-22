# Phase 1: Foundation — UI Specification

**Phase:** 01-foundation
**Created:** 2026-03-21
**Status:** Design contract for implementation

---

## Design Language

### Visual Identity

**Aesthetic:** Linear-inspired — clean, minimal, dark mode default, sharp typography, high contrast borders, muted backgrounds with vivid accent colors for interactive elements.

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0A0A0B` | Page background, main canvas |
| `--bg-secondary` | `#111113` | Sidebar, cards, elevated surfaces |
| `--bg-tertiary` | `#1A1A1E` | Hover states, input fields, table rows |
| `--border-default` | `#222226` | Card borders, dividers, input outlines |
| `--border-subtle` | `#1A1A1E` | Separator lines, inactive borders |
| `--text-primary` | `#EDEDEF` | Headings, body text, primary labels |
| `--text-secondary` | `#8B8B93` | Descriptions, help text, metadata |
| `--text-tertiary` | `#5C5C66` | Placeholder text, disabled labels |
| `--accent-primary` | `#6E56CF` | Primary buttons, active nav items, focus rings |
| `--accent-hover` | `#7C66DC` | Button hover, link hover |
| `--success` | `#30A46C` | Key validated, success toast |
| `--warning` | `#F5A623` | Warnings, caution states |
| `--error` | `#E5484D` | Validation errors, key invalid, destructive actions |

### Typography

| Role | Font | Weight | Size | Line Height |
|------|------|--------|------|-------------|
| Page title | Inter | 600 (Semibold) | 24px / 1.5rem | 32px |
| Section heading | Inter | 600 (Semibold) | 18px / 1.125rem | 28px |
| Card title | Inter | 500 (Medium) | 16px / 1rem | 24px |
| Body | Inter | 400 (Regular) | 14px / 0.875rem | 22px |
| Label | Inter | 500 (Medium) | 13px / 0.8125rem | 20px |
| Caption / help text | Inter | 400 (Regular) | 12px / 0.75rem | 18px |
| Monospace (keys) | JetBrains Mono | 400 (Regular) | 13px / 0.8125rem | 20px |

### Spacing & Layout

| Token | Value |
|-------|-------|
| `--spacing-xs` | 4px |
| `--spacing-sm` | 8px |
| `--spacing-md` | 12px |
| `--spacing-lg` | 16px |
| `--spacing-xl` | 24px |
| `--spacing-2xl` | 32px |
| `--spacing-3xl` | 48px |
| `--radius-sm` | 6px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| Sidebar width | 240px |
| Max content width | 960px |

### Component Primitives

All components built with Shadcn/ui + Tailwind. The following customizations apply:

- **Buttons:** `--radius-md` corners. Primary uses `--accent-primary` fill with white text. Ghost variant uses transparent bg with `--text-secondary` text, `--bg-tertiary` hover fill.
- **Inputs:** `--bg-tertiary` fill, `--border-default` border, `--radius-md` corners. Focus ring is 2px `--accent-primary` offset by 1px.
- **Cards:** `--bg-secondary` fill, 1px `--border-default` border, `--radius-lg` corners, `--spacing-xl` padding.
- **Badges:** Pill-shaped (`--radius-sm` + 9999px), small text (12px), no border, solid fill matching semantic color.
- **Toasts:** Bottom-right position, `--bg-secondary` fill with `--border-default` border, auto-dismiss after 5s.

---

## Screen 1: Landing Page

**Route:** `/`
**Purpose:** First impression. Single CTA to sign in with GitHub. No marketing, no features list.
**Requirement refs:** D-10

### Layout

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│                                                          │
│                      [Logo / Icon]                       │
│                                                          │
│                      CodeAudit                           │
│              AI-powered codebase health audits            │
│                                                          │
│                ┌─────────────────────────┐               │
│                │  ◆  Sign in with GitHub │               │
│                └─────────────────────────┘               │
│                                                          │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Specifications

| Element | Spec |
|---------|------|
| Background | `--bg-primary`, full viewport height, centered flex column |
| Product name | Page title style (24px semibold), `--text-primary` |
| Tagline | Body style (14px regular), `--text-secondary`, max-width 320px, centered |
| Sign-in button | Primary button style. GitHub icon (Octicon mark-github) left-aligned inside button. Min-width 240px. Height 44px. |
| Spacing | 16px between logo and product name, 8px between name and tagline, 32px between tagline and button |
| Logo | Placeholder — simple geometric mark, 48x48px, `--accent-primary` color. Implementation can use an SVG icon or text glyph. |

### Behavior

- If user is already authenticated (valid session cookie), redirect to `/dashboard` immediately.
- Sign-in button triggers Auth.js GitHub SSO flow.
- No loading state on the page itself — button shows a spinner icon replacing the GitHub icon while the OAuth redirect is in progress (disable button to prevent double-click).

### States

| State | Visual |
|-------|--------|
| Default | As described above |
| Button loading | Spinner replaces GitHub icon, button text changes to "Redirecting...", button is disabled, `opacity: 0.7` |

---

## Screen 2: Guided Onboarding

**Route:** `/onboarding` (internal route, not directly navigable — redirected to after first sign-up)
**Purpose:** Walk new users through initial setup: welcome, add API key, pick repo, start audit.
**Requirement refs:** D-02, D-06, D-07, D-08

### Flow

The onboarding is a 4-step flow rendered as a single page with step transitions (no full-page navigation). Steps progress linearly. A "Skip setup" link is available on every step except step 1 (welcome).

```
Step 1: Welcome → Step 2: Add API Key → Step 3: Pick Repo → Step 4: Start Audit
```

### Step Indicator

A horizontal row of 4 dots at the top of the onboarding card, centered. Active step dot is `--accent-primary` fill, 8px diameter. Completed steps are `--accent-primary` with a checkmark. Upcoming steps are `--border-default` fill, 8px diameter. 12px gap between dots.

### Step 1: Welcome

```
┌──────────────────────────────────────────────────────────┐
│                    ●  ○  ○  ○                            │
│                                                          │
│                  Welcome to CodeAudit                     │
│                                                          │
│      Run AI-powered audits on any GitHub repo.           │
│      Bring your own API key. See findings in minutes.    │
│                                                          │
│                 ┌──────────────────┐                     │
│                 │    Get started   │                     │
│                 └──────────────────┘                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Container | Card component (centered, max-width 520px, min-height 400px), vertically centered in viewport |
| Heading | Section heading style, `--text-primary` |
| Description | Body style, `--text-secondary`, centered, max-width 380px |
| Button | Primary button, "Get started" |

### Step 2: Add API Key

```
┌──────────────────────────────────────────────────────────┐
│                    ●  ●  ○  ○                            │
│                                                          │
│                   Add an API key                         │
│     Connect an LLM provider to power your audits.        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ [Anthropic logo]  Anthropic                    [+] │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ [OpenAI logo]     OpenAI                       [+] │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ [Gemini logo]     Gemini                       [+] │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│                                          Skip  Continue  │
└──────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Provider list | Three rows, equal visual weight. Each row: 24x24 provider icon, provider name (card title style), and a `[+]` ghost button on the right. |
| Provider icons | Anthropic: orange/brown mark. OpenAI: black/white mark. Gemini: Google AI blue mark. All three rendered as 24x24 SVGs. |
| Row interaction | Clicking `[+]` or anywhere on the row opens the "Add key" inline expansion (see below). |
| Skip link | Ghost style, `--text-secondary`, positioned left of "Continue" button |
| Continue button | Primary button. Disabled (`opacity: 0.5`, no hover) until at least one key is added and validated. |

#### Add Key Inline Expansion

When a provider row is clicked, it expands to reveal:

```
┌────────────────────────────────────────────────────────┐
│ [Anthropic logo]  Anthropic                        [−] │
│                                                        │
│  Label                                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │ e.g., Personal                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  API Key                                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ sk-ant-api03-...                                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│                                       ┌─────────────┐  │
│                                       │  Validate    │  │
│                                       └─────────────┘  │
└────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Label input | Text input, placeholder "e.g., Personal", optional but encouraged. Max 50 chars. |
| API key input | Text input with `type="password"`. Monospace font (JetBrains Mono). Placeholder shows provider-specific prefix hint: `sk-ant-api03-...` for Anthropic, `sk-...` for OpenAI, `AI...` for Gemini. |
| Validate button | Secondary button (ghost variant with border). On click, sends key to server for validation via test API call (D-06). |
| Collapse | `[−]` button collapses the expansion back to the row. |
| Only one expansion open at a time | Expanding a different provider collapses the currently open one. |

#### Key Validation States

| State | Visual |
|-------|--------|
| Idle | Validate button active, no indicator |
| Validating | Validate button shows spinner, disabled. Text changes to "Validating..." |
| Valid | Green checkmark badge appears next to provider name. Row bg shifts to faint green tint (`rgba(48, 164, 108, 0.08)`). Expansion collapses automatically after 1s. |
| Invalid | Error text below key input in `--error` color: "Invalid API key. Check the key and try again." Validate button re-enabled. |
| Network error | Error text: "Could not reach [Provider]. Try again." |

#### Multiple Keys Per Provider

After a key is validated for a provider, the provider row shows the validated key label and a `[+ Add another]` text button below it:

```
│ [Anthropic logo]  Anthropic              ✓ Personal    │
│                                   [+ Add another]       │
```

Clicking `[+ Add another]` opens the same inline expansion for adding a second key with a different label.

### Step 3: Pick Repo

```
┌──────────────────────────────────────────────────────────┐
│                    ●  ●  ●  ○                            │
│                                                          │
│                  Pick a repository                        │
│         Choose a repo for your first audit.              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 🔍  Search repos...                              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  org/repo-name               ★ 142    TypeScript │   │
│  │  Short description of the repo...                │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  org/another-repo             ★ 45    Python     │   │
│  │  Another repo description...                     │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  user/personal-project        ★ 8     Rust       │   │
│  │  Personal project desc...                        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│                                          Skip  Continue  │
└──────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Search input | Text input with search icon (magnifying glass). Filters repos as user types (debounced, 300ms). |
| Repo list | Scrollable list (max-height 320px). Each row: repo full name (card title style), star count + primary language as badges on the right, description truncated to 1 line (caption style, `--text-secondary`). |
| Selection | Single-select. Clicking a row highlights it with `--accent-primary` left border (3px) and faint accent tint background (`rgba(110, 86, 207, 0.08)`). |
| Empty state | If no repos found: "No repositories found. Make sure the CodeAudit GitHub App is installed on your repos." with a link to GitHub App installation settings. |
| Loading state | Skeleton rows (3 rows, pulsing `--bg-tertiary` fill) while repos load. |
| Continue button | Disabled until a repo is selected. |
| Skip link | Skips to dashboard without selecting a repo. |

**Note:** This step lists repos from the GitHub App installation (D-03, D-04). If the GitHub App is not yet installed on any repos, show the empty state with an installation link. The GitHub App installation happens during or after the GitHub SSO flow (D-05).

### Step 4: Start Audit

```
┌──────────────────────────────────────────────────────────┐
│                    ●  ●  ●  ●                            │
│                                                          │
│                   Ready to audit                         │
│                                                          │
│  Repository                                              │
│  org/repo-name                                           │
│                                                          │
│  API Key                                                 │
│  Anthropic — Personal                                    │
│                                                          │
│            ┌─────────────────────────────────┐           │
│            │       Start your first audit    │           │
│            └─────────────────────────────────┘           │
│                                                          │
│                  or go to Dashboard →                     │
└──────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Summary | Two label-value pairs showing selected repo and selected API key (provider + label). Label style for labels, card title style for values. |
| Start audit button | Primary button, full-width within the card content area. This enqueues a full audit (default type, default depth). |
| Dashboard link | Text link, `--text-secondary`, caption style. Takes user to `/dashboard` without starting an audit. |

**Note:** This step is a preview/confirmation. The full audit configuration (type, depth, provider selection) is part of Phase 2. In Phase 1, the "Start audit" button uses defaults (full audit, deep, first available key). If audit execution is not yet built (Phase 1 does not include the audit engine), this button redirects to `/dashboard` with a toast: "Audit queued. You'll be notified when it starts."

### Onboarding Persistence

- Onboarding completion state is stored server-side (boolean flag on user record).
- Users who have completed onboarding (or skipped it) are never redirected to `/onboarding` again.
- Users can re-access API key management and repo selection from Settings and Repos pages respectively.

---

## Screen 3: App Shell (Authenticated Layout)

**Route:** All authenticated routes (`/dashboard`, `/audits`, `/repos`, `/settings`)
**Purpose:** Persistent sidebar navigation + top bar for all post-login pages.
**Requirement refs:** D-11

### Layout

```
┌─────────────────┬────────────────────────────────────────┐
│                 │                                        │
│   CodeAudit     │  [Page content area]                   │
│                 │                                        │
│   ─────────     │                                        │
│                 │                                        │
│   Dashboard     │                                        │
│   Audits        │                                        │
│   Repos         │                                        │
│                 │                                        │
│                 │                                        │
│                 │                                        │
│                 │                                        │
│   ─────────     │                                        │
│                 │                                        │
│   Settings      │                                        │
│                 │                                        │
│   ─────────     │                                        │
│   [Avatar] AV   │                                        │
│                 │                                        │
└─────────────────┴────────────────────────────────────────┘
```

### Sidebar Specifications

| Element | Spec |
|---------|------|
| Width | 240px fixed |
| Background | `--bg-secondary` |
| Border | 1px `--border-default` right border |
| Logo area | Product name "CodeAudit" in card title style (16px medium), `--text-primary`. Top-left, `--spacing-xl` padding. |
| Nav items | Label style (13px medium). Icon (16x16, Lucide icon set) + text. `--spacing-md` vertical padding per item, `--spacing-lg` horizontal padding. |
| Active nav item | `--accent-primary` text color. `--bg-tertiary` background. 2px left border in `--accent-primary`. |
| Inactive nav item | `--text-secondary` text color. Hover: `--bg-tertiary` background, `--text-primary` text. |
| Nav sections | Top section: Dashboard, Audits, Repos. Separated by 1px `--border-subtle` divider. Bottom section: Settings. |
| User area | Bottom of sidebar, above bottom edge. `--spacing-lg` padding. Shows GitHub avatar (28x28, `--radius-sm` rounded) + display name (caption style, truncated). Clicking opens a dropdown with "Sign out" option. |
| Sign out | Dropdown menu item. Red text (`--error`). Terminates session, redirects to `/`. |

### Nav Icons (Lucide)

| Item | Icon |
|------|------|
| Dashboard | `layout-dashboard` |
| Audits | `scan-search` |
| Repos | `git-branch` |
| Settings | `settings` |

### Content Area

| Element | Spec |
|---------|------|
| Background | `--bg-primary` |
| Padding | `--spacing-3xl` top, `--spacing-2xl` horizontal |
| Max content width | 960px, left-aligned (not centered) |
| Page title | Page title style (24px semibold), `--text-primary`, at top of content area |

---

## Screen 4: Dashboard (Placeholder)

**Route:** `/dashboard`
**Purpose:** Post-login landing page. In Phase 1, this is a placeholder. Full dashboard content arrives in later phases.

### Layout

```
┌─────────────────┬────────────────────────────────────────┐
│                 │                                        │
│   CodeAudit     │  Dashboard                             │
│                 │                                        │
│   ─────────     │  ┌────────────────────────────────┐   │
│                 │  │                                │   │
│   Dashboard  ◄  │  │    No audits yet.              │   │
│   Audits        │  │                                │   │
│   Repos         │  │    Run your first audit to     │   │
│                 │  │    see results here.            │   │
│                 │  │                                │   │
│                 │  │    [Run an audit →]             │   │
│                 │  │                                │   │
│                 │  └────────────────────────────────┘   │
│   ─────────     │                                        │
│   Settings      │                                        │
│   ─────────     │                                        │
│   [AV] Anvar    │                                        │
│                 │                                        │
└─────────────────┴────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Empty state card | Centered card, max-width 480px. Vertically centered within content area. |
| Illustration | None in Phase 1 — keep it text-only. |
| Message | Section heading: "No audits yet." Body text: "Run your first audit to see results here." |
| CTA | Text link style: "Run an audit" with right arrow. Links to `/repos` (where audit can be initiated in Phase 2). |

---

## Screen 5: Settings — API Keys

**Route:** `/settings`
**Purpose:** Manage stored LLM API keys. Primary settings surface for Phase 1.
**Requirement refs:** AUTH-06, AUTH-07, D-06, D-07, D-08, D-09

### Layout

```
┌─────────────────┬────────────────────────────────────────┐
│                 │                                        │
│   CodeAudit     │  Settings                              │
│                 │                                        │
│   ─────────     │  API Keys                              │
│                 │  Manage your LLM provider API keys.    │
│   Dashboard     │                                        │
│   Audits        │  Anthropic                             │
│   Repos         │  ┌────────────────────────────────┐   │
│                 │  │  Personal           ✓ Valid     │   │
│                 │  │  sk-ant-•••••••••••••3xKf       │   │
│                 │  │                   [Edit] [Del]  │   │
│                 │  ├────────────────────────────────┤   │
│                 │  │  Work               ✓ Valid     │   │
│                 │  │  sk-ant-•••••••••••••9mPq       │   │
│                 │  │                   [Edit] [Del]  │   │
│                 │  └────────────────────────────────┘   │
│                 │  [+ Add Anthropic key]                 │
│                 │                                        │
│   ─────────     │  OpenAI                                │
│   Settings  ◄   │  ┌────────────────────────────────┐   │
│   ─────────     │  │  No keys added                 │   │
│   [AV] Anvar    │  └────────────────────────────────┘   │
│                 │  [+ Add OpenAI key]                    │
│                 │                                        │
│                 │  Gemini                                 │
│                 │  ┌────────────────────────────────┐   │
│                 │  │  No keys added                 │   │
│                 │  └────────────────────────────────┘   │
│                 │  [+ Add Gemini key]                    │
│                 │                                        │
│                 │  ─────────────────────────────────     │
│                 │                                        │
│                 │  GitHub                                 │
│                 │  Connected as @username                 │
│                 │  [Manage GitHub App installations →]   │
│                 │                                        │
│                 │  ─────────────────────────────────     │
│                 │                                        │
│                 │  Account                                │
│                 │  ┌──────────────────┐                  │
│                 │  │   Sign out       │                  │
│                 │  └──────────────────┘                  │
│                 │                                        │
└─────────────────┴────────────────────────────────────────┘
```

### Section: API Keys

Each provider has its own section, displayed in order: Anthropic, OpenAI, Gemini. All three always visible (D-08).

**Provider Section:**

| Element | Spec |
|---------|------|
| Provider heading | Card title style (16px medium), `--text-primary`. Provider icon (20x20) to the left. |
| Key card | Card component. Contains: label (card title style), validation status badge (green "Valid" or red "Invalid"), masked key (monospace, show first 7 and last 4 chars, mask middle with dots), action buttons. |
| Masked key format | `sk-ant-•••••••3xKf` — first 7 chars visible, middle masked, last 4 visible. Monospace font, `--text-secondary`. |
| Status badge | Small pill badge. Valid: `--success` bg with white text "Valid". Invalid: `--error` bg with white text "Invalid". |
| Edit button | Ghost button, icon-only (`pencil` Lucide icon), `--text-secondary`. Opens edit modal. |
| Delete button | Ghost button, icon-only (`trash-2` Lucide icon), `--text-secondary`. Hover: `--error` text. |
| "No keys added" | Caption style, `--text-tertiary`, inside an empty-state card. |
| Add key button | Text button with `+` icon, `--accent-primary` text. Opens the add key form inline (same interaction as onboarding step 2). |

**Add/Edit Key Form (Inline Expansion):**

Same pattern as onboarding step 2 key expansion. Fields: Label (text input), API Key (password input), Validate button. For edit: pre-populate label, key field shows masked value and must be re-entered to change.

**Delete Confirmation:**

| Element | Spec |
|---------|------|
| Trigger | Click delete icon on a key card |
| Modal | Small confirmation dialog (Shadcn AlertDialog), centered. |
| Title | "Delete API key?" |
| Body | "This will permanently delete the '[Label]' key for [Provider]. Any audits using this key will need a different key." |
| Actions | "Cancel" (ghost button) + "Delete" (destructive button, `--error` bg). |

### Section: GitHub

| Element | Spec |
|---------|------|
| Connected state | Body text: "Connected as @username" with GitHub avatar (20x20 inline). |
| Manage link | Text link: "Manage GitHub App installations" — opens GitHub App settings in new tab (external link icon). |

### Section: Account

| Element | Spec |
|---------|------|
| Sign out button | Secondary button (ghost variant with border). Full-width within section. |

---

## Screen 6: Repos (Placeholder)

**Route:** `/repos`
**Purpose:** Repository list page. In Phase 1, shows repos accessible via the GitHub App installation. Full audit launch UI arrives in Phase 2.

### Layout

```
┌─────────────────┬────────────────────────────────────────┐
│                 │                                        │
│   CodeAudit     │  Repositories                          │
│                 │                                        │
│   ─────────     │  ┌──────────────────────────────────┐ │
│                 │  │ 🔍  Search repos...              │ │
│   Dashboard     │  └──────────────────────────────────┘ │
│   Audits        │                                        │
│   Repos     ◄   │  ┌──────────────────────────────────┐ │
│                 │  │  org/repo-name       ★ 142  TS   │ │
│                 │  │  Short description...             │ │
│                 │  ├──────────────────────────────────┤ │
│                 │  │  org/another-repo     ★ 45  Py   │ │
│                 │  │  Another description...           │ │
│                 │  └──────────────────────────────────┘ │
│   ─────────     │                                        │
│   Settings      │  Showing repos from your GitHub App    │
│   ─────────     │  installation. [Manage access →]       │
│   [AV] Anvar    │                                        │
│                 │                                        │
└─────────────────┴────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Search input | Same as onboarding step 3. Debounced 300ms. |
| Repo list | Full-width cards. Each card: repo full name (card title), star count + primary language as small badges, description (body, `--text-secondary`, 1 line truncated). |
| Click behavior | In Phase 1, clicking a repo does nothing (no audit launch yet). In Phase 2, clicking opens audit configuration. |
| Footer note | Caption style, `--text-tertiary`. "Showing repos from your GitHub App installation." + "Manage access" external link to GitHub App settings. |
| Empty state | If no repos: card with message "No repositories accessible. Install the CodeAudit GitHub App on your repos to get started." + Primary button: "Install GitHub App" (links to GitHub App installation page). |
| Loading | Skeleton cards (3 rows, pulsing). |

---

## Screen 7: Audits (Placeholder)

**Route:** `/audits`
**Purpose:** Audit history list. In Phase 1, this is empty since no audits have been run yet.

### Layout

Same empty state pattern as Dashboard:

| Element | Spec |
|---------|------|
| Empty state card | Centered, max-width 480px. "No audits yet. Run your first audit from the Repos page." + Text link to `/repos`. |

---

## Interaction Patterns

### Navigation

- Sidebar navigation is always visible on authenticated pages.
- Active page is highlighted in sidebar.
- No breadcrumbs in Phase 1 (flat navigation — all pages are top-level).

### Loading States

- Page-level: Content area shows skeleton components matching the expected layout.
- Button-level: Spinner icon replaces existing icon, button disabled.
- Inline: Pulsing `--bg-tertiary` placeholders for cards/rows.

### Error States

- Form validation errors: Red text (`--error`) below the input field. Input border changes to `--error`.
- API errors: Toast notification (bottom-right) with error message. Red left border accent.
- Network errors: Banner at top of content area: "Connection lost. Retrying..." with a retry button.

### Transitions

- Step transitions in onboarding: Fade + slide-left (200ms ease-out). Shadcn animation utility.
- Page transitions: No animated transitions between routes. Instant render.
- Sidebar hover: `background-color` transition (150ms ease).

### Responsive Behavior

Phase 1 targets desktop only (min-width 1024px). No mobile layout. On viewports narrower than 1024px, the app remains functional but sidebar may overlap content — a responsive sidebar (collapsible) is deferred to a later phase.

---

## Requirement Coverage

| Requirement | Screen | Coverage |
|-------------|--------|----------|
| AUTH-01 (email/password sign-up) | -- | **REMOVED** per D-01: GitHub SSO only. AUTH-01 is dropped for Phase 1. |
| AUTH-02 (session persistence) | All authenticated screens | Session persists via Auth.js database session strategy. |
| AUTH-03 (GitHub SSO) | Landing Page, Auth callback | GitHub SSO is the sole sign-in method (D-01). |
| AUTH-04 (GitHub OAuth for repos) | Onboarding Step 3, Repos page | GitHub App installation during/after SSO flow (D-05). |
| AUTH-06 (store encrypted API keys) | Onboarding Step 2, Settings | Add key form with validation (D-06). Stored AES-256-GCM (D-09). |
| AUTH-07 (update/delete API keys) | Settings — API Keys | Edit and delete actions on key cards. |
| AUTH-08 (sign out) | Sidebar user area, Settings | Sign out from sidebar dropdown or Settings page. |
| D-02 (guided onboarding) | Onboarding (4 steps) | Welcome, Add key, Pick repo, Start audit. Skippable. |
| D-07 (multiple keys per provider) | Onboarding Step 2, Settings | "Add another" flow per provider. Labels distinguish keys. |
| D-08 (all providers shown equally) | Onboarding Step 2, Settings | All three providers always visible, same visual weight. |
| D-10 (minimal landing page) | Landing Page | Product name + tagline + sign-in button only. |
| D-11 (left sidebar nav) | App Shell | Dashboard, Audits, Repos, Settings. |
| D-12 (Linear-style aesthetic) | All screens | Dark mode default, design tokens, Inter font, clean/minimal. |

---

## Implementation Notes

### Tech Mapping

| UI Concept | Implementation |
|------------|----------------|
| Design tokens | Tailwind CSS custom theme in `tailwind.config.ts`. Map tokens to CSS variables. |
| Cards, buttons, inputs | Shadcn/ui components with theme overrides. |
| Icons | Lucide React (`lucide-react`). Provider logos as inline SVGs. |
| Step transitions | Shadcn animation utilities or `framer-motion` (optional — CSS transitions sufficient). |
| API key masking | Server-side: never return full key after storage. Return first 7 + last 4 chars only. |
| Search debounce | `useDeferredValue` (React 19) or `lodash.debounce` on the search input. |
| Session check (landing redirect) | Next.js middleware — check auth session, redirect authenticated users to `/dashboard`. |
| Onboarding redirect | After first GitHub SSO callback: check `onboardingCompleted` flag on user record. If false, redirect to `/onboarding`. |

### Accessibility Baseline

- All interactive elements must be keyboard-navigable (tab order, Enter/Space activation).
- Focus rings visible (2px `--accent-primary`).
- Color alone never conveys meaning — validation states use icons (checkmark, X) alongside color.
- Buttons and links have descriptive `aria-label` when icon-only.
- Form inputs have associated `<label>` elements.
- Sufficient contrast: `--text-primary` on `--bg-primary` passes WCAG AA (14.5:1). `--text-secondary` on `--bg-primary` passes AA (5.2:1).

---

*Phase: 01-foundation*
*UI Spec created: 2026-03-21*
