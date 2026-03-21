---
phase: 01-foundation
plan: "02"
subsystem: auth
tags: [next-auth, auth-js, github-oauth, drizzle, session, middleware, onboarding]

# Dependency graph
requires:
  - phase: 01-foundation
    plan: "01"
    provides: Next.js 16 app, Drizzle schema with Auth.js tables, Docker Compose
provides:
  - Auth.js v5 configured with GitHub OAuth + Drizzle adapter
  - Database session strategy (access_token stays server-side)
  - Sign-in page at /sign-in with GitHub SSO button and OAuth error handling
  - Session middleware protecting /dashboard/* and /onboarding/*
  - getRequiredSession() / getRequiredUser() utilities in lib/auth.ts
  - Sign-out action and SignOutButton component
  - Guided 4-step onboarding flow (steps 2-3 are placeholder UI)
  - has_completed_onboarding flag on users table
  - Dashboard shell with sidebar navigation, GitHub avatar, sign-out
affects: [01-03, 01-04, 02-01]

# Tech tracking
tech-stack:
  added:
    - next-auth@beta (Auth.js v5) — GitHub OAuth provider, database session strategy
    - "@auth/drizzle-adapter" — connects Auth.js to Drizzle schema
  patterns:
    - Database session strategy (not JWT) — GitHub access_token stays in accounts table server-side only
    - Server actions for form submissions (sign-in, sign-out, onboarding completion)
    - getRequiredSession() pattern for protected Server Components — redirects to /sign-in if unauthenticated
    - Route group (auth) for unauthenticated pages, (dashboard) for authenticated pages

key-files:
  created:
    - apps/web/auth.ts — Auth.js v5 config with GitHub provider, DrizzleAdapter, session callbacks
    - apps/web/middleware.ts — Route protection middleware, redirects unauthenticated users
    - apps/web/lib/auth.ts — getRequiredSession(), getOptionalSession(), getRequiredUser() utilities
    - apps/web/types/next-auth.d.ts — Session type extension with user.id
    - apps/web/app/api/auth/[...nextauth]/route.ts — Auth.js route handler
    - apps/web/app/(auth)/sign-in/page.tsx — Sign-in page with GitHub SSO button
    - apps/web/app/actions/auth.ts — signOutAction() server action
    - apps/web/app/actions/onboarding.ts — completeOnboardingAction(), skipOnboardingAction()
    - apps/web/components/sign-out-button.tsx — Client component with loading state
    - apps/web/components/onboarding-progress.tsx — Step progress indicator
    - apps/web/components/nav/sidebar.tsx — Sidebar with nav links, user info, sign-out
    - apps/web/app/(dashboard)/onboarding/page.tsx — Step 1: Welcome
    - apps/web/app/(dashboard)/onboarding/api-key/page.tsx — Step 2: API Key (placeholder)
    - apps/web/app/(dashboard)/onboarding/repo/page.tsx — Step 3: Repo (placeholder)
    - apps/web/app/(dashboard)/onboarding/ready/page.tsx — Step 4: Ready/complete
  modified:
    - packages/db/src/schema.ts — Added has_completed_onboarding boolean column to users table
    - apps/web/app/(dashboard)/layout.tsx — Replaced placeholder with real session-backed layout
    - apps/web/app/(dashboard)/dashboard/page.tsx — Onboarding redirect check + quick-action cards
    - apps/web/app/page.tsx — Auth check redirects signed-in users to /dashboard
    - apps/web/next.config.ts — Added GitHub avatar image remote pattern

key-decisions:
  - "Database session strategy confirmed — GitHub access_token stays in accounts table, never in client-side cookie or JWT"
  - "Server actions used for sign-in and sign-out — avoids client-side auth token exposure"
  - "Onboarding steps 2 and 3 (API Key, Repo) are placeholder UI — wired to real functionality in Plan 01-03"
  - "has_completed_onboarding flag checked on dashboard load to redirect first-time users"

patterns-established:
  - "Protected Server Components: import getRequiredSession() or getRequiredUser() from lib/auth.ts — auto-redirects on auth failure"
  - "Sign-out: use signOutAction() server action from app/actions/auth.ts via SignOutButton component"
  - "Auth errors: Auth.js error codes mapped to user-friendly messages in sign-in page"

requirements-completed: [AUTH-02, AUTH-08, AUTH-03]

# Metrics
duration: 6min
completed: 2026-03-22
---

# Phase 01 Plan 02: Auth Flows Summary

**GitHub SSO with Auth.js v5 database sessions, 4-step onboarding flow, and dashboard shell with sidebar navigation**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-21T19:04:36Z
- **Completed:** 2026-03-21T19:10:51Z
- **Tasks:** 7 completed
- **Files modified:** 20 (15 created, 5 modified)

## Accomplishments

- Auth.js v5 configured with GitHub OAuth provider and Drizzle adapter using database session strategy — GitHub access_token stays in the `accounts` table, never exposed client-side
- Full auth flow implemented: sign-in page, OAuth callback, session middleware, session utilities, sign-out action
- Guided 4-step onboarding flow for first-time users with skip functionality and completion flag tracking
- Dashboard shell with persistent sidebar navigation, active state indicators, GitHub avatar/name display, and sign-out button

## Task Commits

Each task was committed atomically:

1. **Task 1: Install and configure Auth.js v5** — `9829fe7` (feat)
2. **Task 2: Create auth API routes and proxy configuration** — `aea8975` (feat)
3. **Task 3: Build the sign-in page** — `c4e9018` (feat)
4. **Task 4: Implement session middleware for protected routes** — `a8b4abf` (feat)
5. **Task 5: Build sign-out functionality** — `c216578` (feat)
6. **Task 6: Build the guided onboarding flow** — `bfad38b` (feat)
7. **Task 7: Build the authenticated dashboard shell** — `fd0856b` (feat)
8. **Middleware fix:** — `be5b821` (fix)

## Files Created/Modified

- `apps/web/auth.ts` — Auth.js v5 config: GitHub provider, DrizzleAdapter, database session strategy, signIn/session callbacks
- `apps/web/middleware.ts` — Route protection: guards /dashboard and /onboarding, redirects unauthenticated to /sign-in
- `apps/web/lib/auth.ts` — getRequiredSession(), getOptionalSession(), getRequiredUser() for Server Components
- `apps/web/types/next-auth.d.ts` — NextAuth Session type extended with typed user.id
- `apps/web/app/api/auth/[...nextauth]/route.ts` — Auth.js GET/POST handler
- `apps/web/app/(auth)/sign-in/page.tsx` — Sign-in page with GitHub button and OAuth error message mapping
- `apps/web/app/actions/auth.ts` — signOutAction() server action
- `apps/web/app/actions/onboarding.ts` — completeOnboardingAction(), skipOnboardingAction()
- `apps/web/components/sign-out-button.tsx` — Client component with loading/error state
- `apps/web/components/nav/sidebar.tsx` — Full sidebar: logo, nav links with active state, user avatar, sign-out
- `apps/web/components/onboarding-progress.tsx` — Step progress indicator
- `apps/web/app/(dashboard)/onboarding/page.tsx` — Step 1: Welcome (with redirect if already completed)
- `apps/web/app/(dashboard)/onboarding/api-key/page.tsx` — Step 2: API Key placeholder
- `apps/web/app/(dashboard)/onboarding/repo/page.tsx` — Step 3: Repo placeholder
- `apps/web/app/(dashboard)/onboarding/ready/page.tsx` — Step 4: Calls completeOnboardingAction
- `packages/db/src/schema.ts` — Added has_completed_onboarding boolean to users table
- `apps/web/app/(dashboard)/layout.tsx` — Session-backed layout using Sidebar component
- `apps/web/app/(dashboard)/dashboard/page.tsx` — Onboarding redirect + quick-action cards + empty audits state
- `apps/web/app/page.tsx` — Landing page redirects authenticated users to /dashboard
- `apps/web/next.config.ts` — GitHub avatar domain in images.remotePatterns

## Decisions Made

- Database session strategy confirmed: GitHub `access_token` stays in the `accounts` table via DrizzleAdapter, never in a client-side JWT or cookie. This avoids cookie size limits and token exposure.
- Server actions used for sign-in (via Auth.js `signIn()`) and sign-out to avoid client-side auth token handling.
- Onboarding steps 2 (API Key) and 3 (Repo) are intentionally placeholder UI — they show a "coming soon" panel and will be wired to real functionality in Plan 01-03.
- `has_completed_onboarding` is checked on dashboard page load (server-side redirect) rather than in middleware to keep middleware lightweight.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Auth.js middleware TypeScript types**
- **Found during:** Task 2 (middleware creation)
- **Issue:** Initial middleware used manual type casting `req as { auth: unknown }` which is unnecessary — Auth.js v5 types `request.auth` correctly when wrapping with `auth()`
- **Fix:** Removed manual type cast, used `request.auth` directly from the Auth.js-typed request
- **Files modified:** `apps/web/middleware.ts`
- **Committed in:** `be5b821` (separate fix commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor type safety improvement. No scope creep.

## Known Stubs

- `apps/web/app/(dashboard)/onboarding/api-key/page.tsx` — Shows "API key management UI is coming" placeholder. Intentional per plan spec — wired to real functionality in Plan 01-03.
- `apps/web/app/(dashboard)/onboarding/repo/page.tsx` — Shows "GitHub App installation and repository selection are coming" placeholder. Intentional per plan spec — wired in Plan 01-03.
- `apps/web/app/(dashboard)/dashboard/page.tsx` — "Recent audits" section shows empty state. Intentional — audit history requires the audit engine (Plan 02+).

These stubs do NOT prevent the plan's goal: users can sign in, maintain sessions, sign out, and complete the onboarding flow. The placeholder UI correctly guides users forward.

## Issues Encountered

None — plan executed as written. TypeScript types for the Auth.js middleware were refined as a minor auto-fix.

## User Setup Required

Before testing the auth flow, the following environment variables must be set in `apps/web/.env.local`:

```
AUTH_SECRET=         # Generate with: npx auth secret
AUTH_GITHUB_ID=      # GitHub OAuth App client ID
AUTH_GITHUB_SECRET=  # GitHub OAuth App client secret
DATABASE_URL=        # Neon/Postgres connection string
```

The GitHub OAuth App must be configured with callback URL: `http://localhost:3000/api/auth/callback/github`

## Next Phase Readiness

- Auth foundation complete — Plan 01-03 can build API key management (wires the onboarding step 2) and GitHub App installation (wires step 3)
- `getRequiredSession()` and `getRequiredUser()` available for all future server components
- `has_completed_onboarding` flag tracks onboarding state — no changes needed to support future onboarding additions
- Sidebar navigation stub links to /dashboard/audits, /dashboard/repos, /dashboard/settings — these routes exist as placeholders from Plan 01-01

---
*Phase: 01-foundation*
*Completed: 2026-03-22*

## Self-Check: PASSED

All key files verified present on disk. All task commits verified in git history.

| Check | Result |
|-------|--------|
| apps/web/auth.ts | FOUND |
| apps/web/middleware.ts | FOUND |
| apps/web/lib/auth.ts | FOUND |
| apps/web/app/api/auth/[...nextauth]/route.ts | FOUND |
| apps/web/app/(auth)/sign-in/page.tsx | FOUND |
| apps/web/components/nav/sidebar.tsx | FOUND |
| apps/web/app/(dashboard)/onboarding/ready/page.tsx | FOUND |
| packages/db/src/schema.ts | FOUND |
| Commit 9829fe7 (Task 1) | FOUND |
| Commit aea8975 (Task 2) | FOUND |
| Commit c4e9018 (Task 3) | FOUND |
| Commit a8b4abf (Task 4) | FOUND |
| Commit c216578 (Task 5) | FOUND |
| Commit bfad38b (Task 6) | FOUND |
| Commit fd0856b (Task 7) | FOUND |
| Commit be5b821 (fix) | FOUND |
