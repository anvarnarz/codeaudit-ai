---
phase: 03-results-cost
verified: 2026-03-22T09:43:50Z
status: passed
score: 11/11 must-haves verified
re_verification: false
---

# Phase 3: Results & Cost Verification Report

**Phase Goal:** Users can view a rich in-app findings dashboard, download full audit artifacts, and see a complete cost summary after every audit
**Verified:** 2026-03-22T09:43:50Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can navigate to /audit/[id]/results and see the health score, grade, and severity breakdown chart | VERIFIED | `results/page.tsx` loads audit+phases from DB; `results-view.tsx` renders score/grade (Section 1) and `<SeverityChart>` (Section 3) when `audit.findings` is non-null |
| 2 | User can see all findings in a scrollable list with severity badge, file paths, and collapsed remediation | VERIFIED | `results-view.tsx` maps `filtered` array to `<FindingCard>` (Section 6); `finding-card.tsx` renders `<SeverityBadge>`, file info row, description, and Radix Collapsible for remediation (collapsed by default) |
| 3 | User can filter findings by severity (All / Critical / High / Medium / Low / Info) and see the list update | VERIFIED | `results-view.tsx` has `useState<FindingsSeverity | "all">` filter state; button row calls `setFilter(sev)`; `filtered` array applies `.filter((f) => filter === "all" || f.severity === filter)` |
| 4 | User sees the cost summary banner — total cost in dollars and total tokens — at the top of results page | VERIFIED | `results-view.tsx` renders `<CostSummary>` for all terminal audits (Section 2); `cost-summary.tsx` renders "Audit complete — {formatCost} ({formatTokens} tokens)" banner |
| 5 | User sees a yellow budget-overrun warning when actual cost exceeded estimate by more than 20% | VERIFIED | `cost-summary.tsx` calls `getBudgetOverrun(estimatedCostMicrodollars, actualCostMicrodollars)`; renders yellow warning div with `text-yellow-400` when `overrunPct !== null`; `format.ts::getBudgetOverrun` returns non-null only when `pct > 20` |
| 6 | After audit completes, progress-view shows a 'View Results' button that navigates to /audit/[id]/results | VERIFIED | `progress-view.tsx` line 197–207: `{isTerminal && statusLabel === "completed" && ...}` renders `<a href={/audit/${auditId}/results}>View Results</a>`; imports `formatCost/formatTokens` from `@/lib/format` (no local duplicates) |
| 7 | Cancelled/failed audits with null findings show a partial results page using auditPhases data + cost incurred | VERIFIED | `results-view.tsx`: `allFindings = audit.findings ? audit.findings.findings : phases.flatMap(p => p.findings ?? [])` (line 64–66); Section 4 renders yellow notice when `!audit.findings && isTerminal`; `<CostSummary>` still renders for all terminal audits |
| 8 | User can click 'Download Zip' and receive a .zip file containing all audit output directory files plus findings-structured.json | VERIFIED | `download/route.ts`: `archive.directory(audit.auditOutputDir, false)` + `archive.append(JSON.stringify(audit.findings...), {name: "findings-structured.json"})` before `archive.finalize()`; `Content-Type: application/zip` |
| 9 | User can click 'Executive Report' and see report-management.html rendered inside the app chrome via iframe | VERIFIED | `executive/page.tsx` renders `<iframe src={/api/audit/${id}/report/management} ...>`; `report/[type]/route.ts` reads and serves the HTML file with `Content-Type: text/html` |
| 10 | User can click 'Technical Report' and see report-technical.html rendered inside the app chrome via iframe | VERIFIED | `technical/page.tsx` renders `<iframe src={/api/audit/${id}/report/technical} ...>`; same route serves `report-technical.html` |
| 11 | User can download a PDF of either HTML report via /api/audit/[id]/pdf/[management|technical] | VERIFIED | `pdf/[type]/route.ts`: `puppeteer.launch` → `page.goto(file://${filePath})` → `page.pdf(...)` → `Buffer.from(pdf)` response; `fs.access` guard returns 404 when Phase 11 files missing; `browser?.close()` in `finally` block |

**Score:** 11/11 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/lib/format.ts` | formatCost, formatTokens, getBudgetOverrun helpers | VERIFIED | Exports all 3 functions; 44 lines; substantive implementations with correct microdollar math |
| `apps/web/components/audit/severity-badge.tsx` | SeverityBadge colored badge component | VERIFIED | Exports `SeverityBadge`; imports `FindingsSeverity` from `@codeaudit/db`; 5-severity color map defined |
| `apps/web/components/audit/severity-chart.tsx` | Recharts bar chart for severity counts | VERIFIED | "use client"; imports from `recharts`; exports `SeverityChart`; 120px height, 5 bars with Cell-per-bar custom fill |
| `apps/web/components/audit/finding-card.tsx` | Collapsible finding card with Radix Collapsible | VERIFIED | "use client"; imports `@radix-ui/react-collapsible`; exports `FindingCard`; full collapsible remediation, file info, SeverityBadge wired |
| `apps/web/components/audit/cost-summary.tsx` | Cost banner + per-phase breakdown table | VERIFIED | "use client"; exports `CostSummary`; imports from `@/lib/format`; banner + budget warning + phase breakdown table all present |
| `apps/web/app/(app)/audit/[id]/results/page.tsx` | Server Component loading audit + phases from SQLite | VERIFIED | Async Server Component; queries `audits` and `auditPhases` via `getDb()`; passes serializable props to `ResultsView` |
| `apps/web/app/(app)/audit/[id]/results/results-view.tsx` | Client Component with filter/sort state | VERIFIED | "use client"; `useState` for `filter` and `sortBy`; all 7 sections rendered; uses `FindingCard`, `CostSummary`, `SeverityChart` |
| `apps/web/app/api/audit/[id]/download/route.ts` | Streaming zip of auditOutputDir + structured JSON | VERIFIED | Exports `GET`; archiver with error handler before finalize; `archive.directory` + `archive.append`; `Readable.toWeb` for Next.js |
| `apps/web/app/api/audit/[id]/pdf/[type]/route.ts` | Puppeteer HTML-to-PDF conversion | VERIFIED | Exports `GET`; `fs.access` guard; `puppeteer.launch`; `file://` absolute path; `Buffer.from(pdf)`; `finally { browser?.close() }` |
| `apps/web/app/api/audit/[id]/report/[type]/route.ts` | Raw HTML file serving for iframe embed | VERIFIED | Exports `GET`; `fs.readFile`; `Content-Type: text/html; charset=utf-8`; 404 on missing file |
| `apps/web/app/(app)/audit/[id]/executive/page.tsx` | Executive report page with iframe + back link | VERIFIED | Server Component; `<iframe src=/api/audit/${id}/report/management>`; "Back to Results" link; "Download PDF" link to `/api/audit/${id}/pdf/management` |
| `apps/web/app/(app)/audit/[id]/technical/page.tsx` | Technical report page with iframe + back link | VERIFIED | Server Component; `<iframe src=/api/audit/${id}/report/technical>`; "Back to Results" link; "Download PDF" link to `/api/audit/${id}/pdf/technical` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `results/page.tsx` | `packages/db/src/schema.ts` | `getDb().select().from(audits) + .from(auditPhases)` | WIRED | Lines 12–18: both tables queried with `eq()` filter on audit ID |
| `results-view.tsx` | `finding-card.tsx` | findings array mapped to `<FindingCard>` | WIRED | Line 156: `filtered.map((f) => <FindingCard key={f.id} finding={f} />)` |
| `progress-view.tsx` | `results/page.tsx` | `<a href={/audit/${auditId}/results}>` on completion | WIRED | Lines 197–207: anchor tag present, conditional on `isTerminal && statusLabel === "completed"` |
| `executive/page.tsx` | `report/[type]/route.ts` | `<iframe src={/api/audit/${id}/report/management}>` | WIRED | Lines 37–42: iframe src attribute present and correct |
| `download/route.ts` | `audit.auditOutputDir` | `archiver.directory(audit.auditOutputDir, false)` | WIRED | Line 22: `archive.directory(audit.auditOutputDir, false)` |
| `pdf/[type]/route.ts` | `audit.auditOutputDir` | `puppeteer.goto(file://${filePath})` | WIRED | Lines 25, 42: `path.join(audit.auditOutputDir, htmlFile)` then `file://${filePath}` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DASH-01 | 03-01 | In-app dashboard with scores, severity breakdown, and findings list | SATISFIED | `results/page.tsx` + `results-view.tsx` renders health score, `SeverityChart`, and filterable `FindingCard` list |
| DASH-02 | 03-01 | Filter and sort findings by severity | SATISFIED | `results-view.tsx` filter button row + sort select with `useState` updating `filtered` array |
| DASH-03 | 03-01, 03-02 | Executive/management report and technical report as separate views | SATISFIED | `executive/page.tsx` and `technical/page.tsx` are separate routes; `results-view.tsx` links to both; iframe embed of Phase 11 HTML via report API |
| DASH-04 | 03-02 | Download full audit reports as a zip file | SATISFIED | `download/route.ts` streams zip of `auditOutputDir` + `findings-structured.json`; "Download Zip" link in `results-view.tsx` |
| DASH-05 | 03-01 | Findings include file paths, line numbers, evidence, and remediation suggestions | SATISFIED | `finding-card.tsx` renders `filePaths`, `lineNumbers`, `description` (evidence), and collapsible `recommendation` |
| COST-01 | 03-01 | Total tokens used and total cost after audit completes | SATISFIED | `cost-summary.tsx` banner: `formatCost(actualCostMicrodollars)` and `formatTokens(tokenCount)` |
| COST-02 | 03-01 | Budget warning if audit consumed significantly more tokens than estimated | SATISFIED | `cost-summary.tsx` renders yellow warning when `getBudgetOverrun(estimated, actual)` returns non-null (>20% threshold) |
| COST-03 | 03-01, 03-02 | User can cancel a running audit and sees cost incurred | SATISFIED | `results-view.tsx` renders `<CostSummary>` for all terminal statuses (including cancelled); partial findings collected from phase rows; COST-03 also supported by existing cancel endpoint from Phase 2 |

**All 8 required requirement IDs from ROADMAP.md are accounted for across the two plans. No orphaned requirements found.**

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `results-view.tsx` | 169 | Comment reads "Download / report links placeholder" | Info | Comment label only — the actual `<a>` tags with real hrefs are present at lines 171–189. Not a stub. |

No blockers or warnings detected. The "placeholder" comment in Section 7 of `results-view.tsx` is a section label from the plan spec; the actual download and report links are fully wired to `/api/audit/${auditId}/download`, `/audit/${auditId}/executive`, and `/audit/${auditId}/technical`.

---

### Human Verification Required

The following items cannot be verified programmatically and require manual testing:

#### 1. Health score and severity chart render correctly

**Test:** Start a completed audit, navigate to `/audit/[id]/results`
**Expected:** Large numeric score + grade letter visible; Recharts bar chart shows 5 colored bars (critical=red, high=orange, medium=yellow, low=blue, info=gray) with correct counts
**Why human:** Chart rendering depends on recharts DOM output; grade color classes are applied at runtime

#### 2. Filter buttons narrow the findings list

**Test:** On the results page, click "Critical" filter button
**Expected:** Only critical-severity FindingCard components remain visible; other cards disappear; clicking "All" restores full list
**Why human:** Client-side React state interaction

#### 3. Collapsible remediation in FindingCard

**Test:** On a finding card that has a recommendation, click the "Remediation" trigger
**Expected:** Content expands to show recommendation text; clicking again collapses it
**Why human:** Radix Collapsible interaction; requires a finding with `recommendation` field populated

#### 4. Download Zip produces a valid archive

**Test:** Click "Download Zip" on a completed audit with Phase 11 files present
**Expected:** Browser downloads a `.zip` file; unzipping it reveals audit output files and `findings-structured.json`
**Why human:** Requires an actual audit with a populated `auditOutputDir`

#### 5. Executive/Technical Report iframe embedding

**Test:** Click "Executive Report" from results page; click "Technical Report"
**Expected:** Each page shows the Phase 11 HTML report inside an iframe with app chrome (back button, PDF download link); inline chart JS in the report renders
**Why human:** Requires Phase 11 HTML files to exist on disk; iframe rendering is visual

#### 6. PDF download from report viewer pages

**Test:** On the executive report page, click "Download PDF"
**Expected:** Browser downloads a PDF rendering the management HTML report in A4 format
**Why human:** Requires Puppeteer to successfully render the file:// path; output is a binary file

#### 7. Partial results for cancelled audits

**Test:** Cancel an audit mid-run (before Phase 10), then navigate to `/audit/[id]/results`
**Expected:** Yellow warning notice visible; partial findings from completed phases displayed; cost summary shows cost incurred; no crash
**Why human:** Requires a cancelled audit with partially populated `auditPhases` rows

---

### Gaps Summary

No gaps found. All 11 observable truths are verified. All 12 artifacts exist and are substantively implemented. All 6 key links are wired. All 8 requirement IDs (DASH-01 through DASH-05, COST-01 through COST-03) are satisfied.

The pre-existing build failure in `packages/audit-engine` (Turbopack cannot resolve `.js` module files in the package's `dist/`) is documented in `deferred-items.md` and was present before Phase 3 work began. It does not originate from Phase 3 changes and is outside this phase's scope.

---

_Verified: 2026-03-22T09:43:50Z_
_Verifier: Claude (gsd-verifier)_
