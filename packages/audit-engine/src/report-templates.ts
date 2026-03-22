/**
 * Deterministic HTML report generators — no LLM calls.
 *
 * Two self-contained HTML reports:
 *   1. Management report  — executive summary for stakeholders
 *   2. Technical report    — full findings for engineers
 */

import type { AuditFinding, FindingsSeverity } from "@codeaudit-ai/db";

// ────────────────────────────────────────────────────────────
// Public interface
// ────────────────────────────────────────────────────────────

export type ReportData = {
  repoName: string;
  date: string;
  score: number;
  grade: string;
  severityCounts: Record<FindingsSeverity, number>;
  findings: AuditFinding[];
  auditType: string;
  depth: string;
};

export function generateManagementReport(data: ReportData): string {
  const { repoName, date, score, grade, severityCounts, findings, auditType, depth } = data;
  const totalFindings = Object.values(severityCounts).reduce((a, b) => a + b, 0);
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  const topFindings = findings.slice(0, 15);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(repoName)} — Management Audit Report</title>
<style>
${SHARED_CSS}
${MANAGEMENT_CSS}
</style>
</head>
<body>

<header class="page-header">
  <div class="header-top">
    <div>
      <div class="header-badge">${esc(auditType)} audit · ${esc(depth)}</div>
      <h1 class="header-title">Management Audit Report</h1>
      <p class="header-subtitle">${esc(repoName)}</p>
    </div>
    <div class="header-right">
      <div class="theme-toggle">
        <span class="theme-icon" id="theme-icon">☀</span>
        <button class="theme-switch" id="theme-switch" role="switch" aria-checked="false"
                aria-label="Toggle light mode" onclick="toggleTheme()"></button>
        <span class="theme-icon" id="theme-icon-moon">☾</span>
      </div>
    </div>
  </div>
  <div class="header-meta">
    <div class="meta-item"><span class="meta-label">Date</span><span class="meta-value">${esc(date)}</span></div>
    <div class="meta-item"><span class="meta-label">Score</span><span class="meta-value">${score}/100 (${esc(grade)})</span></div>
    <div class="meta-item"><span class="meta-label">Findings</span><span class="meta-value">${totalFindings}</span></div>
  </div>
</header>

<!-- Health Score -->
<section class="section">
  <div class="section-label">Health Score</div>
  <div class="health-score-wrap">
    <div class="score-ring">
      <svg viewBox="0 0 140 140">
        <circle class="track" cx="70" cy="70" r="60"/>
        <circle class="fill" cx="70" cy="70" r="60"
          style="stroke:${scoreColor};stroke-dashoffset:calc(376.99 - (376.99 * ${score / 100}))"/>
      </svg>
      <div class="score-center">
        <div class="score-number" style="color:${scoreColor}">${score}</div>
        <div class="score-grade" style="color:${scoreColor}">${esc(grade)}</div>
      </div>
    </div>
    <div class="score-details">
      <h3 style="color:${scoreColor}">${scoreLabel}</h3>
      <p>${getScoreDescription(score)}</p>
    </div>
  </div>
</section>

<!-- Severity Overview -->
<section class="section">
  <div class="section-label">Severity Overview</div>
  <h2 class="section-title">Finding Distribution</h2>
  <div class="severity-pills">
${SEVERITY_ORDER.map((sev) => {
  const count = severityCounts[sev] ?? 0;
  return `    <span class="sev-pill sev-${sev}">${sev.toUpperCase()} <strong>${count}</strong></span>`;
}).join("\n")}
  </div>
  ${totalFindings > 0 ? `
  <table class="severity-table">
    <thead><tr><th>Severity</th><th>Count</th><th>Distribution</th></tr></thead>
    <tbody>
${SEVERITY_ORDER.map((sev) => {
  const count = severityCounts[sev] ?? 0;
  const pct = totalFindings > 0 ? ((count / totalFindings) * 100).toFixed(1) : "0";
  return `      <tr>
        <td><span class="sev-badge sev-${sev}">${sev}</span></td>
        <td class="count-cell" style="color:var(--${sevColorVar(sev)})">${count}</td>
        <td><div class="prog"><div class="prog-fill" style="width:${pct}%;background:var(--${sevColorVar(sev)})"></div></div></td>
      </tr>`;
}).join("\n")}
    </tbody>
  </table>` : "<p class=\"empty-note\">No findings recorded.</p>"}
</section>

<!-- Top Findings -->
<section class="section">
  <div class="section-label">Key Findings</div>
  <h2 class="section-title">Top Issues Requiring Attention</h2>
  ${topFindings.length === 0 ? "<p class=\"empty-note\">No findings to display.</p>" : ""}
  <div class="findings-list">
${topFindings.map((f) => `
    <div class="finding-card sev-border-${f.severity}">
      <div class="finding-header-row">
        <span class="sev-badge sev-${f.severity}">${f.severity}</span>
        <span class="finding-title">${esc(f.title)}</span>
        ${f.category ? `<span class="finding-cat">${esc(f.category)}</span>` : ""}
      </div>
      <p class="finding-desc">${esc(f.description)}</p>
      ${f.recommendation ? `<div class="finding-rec"><strong>Recommendation:</strong> ${esc(f.recommendation)}</div>` : ""}
    </div>`).join("\n")}
  </div>
</section>

<!-- Summary -->
<section class="section">
  <div class="section-label">Summary</div>
  <h2 class="section-title">Audit Summary</h2>
  <div class="summary-card">
    <p>This <strong>${esc(auditType)}</strong> audit (${esc(depth)} depth) of <strong>${esc(repoName)}</strong> identified
    <strong>${totalFindings}</strong> findings across ${SEVERITY_ORDER.filter((s) => (severityCounts[s] ?? 0) > 0).length} severity levels.</p>
    ${severityCounts.critical > 0 ? `<p class="summary-alert">⚠ <strong>${severityCounts.critical} critical</strong> issue${severityCounts.critical > 1 ? "s" : ""} require immediate attention.</p>` : ""}
    ${severityCounts.high > 0 ? `<p class="summary-warn">${severityCounts.high} high-severity issue${severityCounts.high > 1 ? "s" : ""} should be addressed soon.</p>` : ""}
    <p>Health score: <strong>${score}/100</strong> (Grade ${esc(grade)})</p>
  </div>
</section>

<footer class="report-footer">
  <p>Generated by CodeAudit AI · ${esc(date)}</p>
</footer>

<script>
${THEME_TOGGLE_JS}
</script>
</body>
</html>`;
}

export function generateTechnicalReport(data: ReportData): string {
  const { repoName, date, score, grade, severityCounts, findings, auditType, depth } = data;
  const totalFindings = findings.length;
  const scoreColor = getScoreColor(score);

  // Group findings by severity
  const grouped: Record<string, AuditFinding[]> = {};
  for (const sev of SEVERITY_ORDER) grouped[sev] = [];
  for (const f of findings) {
    const sev = f.severity ?? "info";
    (grouped[sev] ??= []).push(f);
  }

  // Build top remediation items (critical + high, max 10)
  const remediationItems = findings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 10);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(repoName)} — Technical Audit Report</title>
<style>
${SHARED_CSS}
${TECHNICAL_CSS}
</style>
</head>
<body>

<header class="report-header">
  <div class="header-top-row">
    <div>
      <div class="header-badge">${esc(auditType)} · ${esc(depth)}</div>
      <h1>Technical Audit Report</h1>
      <div class="meta">
        <span>📦 ${esc(repoName)}</span>
        <span>📅 ${esc(date)}</span>
        <span>🔢 ${totalFindings} findings</span>
      </div>
    </div>
    <div class="header-right">
      <div class="score-badge" style="border-color:${scoreColor}">
        <span class="score-big" style="color:${scoreColor}">${score}</span>
        <span class="score-label">/ 100 (${esc(grade)})</span>
      </div>
      <div class="theme-toggle">
        <span class="theme-icon">☀</span>
        <button class="theme-switch" id="theme-switch" role="switch" aria-checked="false"
                aria-label="Toggle light mode" onclick="toggleTheme()"></button>
        <span class="theme-icon">☾</span>
      </div>
    </div>
  </div>
</header>

<!-- Severity Summary -->
<section class="section">
  <h2 class="section-heading">Severity Summary</h2>
  <div class="stat-grid">
${SEVERITY_ORDER.map((sev) => {
  const count = severityCounts[sev] ?? 0;
  const pct = totalFindings > 0 ? ((count / totalFindings) * 100).toFixed(0) : "0";
  return `    <div class="stat-card">
      <div class="stat-label">${sev}</div>
      <div class="stat-value" style="color:var(--${sevColorVar(sev)})">${count}</div>
      <div class="prog"><div class="prog-fill" style="width:${pct}%;background:var(--${sevColorVar(sev)})"></div></div>
    </div>`;
}).join("\n")}
  </div>
</section>

<!-- Findings by Severity -->
${SEVERITY_ORDER.map((sev) => {
  const items = grouped[sev] ?? [];
  if (items.length === 0) return "";
  return `
<section class="section" id="sev-${sev}">
  <h2 class="section-heading"><span class="sev-dot sev-dot-${sev}"></span>${sev.charAt(0).toUpperCase() + sev.slice(1)} Findings (${items.length})</h2>
${items.map((f, idx) => `
  <details class="finding sev-border-${f.severity}">
    <summary class="finding-summary">
      <span class="sev-badge sev-${f.severity}">${f.severity}</span>
      <span class="finding-title">${esc(f.title)}</span>
      ${f.category ? `<span class="finding-cat">${esc(f.category)}</span>` : ""}
    </summary>
    <div class="finding-body">
      ${f.description ? `<div class="field"><div class="field-label">Description</div><div class="field-value">${esc(f.description)}</div></div>` : ""}
      ${(f.filePaths ?? []).length > 0 ? `<div class="field"><div class="field-label">Files</div><div class="field-value mono">${(f.filePaths ?? []).map(esc).join("<br>")}</div></div>` : ""}
      ${f.recommendation ? `<div class="field"><div class="field-label">Recommendation</div><div class="field-value">${esc(f.recommendation)}</div></div>` : ""}
    </div>
  </details>`).join("\n")}
</section>`;
}).join("\n")}

<!-- Remediation Summary -->
<section class="section">
  <h2 class="section-heading">Remediation Priority</h2>
  ${remediationItems.length === 0 ? "<p class=\"empty-note\">No critical or high-severity findings — no immediate remediation needed.</p>" : `
  <ol class="remediation-list">
${remediationItems.map((f) => `    <li>
      <span class="sev-badge sev-${f.severity}">${f.severity}</span>
      <div>
        <strong>${esc(f.title)}</strong>
        ${f.recommendation ? `<div class="rem-detail">${esc(f.recommendation)}</div>` : ""}
      </div>
    </li>`).join("\n")}
  </ol>`}
</section>

<footer class="report-footer">
  <p>Generated by CodeAudit AI · ${esc(date)}</p>
</footer>

<script>
${THEME_TOGGLE_JS}
</script>
</body>
</html>`;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

const SEVERITY_ORDER: FindingsSeverity[] = ["critical", "high", "medium", "low", "info"];

function esc(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sevColorVar(sev: string): string {
  switch (sev) {
    case "critical": return "critical";
    case "high":     return "high";
    case "medium":   return "warning";
    case "low":      return "info";
    case "info":     return "muted";
    default:         return "muted";
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return "var(--good)";
  if (score >= 40) return "var(--warning)";
  return "var(--critical)";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Improvement";
  if (score >= 30) return "Needs Significant Work";
  return "Critical Condition";
}

function getScoreDescription(score: number): string {
  if (score >= 90) return "This codebase is in excellent shape. Maintain current practices and continue monitoring.";
  if (score >= 70) return "Generally healthy with some areas for improvement. Address findings in order of severity.";
  if (score >= 50) return "Several areas need attention. Prioritize critical and high-severity findings.";
  if (score >= 30) return "Significant issues detected across multiple areas. A dedicated remediation effort is recommended.";
  return "Critical issues require immediate attention. Security and stability risks are present.";
}

// ────────────────────────────────────────────────────────────
// Shared CSS (dark theme default, light theme toggle)
// ────────────────────────────────────────────────────────────

const SHARED_CSS = `
  :root {
    --bg: #0d1117;
    --card: #161b22;
    --border: #21262d;
    --critical: #ef4444;
    --high: #f97316;
    --warning: #eab308;
    --good: #3fb950;
    --info: #3b82f6;
    --muted: #71717a;
    --text: #e6edf3;
    --text-secondary: #8b949e;
    --mono: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
  }

  [data-theme="light"] {
    --bg: #f6f8fa;
    --card: #ffffff;
    --border: #d0d7de;
    --text: #1f2328;
    --text-secondary: #656d76;
    --muted: #656d76;
    --critical: #cf222e;
    --high: #bc4c00;
    --warning: #9a6700;
    --good: #1a7f37;
    --info: #0969da;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    min-height: 100vh;
  }

  .section {
    padding: 32px 40px;
    border-bottom: 1px solid var(--border);
    max-width: 960px;
    margin: 0 auto;
  }

  .section-label {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--good);
    margin-bottom: 6px;
  }

  .section-title, .section-heading {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .empty-note {
    color: var(--text-secondary);
    font-style: italic;
    padding: 12px 0;
  }

  /* Severity badges */
  .sev-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }
  .sev-critical { background: rgba(239,68,68,.15); color: var(--critical); border: 1px solid rgba(239,68,68,.3); }
  .sev-high     { background: rgba(249,115,22,.12); color: var(--high); border: 1px solid rgba(249,115,22,.25); }
  .sev-medium   { background: rgba(234,179,8,.12); color: var(--warning); border: 1px solid rgba(234,179,8,.25); }
  .sev-low      { background: rgba(59,130,246,.1); color: var(--info); border: 1px solid rgba(59,130,246,.2); }
  .sev-info     { background: rgba(113,113,122,.1); color: var(--muted); border: 1px solid rgba(113,113,122,.2); }

  [data-theme="light"] .sev-critical { background: rgba(207,34,46,.08); border-color: rgba(207,34,46,.25); }
  [data-theme="light"] .sev-high     { background: rgba(188,76,0,.08); border-color: rgba(188,76,0,.2); }
  [data-theme="light"] .sev-medium   { background: rgba(154,103,0,.08); border-color: rgba(154,103,0,.2); }
  [data-theme="light"] .sev-low      { background: rgba(9,105,218,.06); border-color: rgba(9,105,218,.15); }
  [data-theme="light"] .sev-info     { background: rgba(101,109,118,.06); border-color: rgba(101,109,118,.15); }

  /* Severity border accents */
  .sev-border-critical { border-left: 3px solid var(--critical) !important; }
  .sev-border-high     { border-left: 3px solid var(--high) !important; }
  .sev-border-medium   { border-left: 3px solid var(--warning) !important; }
  .sev-border-low      { border-left: 3px solid var(--info) !important; }
  .sev-border-info     { border-left: 3px solid var(--muted) !important; }

  /* Progress bar */
  .prog { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .prog-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }

  /* Theme toggle */
  .theme-toggle {
    display: flex; align-items: center; gap: 6px;
    flex-shrink: 0;
  }
  .theme-switch {
    position: relative; width: 40px; height: 22px;
    background: var(--border); border-radius: 11px;
    cursor: pointer; border: none; padding: 0;
    transition: background .25s ease;
  }
  .theme-switch::after {
    content: ''; position: absolute; top: 2px; left: 2px;
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--text); transition: transform .25s ease;
  }
  .theme-switch[aria-checked="true"] { background: var(--info); }
  .theme-switch[aria-checked="true"]::after { transform: translateX(18px); background: #ffffff; }
  .theme-icon { font-size: 14px; line-height: 1; user-select: none; color: var(--text-secondary); }

  /* Footer */
  .report-footer {
    padding: 24px 40px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 12px;
    max-width: 960px;
    margin: 0 auto;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--muted); }

  /* Responsive */
  @media (max-width: 768px) {
    .section { padding: 20px 16px; }
    .stat-grid { grid-template-columns: 1fr 1fr; }
    .header-meta { gap: 16px; }
  }

  @media print {
    body { background: white; color: black; }
    .theme-toggle { display: none !important; }
    details[open] > .finding-body { display: block !important; }
  }
`;

// ────────────────────────────────────────────────────────────
// Management-report-specific CSS
// ────────────────────────────────────────────────────────────

const MANAGEMENT_CSS = `
  .page-header {
    background: linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%);
    padding: 40px 40px 32px;
    border-bottom: 1px solid var(--border);
    max-width: 960px;
    margin: 0 auto;
  }

  .header-top {
    display: flex; justify-content: space-between; align-items: flex-start;
    flex-wrap: wrap; gap: 16px;
  }

  .header-right { display: flex; align-items: center; gap: 16px; }

  .header-badge {
    display: inline-block;
    background: rgba(59,130,246,.15);
    border: 1px solid rgba(59,130,246,.3);
    color: var(--info);
    font-size: 0.7rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    padding: 4px 12px; border-radius: 20px;
    margin-bottom: 12px;
  }

  .header-title {
    font-size: 1.8rem; font-weight: 800; color: var(--text);
    line-height: 1.2; margin-bottom: 4px;
  }

  .header-subtitle { font-size: 1rem; color: var(--text-secondary); }

  .header-meta {
    display: flex; gap: 32px; margin-top: 20px; flex-wrap: wrap;
  }
  .meta-item { display: flex; flex-direction: column; gap: 2px; }
  .meta-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-secondary); }
  .meta-value { font-size: 0.95rem; font-weight: 600; color: var(--text); }

  /* Health score ring */
  .health-score-wrap {
    display: flex; align-items: center; gap: 40px; flex-wrap: wrap;
  }
  .score-ring {
    position: relative; width: 140px; height: 140px; flex-shrink: 0;
  }
  .score-ring svg {
    transform: rotate(-90deg); width: 140px; height: 140px;
  }
  .score-ring circle { fill: none; stroke-width: 10; stroke-linecap: round; }
  .score-ring .track { stroke: rgba(255,255,255,0.08); }
  .score-ring .fill {
    stroke-dasharray: 376.99;
    transition: stroke-dashoffset 1.5s ease;
  }
  [data-theme="light"] .score-ring .track { stroke: rgba(0,0,0,0.08); }
  .score-center {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%,-50%); text-align: center;
  }
  .score-number { font-size: 2.2rem; font-weight: 900; line-height: 1; }
  .score-grade { font-size: 0.9rem; font-weight: 700; }
  .score-details { flex: 1; min-width: 200px; }
  .score-details h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
  .score-details p { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; }

  /* Severity pills */
  .severity-pills {
    display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px;
  }
  .sev-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 20px;
    font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .sev-pill strong { font-size: 1rem; }

  /* Severity table */
  .severity-table { width: 100%; border-collapse: collapse; }
  .severity-table th {
    text-align: left; padding: 8px 12px; font-size: 11px;
    font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
    color: var(--text-secondary); border-bottom: 1px solid var(--border);
  }
  .severity-table td {
    padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle;
  }
  .severity-table td:nth-child(3) { min-width: 180px; }
  .count-cell { font-weight: 700; }

  /* Finding cards */
  .findings-list { display: flex; flex-direction: column; gap: 12px; }
  .finding-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 8px; padding: 16px 20px;
  }
  .finding-header-row {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 8px; flex-wrap: wrap;
  }
  .finding-title { font-weight: 600; font-size: 14px; flex: 1; min-width: 200px; }
  .finding-cat {
    font-size: 11px; color: var(--text-secondary);
    padding: 2px 7px; background: var(--bg);
    border-radius: 4px; border: 1px solid var(--border);
  }
  .finding-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 8px; }
  .finding-rec {
    font-size: 13px; color: var(--text-secondary); line-height: 1.6;
    padding-top: 8px; border-top: 1px solid var(--border);
  }

  /* Summary */
  .summary-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 8px; padding: 20px 24px;
  }
  .summary-card p { margin-bottom: 8px; font-size: 14px; color: var(--text-secondary); }
  .summary-card p:last-child { margin-bottom: 0; }
  .summary-alert { color: var(--critical) !important; font-weight: 600; }
  .summary-warn { color: var(--high) !important; }
`;

// ────────────────────────────────────────────────────────────
// Technical-report-specific CSS
// ────────────────────────────────────────────────────────────

const TECHNICAL_CSS = `
  .report-header {
    padding: 32px 40px 24px;
    border-bottom: 1px solid var(--border);
    max-width: 960px; margin: 0 auto;
  }

  .header-top-row {
    display: flex; justify-content: space-between; align-items: flex-start;
    flex-wrap: wrap; gap: 20px;
  }

  .header-right {
    display: flex; flex-direction: column; align-items: flex-end; gap: 12px;
  }

  .header-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 10px; border-radius: 12px; font-size: 11px;
    font-weight: 600; margin-bottom: 8px;
    background: rgba(59,130,246,.12); border: 1px solid rgba(59,130,246,.3);
    color: var(--info);
  }

  .report-header h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; }

  .meta { color: var(--text-secondary); font-size: 13px; display: flex; flex-wrap: wrap; gap: 16px; }

  .score-badge {
    display: flex; align-items: baseline; gap: 6px;
    background: var(--card); border: 2px solid; border-radius: 10px;
    padding: 10px 16px;
  }
  .score-big { font-size: 32px; font-weight: 800; line-height: 1; }
  .score-label { font-size: 13px; color: var(--text-secondary); }

  /* Stat grid */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px; margin-bottom: 8px;
  }
  .stat-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 8px; padding: 14px;
  }
  .stat-label {
    font-size: 11px; color: var(--text-secondary);
    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;
  }
  .stat-value { font-size: 24px; font-weight: 700; margin-bottom: 6px; }

  /* Severity dot in headings */
  .sev-dot {
    display: inline-block; width: 10px; height: 10px;
    border-radius: 50%; flex-shrink: 0;
  }
  .sev-dot-critical { background: var(--critical); }
  .sev-dot-high     { background: var(--high); }
  .sev-dot-medium   { background: var(--warning); }
  .sev-dot-low      { background: var(--info); }
  .sev-dot-info     { background: var(--muted); }

  /* Findings — details/summary for expand/collapse */
  .finding {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 8px; margin-bottom: 10px; overflow: hidden;
  }

  .finding-summary {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; cursor: pointer; user-select: none;
    transition: background 0.15s; list-style: none;
  }
  .finding-summary::-webkit-details-marker { display: none; }
  .finding-summary::before {
    content: '▶'; font-size: 10px; color: var(--text-secondary);
    transition: transform 0.2s; flex-shrink: 0;
  }
  details[open] > .finding-summary::before { transform: rotate(90deg); }
  .finding-summary:hover { background: rgba(255,255,255,0.03); }
  [data-theme="light"] .finding-summary:hover { background: rgba(0,0,0,0.03); }

  .finding-title { flex: 1; font-size: 13px; font-weight: 600; }
  .finding-cat {
    font-size: 11px; color: var(--text-secondary);
    padding: 2px 7px; background: var(--bg);
    border-radius: 4px; border: 1px solid var(--border);
  }

  .finding-body {
    padding: 0 16px 16px; border-top: 1px solid var(--border);
  }

  .field { margin-top: 12px; }
  .field-label {
    font-size: 11px; color: var(--text-secondary);
    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;
  }
  .field-value {
    font-size: 13px; color: var(--text-secondary); line-height: 1.6;
  }
  .field-value.mono {
    font-family: var(--mono); font-size: 12px;
    background: var(--bg); padding: 8px 10px;
    border-radius: 4px; border: 1px solid var(--border);
    overflow-x: auto; white-space: pre-wrap;
  }
  [data-theme="light"] .field-value.mono { background: #f6f8fa; border-color: #d0d7de; }

  /* Remediation list */
  .remediation-list {
    counter-reset: step; list-style: none;
  }
  .remediation-list li {
    counter-increment: step; display: flex; gap: 10px;
    padding: 10px 0; border-bottom: 1px solid var(--border);
    font-size: 13px; align-items: flex-start;
  }
  .remediation-list li:last-child { border-bottom: none; }
  .rem-detail { margin-top: 4px; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
`;

// ────────────────────────────────────────────────────────────
// Theme toggle JS (shared)
// ────────────────────────────────────────────────────────────

const THEME_TOGGLE_JS = `
function toggleTheme() {
  var html = document.documentElement;
  var sw = document.getElementById('theme-switch');
  var isLight = html.getAttribute('data-theme') === 'light';
  if (isLight) {
    html.removeAttribute('data-theme');
    if (sw) sw.setAttribute('aria-checked', 'false');
  } else {
    html.setAttribute('data-theme', 'light');
    if (sw) sw.setAttribute('aria-checked', 'true');
  }
}
`;
