---
phase: 05-foundation
plan: 02
subsystem: ui-components
tags: [components, badge, button, card, select-card, input, health-score, severity-bar, modal, tailwind, design-tokens]
dependency_graph:
  requires: [05-01]
  provides: [COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, COMP-07, COMP-08]
  affects: [06-pages, 07-pages, 08-pages]
tech_stack:
  added: [class-variance-authority, @radix-ui/react-slot]
  patterns: [cva variants, forwardRef, CSS variable inline styles, Tailwind conditional classes via cn()]
key_files:
  created:
    - apps/web/components/ui/badge.tsx
    - apps/web/components/ui/button.tsx
    - apps/web/components/ui/card.tsx
    - apps/web/components/ui/select-card.tsx
    - apps/web/components/ui/input.tsx
    - apps/web/components/ui/health-score.tsx
    - apps/web/components/ui/severity-bar.tsx
    - apps/web/components/ui/modal.tsx
  modified: []
decisions:
  - "Badge uses inline style for dynamic color prop; falls back to Tailwind accent classes when no color provided"
  - "Button uses cva (class-variance-authority) for variant/size permutations with Slot support for asChild"
  - "Card uses Tailwind hover: pseudo-classes instead of React state hover for better performance"
  - "Modal uses simple div-based implementation (not Radix Dialog) per prototype spec — simpler and matches prototype exactly"
  - "SeverityBar uses static SEVERITY_CONFIG array with CSS variable references for sacred colors"
  - "HealthScore uses inline style for SVG stroke colors since they reference dynamically-computed CSS variables"
metrics:
  duration: "8 minutes"
  completed: "2026-03-23"
  tasks_completed: 2
  files_created: 8
  files_modified: 0
---

# Phase 05 Plan 02: Shared UI Components Summary

8 shared UI components built with Tailwind CSS 4 design tokens — the complete building block library for all pages in Phases 6-8.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Badge, Button, Card, SelectCard, Input | ef61771 |
| 2 | HealthScore, SeverityBar, Modal | 11a0fec |

## What Was Built

### Badge (COMP-01)
- Pill shape with `rounded-[--radius-badge]` (6px)
- 11px text, font-semibold, tracking-wide
- Dynamic color via inline `style` (background at 18% opacity, border at 30% opacity)
- Falls back to accent theme colors when no color prop

### Button (COMP-02)
- `cva` pattern with 4 variants: primary, outline, destructive, ghost
- Primary: `bg-accent text-[#0a0a0b]` — dark text on yellow is non-negotiable
- 3 sizes: sm (h-9), md (h-10), lg (h-11)
- `@radix-ui/react-slot` for `asChild` composition
- `buttonVariants` exported for external use

### Card (COMP-03)
- `bg-surface border border-border rounded-[--radius-card]` (14px)
- Optional hover lift: `-translate-y-0.5 border-accent/40 shadow-[0_8px_24px_var(--accent-subtle)]`
- Cursor pointer when `onClick` provided
- Pure Tailwind hover pseudo-classes, no React state

### SelectCard (COMP-04)
- `border-2` base border, `rounded-xl`
- Selected: `border-accent bg-accent-subtle shadow-[0_0_0_1px_var(--accent),0_4px_12px_rgba(250,204,21,0.12)]`
- Unselected: `border-border bg-surface`

### Input (COMP-05)
- `bg-elevated border border-border rounded-[--radius-button]` (10px radius)
- `focus:border-accent` for focus state
- `font-mono` conditional class when `mono=true`
- `React.forwardRef` for ref forwarding

### HealthScore (COMP-06)
- Inline SVG ring with background circle + progress arc
- `strokeDasharray`/`strokeDashoffset` for ring fill proportion
- Color thresholds: >70 = `var(--success)`, >40 = `var(--warning)`, else `var(--destructive)`
- Size lg: 110px diameter, sz sm: 56px diameter
- Letter grade (A/B/C/D/F) shown in lg size only
- Rotate -90deg so arc starts from top

### SeverityBar (COMP-07)
- 5 bars using `var(--severity-critical/high/medium/low/info)` CSS variables
- Proportional height: `Math.max((val / maxVal) * 80, 4)` px minimum 4px
- Inline styles for dynamic bar heights and colors
- Labels: CRIT, HIGH, MED, LOW, INFO

### Modal (COMP-08)
- `fixed inset-0 z-[1000]` overlay
- `backdrop-blur-[8px]` on backdrop div
- `rounded-[--radius-modal]` (18px) on content panel
- `animate-fade-in` entry animation
- Escape key handler via `useEffect`
- Body scroll lock via `document.body.style.overflow = "hidden"`

## Build Status

`npx next build` passes with all 8 components. Routes compiled successfully.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

All 8 component files verified present and correctly exported.
All design tokens verified in use (radius-badge, radius-button, radius-card, radius-modal, severity colors, success/warning/destructive).
Build passes.
