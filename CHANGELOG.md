# Changelog

All notable changes to CodeAudit will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## 2026-03-21 — Project Scaffolding (Phase 1, Plan 01-01)

### Added

- **Monorepo structure** with pnpm workspaces (`apps/*`, `packages/*`, `worker`)
- **Next.js 16 app** at `apps/web` with App Router, React 19, TypeScript 5.x
- **Dark mode default** (Linear-style aesthetic) with Geist font, CSS variables, custom scrollbar
- **Landing page** — product name, one-liner, "Sign in with GitHub" button (non-functional at this stage)
- **Dashboard layout** with left sidebar navigation (Dashboard, Audits, Repos, Settings)
- **Drizzle ORM schema** at `packages/db` with Auth.js-compatible tables (users, accounts, sessions, verification_tokens)
- **api_keys table** with AES-256-GCM encrypted storage design (encrypted_key + iv columns)
- **github_installations table** for GitHub App installation tracking
- **audits table** with structured JSONB findings column and typed `AuditFindings` schema
- **audit_phases table** for per-phase output and token tracking
- **`AuditFinding` / `AuditFindings` TypeScript types** defined in Phase 1 for Phase 5 comparison feature
- **Stub packages**: `@codeaudit/audit-engine`, `@codeaudit/llm-adapter`, `@codeaudit/repo-sandbox`
- **Worker stub** at `worker/` with BullMQ + ioredis dependencies
- **Docker Compose** with PostgreSQL 16 + Redis 7, persistent volumes, health checks
- **Root dev scripts**: `dev`, `dev:db`, `dev:web`, `db:generate`, `db:migrate`
- **Vitest config** for cross-package unit testing
- **Prettier + ESLint** with consistent formatting rules
- **`.env.example`** documenting all required environment variables
