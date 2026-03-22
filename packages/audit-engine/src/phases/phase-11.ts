import fs from "node:fs/promises";
import path from "node:path";
import { getDb, audits } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import { generateText } from "ai";
import { markPhaseCompleted } from "../progress-emitter";
import { getModel } from "./shared";
import type { AuditRunContext, PhaseRunner } from "../orchestrator";

/* ──────────────────────────────────────────────────────────────────────────
 * Reference design system extracted from hand-crafted report templates.
 * These are injected into the LLM prompt so the generated HTML matches
 * the polished visual style of the reference reports.
 * ────────────────────────────────────────────────────────────────────────── */

const MANAGEMENT_REPORT_STYLE_GUIDE = `
You MUST follow this exact design system. Generate a COMPLETE self-contained HTML file with all CSS in a <style> tag in <head>. No external stylesheets, no external scripts.

## CSS DESIGN TOKENS (use as CSS custom properties in :root)

:root {
  --sidebar-bg: #1a1a2e;
  --card-bg: #16213e;
  --accent: #0f3460;
  --critical: #e94560;
  --warning: #f0a500;
  --good: #4ecca3;
  --text-primary: #e8eaf0;
  --text-secondary: #a0aabe;
  --border: rgba(255,255,255,0.07);
  --sidebar-width: 260px;
}

body background: #0d1117
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif

## LAYOUT STRUCTURE (must follow this exact layout)

1. **Fixed Sidebar** (left, 260px wide, full height):
   - sidebar-header: logo text ("Audit Report" uppercase 0.7rem), report title, date
   - Dark/Light theme toggle switch with moon/sun icon
   - Navigation links with emoji icons (📊 Executive Summary, 🚨 Critical Risks, 🚀 Team & Velocity, 💼 Investment Risk, ✅ Recommended Actions)
   - sidebar-footer with description text
   - Background: var(--sidebar-bg), border-right: 1px solid var(--border)

2. **Main Content** (margin-left: 260px):
   - **Page Header**: gradient background (linear-gradient(135deg, var(--accent) 0%, #1a1a2e 100%)), with:
     - Header badge (pill shape, e.g. "Confidential — Management Report")
     - Large title (2rem, font-weight 800)
     - Subtitle description
     - Meta row: Report Date, Overall Health, Report Type, Audit Mode
   - **Sections**: Each with section-label (uppercase, green, 0.68rem), section-title (1.6rem, 800 weight), section-desc

## COMPONENT PATTERNS

### Health Score Ring (SVG circle)
- 140x140px SVG with two circles (track + fill)
- Track: stroke rgba(255,255,255,0.08), fill circle uses stroke-dasharray/dashoffset
- Score number centered (2rem, font-weight 900), colored by health level
- Next to ring: score details with h3 title and description paragraph

### Traffic Light Table (.tl-table)
- Table with columns: Area, Status (colored dot), Score (pill badge), Details
- Status dots: 10px circles with glow (box-shadow: 0 0 8px)
  - .status-red (var(--critical)), .status-yellow (var(--warning)), .status-green (var(--good))
- Score pills: inline-block, padding 3px 10px, border-radius 12px, font-size 0.78rem, font-weight 700
  - .pill-red: bg rgba(233,69,96,0.15), color var(--critical), border 1px solid rgba(233,69,96,0.3)
  - .pill-yellow: bg rgba(240,165,0,0.15), color var(--warning)
  - .pill-green: bg rgba(78,204,163,0.15), color var(--good)

### Score Bars (CSS progress bars)
- Flex row: label + track (flex:1, 6px height, rounded) + score text
- Track background: rgba(255,255,255,0.08), fill with colored bar

### Risk Cards
- Card bg: var(--card-bg), border: 1px solid var(--border), border-radius: 12px
- Critical cards: border-left 3px solid var(--critical)
- High cards: border-left 3px solid var(--warning)
- Icon box (40x40, border-radius 10px, colored bg) + risk body
- Risk badge: uppercase, 0.65rem, letter-spacing 0.1em
  - .badge-critical: bg rgba(233,69,96,0.2), color var(--critical)
  - .badge-high: bg rgba(240,165,0,0.15), color var(--warning)

### Stat Cards
- Grid of 4 cards, each: bg var(--card-bg), border-radius 12px, padding 22px, centered
- Large value (2.2rem, 900 weight), label below (0.78rem uppercase)
- Hover: border-color rgba(79,204,163,0.25), transform translateY(-2px)

### Action Items (Recommended Actions)
- Numbered list: number in colored box (32x32, border-radius 8px, bg var(--accent), color var(--good))
- Each action: title, description, meta tags
- Tags: .tag-urgent (red bg), .tag-week (yellow bg), .tag-planned (green bg), .tag-security, .tag-quality

### Grid Layouts
- .grid-2: grid-template-columns 1fr 1fr, gap 20px
- .grid-3: 1fr 1fr 1fr
- .grid-4: repeat(4, 1fr), gap 16px

## LIGHT THEME SUPPORT
Include a [data-theme="light"] override block that changes:
- --sidebar-bg: #f0f2f5; --card-bg: #ffffff; --accent: #d0dff0
- --critical: #cf222e; --warning: #bf8700; --good: #1a7f5a
- --text-primary: #1f2328; --text-secondary: #656d76; --border: #d0d7de
- body background: #f6f8fa

## INTERACTIVE FEATURES (inline <script> at end of body)
- Theme toggle: toggles data-theme="light" on <html>, updates icon between 🌙 and ☀️, saves to localStorage
- Sidebar navigation: smooth scroll to sections, active link highlighting
- Mobile responsive: sidebar collapses on screens < 900px with hamburger toggle
- Fade-in animations: IntersectionObserver adds .visible class to .fade-in elements

## RESPONSIVE DESIGN
@media (max-width: 900px): sidebar hides, main margin-left: 0, grids collapse to 2 columns
@media (max-width: 560px): grids collapse to 1 column, header title shrinks

## CRITICAL RULES
- ALL styles must be in <style> tag, no inline style attributes except for dynamic values (like bar widths)
- Use the exact CSS class names and variable names shown above
- The page must be fully self-contained — no external dependencies
- Use emoji icons in navigation and section headers
- Include a disclaimer footer at the bottom
`;

const TECHNICAL_REPORT_STYLE_GUIDE = `
You MUST follow this exact design system. Generate a COMPLETE self-contained HTML file with all CSS in a <style> tag in <head>. No external stylesheets, no external scripts.

## CSS DESIGN TOKENS (use as CSS custom properties in :root)

:root {
  --bg: #0d1117;
  --card: #161b22;
  --border: #21262d;
  --critical: #f85149;
  --high: #ff7b72;
  --warning: #d29922;
  --good: #3fb950;
  --info: #58a6ff;
  --muted: #8b949e;
  --text: #e6edf3;
  --text-secondary: #c9d1d9;
  --sidebar-w: 260px;
  --mono: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
}

body background: var(--bg)
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px

## LAYOUT STRUCTURE

1. **Fixed Sidebar** (#sidebar, left, 260px):
   - Header: logo box (28x28, bg var(--info), rounded 6px, centered text), title + subtitle
   - Theme toggle: switch button with moon/sun icon
   - Navigation grouped by sections ("Overview", "Security", "Quality", "Process", "Actions")
   - Nav items: flex row with colored dot (8px circle) + label
     - Active: color var(--info), border-left 2px solid var(--info), bg rgba(88,166,255,.06)
   - Nav section labels: 10px, uppercase, letter-spacing .08em, color var(--muted)

2. **Main Content** (#main, margin-left: 260px, padding: 32px 40px, max-width: 1100px):
   - **Report Header**: badge (pill, red-tinted bg), h1 (28px, 700 weight), meta row with emoji spans
   - **Score Card**: overall health score with large number (56px, 800 weight), sub-scores in grid

## COMPONENT PATTERNS

### Score Card with Sub-Score Grid
- Container: bg var(--card), border 1px solid var(--border), border-radius 8px, padding 20px
- Sub-scores: grid of items, each with label (11px uppercase), large value (20px, 700 weight), progress bar (3px height)
- Color classes: .color-critical (var(--critical)), .color-high, .color-warning, .color-good, .color-info
- Bar fills: .fill-critical, .fill-high, .fill-warning, .fill-good

### Finding Summary Table
- Standard table: font-size 13px, th with bg var(--bg), 11px uppercase
- Severity badges: .badge-sev (inline-flex, 2px 8px padding, border-radius 12px, 11px, 700 weight, uppercase)
  - .sev-critical: bg rgba(248,81,73,.15), color var(--critical), border 1px solid rgba(248,81,73,.3)
  - .sev-high: bg rgba(255,123,114,.12), color var(--high)
  - .sev-medium: bg rgba(210,153,34,.12), color var(--warning)
  - .sev-low: bg rgba(63,185,80,.1), color var(--good)
  - .sev-info: bg rgba(88,166,255,.1), color var(--info)
- Progress bars: .prog (6px height, bg var(--border), border-radius 3px) with .prog-fill

### Expandable Finding Cards
- Container: bg var(--card), border 1px solid var(--border), border-radius 8px, overflow hidden
- Severity border: .sev-critical-border (border-left: 3px solid var(--critical)), etc.
- Header: flex row with severity badge + title + category tag + chevron (▶)
  - Clickable, hover bg rgba(255,255,255,.03)
- Body (hidden by default, toggled open): fields with label (11px uppercase muted) + value
  - Mono values: font-family var(--mono), 12px, bg var(--bg), padded, rounded
- Category tag: font-size 11px, bg var(--bg), border 1px solid var(--border), border-radius 4px

### Stat Cards Grid
- .card-grid: grid, auto-fill, minmax(220px, 1fr), gap 12px
- .stat-card: bg var(--card), border, rounded 8px, padding 16px
  - .stat-label: 11px, muted, uppercase
  - .stat-value: 24px, 700 weight
  - .stat-sub: 12px, muted

### Alert Boxes
- .alert: border-radius 6px, padding 12px 14px, flex row with icon + text
  - .alert-critical: bg rgba(248,81,73,.08), border rgba(248,81,73,.25)
  - .alert-high, .alert-warning, .alert-good with matching colors

### Code References
- code tag: font-family var(--mono), 12px, bg rgba(88,166,255,.1), padding 1px 5px, rounded 3px, color var(--info)
- .filepath: same mono font, bg rgba(88,166,255,.08), padded, rounded

### Remediation Lists
- Numbered with CSS counter, each step has a numbered circle (22px, bg var(--info), color var(--bg))
- Effort badges: .effort-low (green), .effort-medium (yellow), .effort-high (blue)

### Architecture Section
- Stack table with columns: Layer, Technology, Version, Notes
- Directory structure: mono font, colored by type (var(--info) for dirs, var(--muted) for descriptions)
- Strengths/Concerns grid: 2 columns, green checkmarks vs yellow warnings

## LIGHT THEME SUPPORT
Include [data-theme="light"] overrides:
- --bg: #f6f8fa; --card: #ffffff; --border: #d0d7de
- --text: #1f2328; --text-secondary: #656d76; --muted: #656d76
- --critical: #cf222e; --high: #bc4c00; --warning: #9a6700; --good: #1a7f37; --info: #0969da

## INTERACTIVE FEATURES (inline <script> at end of body)
- Theme toggle: toggles data-theme on <html>, saves to localStorage
- Sidebar toggle for mobile (hamburger button)
- Finding expand/collapse: clicking header toggles body visibility + chevron rotation
- Sidebar nav: clicking scrolls to section, updates active state

## RESPONSIVE DESIGN
@media (max-width: 768px): sidebar hides, main margin-left: 0, grids to 2 columns
@media (max-width: 480px): grids to 1 column

## PRINT STYLES
@media print: hide sidebar + toggle, margin-left 0, all finding bodies visible

## SCROLLBAR STYLING
Custom webkit scrollbar: 6px width, thumb bg var(--border), rounded 3px

## CRITICAL RULES
- Group findings by severity (Critical first, then High, Medium, Low, Info)
- Each finding must be an expandable card with chevron toggle
- Include file paths, descriptions, attack vectors (for security), and remediation steps
- Use emoji icons in section headers (🔴 Critical, 🟠 High, 🟡 Medium, etc.)
- The page must be fully self-contained — no external dependencies
- ALL styles in <style> tag, inline style only for dynamic values (bar widths, colors)
`;

export const phase11Runner: PhaseRunner = async (ctx, phaseNumber) => {
  const { auditId, auditOutputDir } = ctx;

  // Get aggregated findings written by phase 10
  const db = getDb();
  const audit = db.select().from(audits).where(eq(audits.id, auditId)).get();
  const findings = audit?.findings?.findings ?? [];
  const scoreValue = audit?.findings?.summary?.score ?? 0;
  const grade = audit?.findings?.summary?.grade ?? "F";
  const severityCounts = audit?.findings?.summary?.findings_count ?? {
    critical: 0, high: 0, medium: 0, low: 0, info: 0,
  };
  const executiveSummary = findings.slice(0, 5).map((f) => `- [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`).join("\n");

  const model = getModel(ctx, phaseNumber);

  // Call 1: Management/executive HTML report
  const { text: managementHtml } = await generateText({
    // Cast needed: providers return V1, ai@6 types expect V2/V3
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: model,
    prompt: `Generate a complete self-contained HTML page for a management/executive codebase audit report.

${MANAGEMENT_REPORT_STYLE_GUIDE}

## REPORT DATA

Health score: ${scoreValue}/100, grade: ${grade}
Severity counts: Critical=${severityCounts.critical}, High=${severityCounts.high}, Medium=${severityCounts.medium}, Low=${severityCounts.low}, Info=${severityCounts.info}

Top findings:
${executiveSummary}

<data_block source="audit_findings" trust="internal">
${JSON.stringify(findings.slice(0, 50), null, 2)}
</data_block>

## SECTIONS TO INCLUDE
1. Executive Summary — health score ring (SVG), traffic light table of audit areas, score bars
2. Critical Risks — risk cards for top critical/high findings with severity badges and descriptions
3. Team & Velocity — stat cards (contributors, commits, deployment frequency), bus factor visual if data available
4. Investment Risk — risk assessment matrix (2x2 grid of risk areas)
5. Recommended Actions — numbered action items with urgency tags and effort estimates

Return ONLY the HTML document. Start with <!DOCTYPE html>. Do NOT include any markdown or explanation.`,
    maxOutputTokens: 16384,
  });

  // Call 2: Technical HTML report (full findings table)
  const { text: technicalHtml } = await generateText({
    // Cast needed: providers return V1, ai@6 types expect V2/V3
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: model,
    prompt: `Generate a complete self-contained HTML page for a technical codebase audit report.

${TECHNICAL_REPORT_STYLE_GUIDE}

## REPORT DATA

Health score: ${scoreValue}/100, grade: ${grade}
Total findings: ${findings.length}
Severity counts: Critical=${severityCounts.critical}, High=${severityCounts.high}, Medium=${severityCounts.medium}, Low=${severityCounts.low}, Info=${severityCounts.info}

<data_block source="audit_findings" trust="internal">
${JSON.stringify(findings, null, 2)}
</data_block>

## SECTIONS TO INCLUDE
1. Report Header — badge, title, meta info (repo name, date, commit, auditor)
2. Overall Health Score — large score number + sub-score grid with progress bars (security, test coverage, docs, dependencies, CI/CD, architecture, code quality, team/process)
3. Finding Summary — table with severity counts and distribution progress bars
4. Findings grouped by severity — each severity level gets its own section:
   - 🔴 Critical Findings
   - 🟠 High Severity
   - 🟡 Medium Severity
   - 🟢 Low & Info
   Each finding is an expandable card with: severity badge, title, category tag, chevron toggle. Body contains: file paths (mono), description, attack vector (for security findings), remediation steps.
5. Remediation Roadmap — ordered list of fixes with effort estimates

Show ALL ${findings.length} findings. Group them by severity. Each finding MUST be an expandable card.

Return ONLY the HTML document. Start with <!DOCTYPE html>. Do NOT include any markdown or explanation.`,
    maxOutputTokens: 16384,
  });

  // Write both HTML files to auditOutputDir (EXEC-07: never write to repoPath)
  await fs.writeFile(path.join(auditOutputDir, "report-management.html"), managementHtml, "utf8");
  await fs.writeFile(path.join(auditOutputDir, "report-technical.html"), technicalHtml, "utf8");

  const outputMd = `# Phase ${phaseNumber} — HTML Reports Generated

Files written to audit output directory:
- report-management.html (executive/management view)
- report-technical.html (technical full findings view)

Total findings: ${findings.length}
Health score: ${scoreValue}/100 (${grade})
`;

  await markPhaseCompleted(auditId, phaseNumber, outputMd, [], 0);
};
