# Requirements: CodeAudit AI v1.1

**Defined:** 2026-03-22
**Core Value:** Anyone can run a thorough codebase audit on any local folder without CLI setup — just open the app, pick a folder, and run.

## v1.1 Requirements

Complete UI redesign — delete all existing page/component/layout code and rebuild from scratch using new design system. Backend (server actions, API routes, DB, audit engine) stays intact.

### Design System (DSYS)

- [x] **DSYS-01**: App uses dark theme by default with design tokens (#0a0a0b bg, #111113 surface, #facc15 accent, full token set from guide)
- [x] **DSYS-02**: App supports light theme with correct token mapping (#fafafa bg, #ffffff surface, #ca8a04 accent)
- [x] **DSYS-03**: User can toggle between dark/light themes (persisted preference)
- [x] **DSYS-04**: Tailwind CSS 4 config uses design tokens as CSS variables for both themes
- [x] **DSYS-05**: Geist (sans) and JetBrains Mono (mono) fonts are loaded and applied globally
- [x] **DSYS-06**: Animations work: fadeIn, slideIn, progressPulse, spin, stagger-1 through stagger-5

### Shared Components (COMP)

- [x] **COMP-01**: Badge component with color prop, pill shape, 11px text, colored border+bg
- [x] **COMP-02**: Button component with variants (primary/outline/destructive/ghost), sizes (sm/md/lg), icon support; primary uses dark text on yellow bg
- [x] **COMP-03**: Card component with 14px radius, surface bg, optional hover lift with accent shadow
- [x] **COMP-04**: SelectCard component with 2px border, selected state shows accent border + subtle bg + box-shadow
- [x] **COMP-05**: Input component with 10px radius, elevated bg, accent border on focus, mono option
- [x] **COMP-06**: HealthScore component (SVG ring, score number, letter grade, colored by threshold)
- [x] **COMP-07**: SeverityBar component (5 colored bars using sacred severity colors, proportional height)
- [x] **COMP-08**: Modal component (fixed overlay, backdrop blur, 18px radius, fade-in animation)

### Setup Wizard (SETUP)

- [x] **SETUP-01**: Welcome step shows centered layout with logo, heading, feature grid (2x2), "Get Started" button
- [x] **SETUP-02**: API Key step shows provider selector (3 cards), key input (password, mono), label input, "Add Key & Continue" button
- [x] **SETUP-03**: Floating theme toggle appears in top-right corner on both steps
- [x] **SETUP-04**: Setup wizard only appears on first run (no API key stored)

### Sidebar & Layout (SIDE)

- [x] **SIDE-01**: Persistent sidebar (252px) with logo, nav items (Dashboard, New Audit, History, API Keys), active state with accent styling
- [x] **SIDE-02**: Theme toggle at sidebar bottom (segmented sun/moon buttons, neutral colors)
- [x] **SIDE-03**: Root layout wraps all pages except setup with sidebar

### Dashboard (DASH)

- [x] **DASH-01**: 3 quick-action cards (New Audit, View History, Manage Keys) with hover lift + accent shadow
- [x] **DASH-02**: Recent audits table with folder (mono), date, type badge, depth badge, health score ring, edit button
- [x] **DASH-03**: "View all →" link navigates to history page

### New Audit (NAUD)

- [x] **NAUD-01**: Single-page form with folder input (mono, validation icons, recent folder chips)
- [x] **NAUD-02**: Audit type selection as 2x2 SelectCard grid (Full, Security, Team, Code Quality)
- [x] **NAUD-03**: Audit depth selection as 2 side-by-side SelectCards (Quick Scan, Deep Audit)
- [x] **NAUD-04**: Provider & Key dropdown + Model dropdown (Auto recommended + specific models)
- [x] **NAUD-05**: Live cost estimate card updates as user configures
- [x] **NAUD-06**: Start button opens confirmation modal with summary grid and folder lock warning

### Audit Progress (PROG)

- [x] **PROG-01**: Header shows folder name + type/depth badges
- [x] **PROG-02**: Animated progress bar with accent gradient and pulse glow
- [x] **PROG-03**: Live stats display (token count, running cost, elapsed time)
- [x] **PROG-04**: Cancel audit button (destructive variant)
- [x] **PROG-05**: Expandable phase list (13 rows with status icons, findings count, duration, cost)
- [x] **PROG-06**: On completion: green progress bar + "View Results" button

### Results Dashboard (RSLT)

- [x] **RSLT-01**: Header with folder name, badges, completion stats
- [x] **RSLT-02**: Health Score card with large SVG ring (110px), score, letter grade
- [x] **RSLT-03**: Severity Breakdown card with bar chart (5 bars, severity colors)
- [x] **RSLT-04**: Cost summary banner with per-phase expandable breakdown
- [x] **RSLT-05**: Action buttons: Executive Report, Technical Report, Download All
- [x] **RSLT-06**: Findings list with severity filter pills (All, Critical, High, Medium, Low, Info) and counts
- [x] **RSLT-07**: Finding cards with colored left border, severity badge, title, file path (mono, accent), evidence snippet, expandable remediation

### History (HIST)

- [x] **HIST-01**: Audits grouped by folder path
- [x] **HIST-02**: Selection system: checkbox per row (yellow accent), row highlights, "Select all" button
- [x] **HIST-03**: Bulk action bar appears when selected: count + "Deselect" + "Delete selected" (destructive)
- [x] **HIST-04**: Per-row: checkbox, date, type+depth badges, status, health score ring, trash icon
- [x] **HIST-05**: Delete confirmation modal with warning icon and "cannot be undone" message
- [x] **HIST-06**: "Compare" button on folder groups with 2+ audits

### Comparison (CMPR)

- [x] **CMPR-01**: Delta banner showing point difference (+N green/up or -N red/down)
- [x] **CMPR-02**: Side-by-side cards (previous vs latest) with health score ring + severity bars
- [x] **CMPR-03**: Three finding sections: Resolved (green, line-through), New (red), Persisted (gray)

### API Keys Settings (KEYS)

- [x] **KEYS-01**: Key list with provider icon, name, label, masked key (mono), created date
- [x] **KEYS-02**: Edit + Delete buttons per row
- [x] **KEYS-03**: "Add New Key" button opens inline form (same pattern as setup step 2)

### Cleanup (CLEN)

- [x] **CLEN-01**: All old page components, layout files, and client components deleted before new code is written
- [x] **CLEN-02**: Old CSS/styling that conflicts with new design system removed

## v2 Requirements

### Deferred from Active

- **MULTI-01**: Multi-repo cross-product analysis
- **DIST-01**: npm global install / Homebrew distribution
- **METR-01**: Model accuracy/quality metrics display

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend changes | v1.1 is frontend-only; server actions, API routes, DB, audit engine stay as-is |
| New functionality | No new features — same capabilities, new skin |
| Mobile responsive | Desktop browser only per v1.0 constraint |
| i18n / localization | English only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLEN-01 | Phase 5 | Complete |
| CLEN-02 | Phase 5 | Complete |
| DSYS-01 | Phase 5 | Complete |
| DSYS-02 | Phase 5 | Complete |
| DSYS-03 | Phase 5 | Complete |
| DSYS-04 | Phase 5 | Complete |
| DSYS-05 | Phase 5 | Complete |
| DSYS-06 | Phase 5 | Complete |
| COMP-01 | Phase 5 | Complete |
| COMP-02 | Phase 5 | Complete |
| COMP-03 | Phase 5 | Complete |
| COMP-04 | Phase 5 | Complete |
| COMP-05 | Phase 5 | Complete |
| COMP-06 | Phase 5 | Complete |
| COMP-07 | Phase 5 | Complete |
| COMP-08 | Phase 5 | Complete |
| SETUP-01 | Phase 6 | Complete |
| SETUP-02 | Phase 6 | Complete |
| SETUP-03 | Phase 6 | Complete |
| SETUP-04 | Phase 6 | Complete |
| SIDE-01 | Phase 6 | Complete |
| SIDE-02 | Phase 6 | Complete |
| SIDE-03 | Phase 6 | Complete |
| DASH-01 | Phase 6 | Complete |
| DASH-02 | Phase 6 | Complete |
| DASH-03 | Phase 6 | Complete |
| NAUD-01 | Phase 7 | Complete |
| NAUD-02 | Phase 7 | Complete |
| NAUD-03 | Phase 7 | Complete |
| NAUD-04 | Phase 7 | Complete |
| NAUD-05 | Phase 7 | Complete |
| NAUD-06 | Phase 7 | Complete |
| PROG-01 | Phase 7 | Complete |
| PROG-02 | Phase 7 | Complete |
| PROG-03 | Phase 7 | Complete |
| PROG-04 | Phase 7 | Complete |
| PROG-05 | Phase 7 | Complete |
| PROG-06 | Phase 7 | Complete |
| RSLT-01 | Phase 8 | Complete |
| RSLT-02 | Phase 8 | Complete |
| RSLT-03 | Phase 8 | Complete |
| RSLT-04 | Phase 8 | Complete |
| RSLT-05 | Phase 8 | Complete |
| RSLT-06 | Phase 8 | Complete |
| RSLT-07 | Phase 8 | Complete |
| HIST-01 | Phase 8 | Complete |
| HIST-02 | Phase 8 | Complete |
| HIST-03 | Phase 8 | Complete |
| HIST-04 | Phase 8 | Complete |
| HIST-05 | Phase 8 | Complete |
| HIST-06 | Phase 8 | Complete |
| CMPR-01 | Phase 8 | Complete |
| CMPR-02 | Phase 8 | Complete |
| CMPR-03 | Phase 8 | Complete |
| KEYS-01 | Phase 8 | Complete |
| KEYS-02 | Phase 8 | Complete |
| KEYS-03 | Phase 8 | Complete |

**Coverage:**
- v1.1 requirements: 57 total
- Mapped to phases: 57
- Unmapped: 0

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 — traceability complete after roadmap creation*
