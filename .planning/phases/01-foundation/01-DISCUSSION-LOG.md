# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-21
**Phase:** 01-foundation
**Areas discussed:** Sign-up flow, API key experience, Landing & first run

---

## Sign-up Flow

### Account Creation

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub SSO only | One-click sign-up via GitHub — simplest, and they need GitHub anyway | ✓ |
| Email + GitHub SSO | Email/password as primary, GitHub SSO as alternative | |
| GitHub first, email later | Sign up via GitHub (required), optionally add email/password for backup | |

**User's choice:** GitHub SSO only
**Notes:** Since GitHub is required for repo access, separate email/password adds unnecessary complexity.

### Post-Sign-up Onboarding

| Option | Description | Selected |
|--------|-------------|----------|
| Add API key first | Prompt to add an LLM API key immediately | |
| Show dashboard | Land on empty dashboard, prompt for API key when they try to audit | |
| Guided setup | Step-by-step: Welcome → Add API key → Pick first repo → Start audit | ✓ |

**User's choice:** Guided setup

### GitHub Repo Access Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All repos at once | GitHub App installed on account/org — all repos accessible | |
| Per-repo selection | User picks which repos the app can see during install | ✓ |
| You decide | Claude picks best UX | |

**User's choice:** Per-repo selection

### Token Revocation Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Fail gracefully | Stop audit, save progress, show error asking to reconnect | |
| You decide | Claude handles — just don't lose data | ✓ |

**User's choice:** You decide (Claude's discretion)

---

## API Key Experience

### Key Entry Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Paste and validate | App makes test API call to verify key works before saving | ✓ |
| Paste and trust | Saved immediately, validated only when audit starts | |
| You decide | Claude picks | |

**User's choice:** Paste and validate

### Multiple Keys Per Provider

| Option | Description | Selected |
|--------|-------------|----------|
| One key per provider | Simpler — one per provider | |
| Multiple per provider | Users label keys and pick per audit | ✓ |
| You decide | Claude picks | |

**User's choice:** Multiple per provider

### Provider Presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Equal treatment | All three shown side by side, no preference | ✓ |
| Recommend Anthropic | Anthropic highlighted as recommended | |
| You decide | Claude picks | |

**User's choice:** Equal treatment

---

## Landing & First Run

### Landing Page

| Option | Description | Selected |
|--------|-------------|----------|
| Marketing page | Hero section, features, pricing — full landing | |
| Minimal login | Product name, one-liner, Sign in with GitHub button | ✓ |
| You decide | Claude picks | |

**User's choice:** Minimal login

### Navigation Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar nav | Left sidebar: Dashboard, Audits, Repos, Settings | ✓ |
| Top nav | Horizontal bar at top | |
| You decide | Claude picks | |

**User's choice:** Sidebar nav

### Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| Linear-style | Clean, minimal, dark mode default, sharp typography | ✓ |
| GitHub-style | Familiar to developers, light mode, functional | |
| You decide | Claude picks modern dev-tool aesthetic | |
| Let me describe | Custom reference | |

**User's choice:** Linear-style

---

## Claude's Discretion

- Token revocation / GitHub access revocation error handling
- Loading states and skeleton screens
- Onboarding step transitions and animations
- Settings page layout
- Database schema details

## Deferred Ideas

None — discussion stayed within phase scope
