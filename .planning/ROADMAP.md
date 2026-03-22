# Roadmap: CodeAudit

## Milestones

- ✅ **v1.0 CodeAudit MVP** — Phases 1-4 (shipped 2026-03-22)
- 🚧 **v1.1 UI Redesign** — Phases 5-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 CodeAudit MVP (Phases 1-4) — SHIPPED 2026-03-22</summary>

- [x] Phase 1: App Shell & Configuration (3/3 plans) — completed 2026-03-22
- [x] Phase 2: Audit Engine (3/3 plans) — completed 2026-03-22
- [x] Phase 3: Results & Cost (2/2 plans) — completed 2026-03-22
- [x] Phase 4: History & Comparison (2/2 plans) — completed 2026-03-22

</details>

### 🚧 v1.1 UI Redesign (In Progress)

**Milestone Goal:** Delete all existing frontend code and rebuild every page and component from scratch using a new design system — dark/light themes, yellow accent, Geist/JetBrains Mono fonts, Linear aesthetic. Backend stays intact.

#### Phase 5: Foundation

- [ ] **Phase 5: Design System & Shared Components** - Delete old frontend code; establish design tokens, themes, fonts, animations, and all reusable components

#### Phase 6: Shell & Onboarding

- [ ] **Phase 6: Shell & Onboarding** - Build the app shell (sidebar + layout), setup wizard, and dashboard that users see on every visit

#### Phase 7: Audit Flows

- [ ] **Phase 7: Audit Flows** - Rebuild the New Audit configuration form and the live Audit Progress view

#### Phase 8: Data Views

- [ ] **Phase 8: Data Views** - Rebuild Results dashboard, History, Comparison, and API Keys settings pages

## Phase Details

### Phase 5: Design System & Shared Components
**Goal**: Clean slate established — old frontend deleted, new design tokens active, all shared components available for page work
**Depends on**: Phase 4 (v1.0 complete)
**Requirements**: CLEN-01, CLEN-02, DSYS-01, DSYS-02, DSYS-03, DSYS-04, DSYS-05, DSYS-06, COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, COMP-07, COMP-08
**Success Criteria** (what must be TRUE):
  1. App renders with dark theme by default (#0a0a0b background, #facc15 accent) and user can toggle to light theme; preference persists across page reloads
  2. Geist sans-serif and JetBrains Mono fonts are visibly applied throughout the app
  3. All 8 shared components (Badge, Button, Card, SelectCard, Input, HealthScore, SeverityBar, Modal) render correctly in isolation with their documented variants
  4. Fade-in, slide-in, and progress-pulse animations play on load/transition triggers
  5. No old page-level CSS conflicts remain — previous component/layout files are gone
**Plans**: 2 plans

Plans:
- [x] 05-01: Delete old frontend code and set up Tailwind CSS 4 design token system with dark/light themes
- [x] 05-02: Load Geist and JetBrains Mono fonts, configure animations, build all 8 shared components

### Phase 6: Shell & Onboarding
**Goal**: Every user session starts correctly — first-time users land on the setup wizard, returning users land on the dashboard inside the persistent sidebar layout
**Depends on**: Phase 5
**Requirements**: SETUP-01, SETUP-02, SETUP-03, SETUP-04, SIDE-01, SIDE-02, SIDE-03, DASH-01, DASH-02, DASH-03, DSYS-03
**Success Criteria** (what must be TRUE):
  1. A first-time user (no API key) sees the setup wizard with the welcome step and API key step; the floating theme toggle is present on both steps
  2. After setup, the user sees the dashboard inside the sidebar layout with no setup wizard reappearing
  3. The sidebar (252px) shows logo, all 4 nav items, and highlights the active page with accent styling
  4. The theme toggle at the sidebar bottom switches themes and the segmented control reflects the current state
  5. The dashboard shows 3 quick-action cards and a recent audits table with health score rings; "View all" navigates to History
**Plans**: 2 plans

Plans:
- [x] 06-01: Build setup wizard (welcome + API key steps, floating theme toggle, first-run guard)
- [x] 06-02: Build sidebar layout (persistent nav, theme toggle) and dashboard page (quick-action cards, recent audits table)

### Phase 7: Audit Flows
**Goal**: A user can fully configure and launch an audit, then watch it run with live progress — the two core interactive flows of the app
**Depends on**: Phase 6
**Requirements**: NAUD-01, NAUD-02, NAUD-03, NAUD-04, NAUD-05, NAUD-06, PROG-01, PROG-02, PROG-03, PROG-04, PROG-05, PROG-06
**Success Criteria** (what must be TRUE):
  1. User can enter a folder path (with validation icons and recent folder chips), pick audit type via 2x2 SelectCard grid, pick depth via 2 side-by-side SelectCards, and choose a provider/model
  2. The live cost estimate card updates as the user changes configuration options
  3. Clicking Start opens a confirmation modal with a summary grid and folder lock warning before any audit starts
  4. The progress view shows an animated gradient progress bar with pulse glow, live token/cost/elapsed stats, and a cancel button
  5. The expandable phase list shows all 13 phases with status icons, finding counts, duration, and per-phase cost
  6. When the audit completes, the progress bar turns green and a "View Results" button appears
**Plans**: 2 plans

Plans:
- [ ] 07-01: Build New Audit page (folder input, type/depth SelectCards, provider/model selectors, cost estimate, confirmation modal)
- [ ] 07-02: Build Audit Progress page (animated progress bar, live stats, cancel button, expandable phase list, completion state)

### Phase 8: Data Views
**Goal**: Users can fully explore audit results, manage audit history with bulk operations, compare two audits side-by-side, and manage API keys — all from pages that match the new design system
**Depends on**: Phase 7
**Requirements**: RSLT-01, RSLT-02, RSLT-03, RSLT-04, RSLT-05, RSLT-06, RSLT-07, HIST-01, HIST-02, HIST-03, HIST-04, HIST-05, HIST-06, CMPR-01, CMPR-02, CMPR-03, KEYS-01, KEYS-02, KEYS-03
**Success Criteria** (what must be TRUE):
  1. The results page shows a HealthScore ring, severity breakdown bars, cost summary with per-phase expansion, action buttons (Executive Report, Technical Report, Download All), and findings filterable by severity pill
  2. Finding cards show colored left border, severity badge, file path in mono/accent color, evidence snippet, and expandable remediation
  3. The history page groups audits by folder; user can select rows with yellow-accent checkboxes, bulk-delete with confirmation modal, and click Compare on any folder group with 2+ audits
  4. The comparison page shows the score delta banner (green/red with direction arrow), side-by-side health score + severity bars, and three labeled finding sections (Resolved, New, Persisted)
  5. The API Keys settings page lists keys with masked display, edit and delete buttons per row, and "Add New Key" opens an inline form matching the setup wizard pattern
**Plans**: TBD

Plans:
- [ ] 08-01: Build Results dashboard (health score ring, severity bars, cost summary, action buttons, findings list with filter pills and finding cards)
- [ ] 08-02: Build History page (folder grouping, checkbox selection, bulk-delete, compare button) and delete confirmation modal
- [ ] 08-03: Build Comparison page (delta banner, side-by-side cards, three finding sections) and API Keys settings page

## Progress

**Execution Order:** Phases execute in numeric order: 5 → 6 → 7 → 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. App Shell & Config | v1.0 | 3/3 | Complete | 2026-03-22 |
| 2. Audit Engine | v1.0 | 3/3 | Complete | 2026-03-22 |
| 3. Results & Cost | v1.0 | 2/2 | Complete | 2026-03-22 |
| 4. History & Comparison | v1.0 | 2/2 | Complete | 2026-03-22 |
| 5. Design System & Shared Components | v1.1 | 0/2 | Not started | - |
| 6. Shell & Onboarding | v1.1 | 0/2 | Not started | - |
| 7. Audit Flows | v1.1 | 0/2 | Not started | - |
| 8. Data Views | v1.1 | 0/3 | Not started | - |

---
*Full v1.0 details archived in `.planning/milestones/v1.0-ROADMAP.md`*
*v1.1 roadmap created: 2026-03-22*
