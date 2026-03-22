"use client";

import { useState } from "react";
import type { FindingsSeverity, AuditFindings } from "@codeaudit-ai/db";
import { SeverityChart } from "@/components/audit/severity-chart";
import { FindingCard } from "@/components/audit/finding-card";
import { CostSummary } from "@/components/audit/cost-summary";
import { HealthScore } from "@/components/ui/health-score";

type AuditRow = {
  id: string;
  folderName: string;
  auditType: "full" | "security" | "team-collaboration" | "code-quality";
  depth: "quick" | "deep";
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  tokenCount: number;
  estimatedCostMicrodollars: number;
  actualCostMicrodollars: number;
  findings: AuditFindings | null | undefined;
  startedAt: Date | null;
  completedAt: Date | null;
};

type PhaseRow = {
  id: string;
  phaseNumber: number;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  findings: import("@codeaudit-ai/db").AuditFinding[] | null | undefined;
  tokensUsed: number;
  startedAt: Date | null;
  completedAt: Date | null;
};

type ResultsViewProps = {
  auditId: string;
  audit: AuditRow;
  phases: PhaseRow[];
};

const SEVERITY_ORDER: Record<FindingsSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const SEVERITY_PILL_COLORS: Record<FindingsSeverity, { active: string; border: string }> = {
  critical: { active: "bg-red-500/15 text-red-500 border-red-500/30", border: "border-red-500/30" },
  high:     { active: "bg-orange-500/15 text-orange-500 border-orange-500/30", border: "border-orange-500/30" },
  medium:   { active: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30", border: "border-yellow-500/30" },
  low:      { active: "bg-blue-500/15 text-blue-500 border-blue-500/30", border: "border-blue-500/30" },
  info:     { active: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30", border: "border-zinc-500/30" },
};

const SCORE_LABEL: Record<string, string> = {
  A: "Excellent",
  B: "Good",
  C: "Needs improvement",
  D: "Poor",
  F: "Critical",
};

const TERMINAL_STATUSES = new Set(["completed", "cancelled", "failed"]);

export function ResultsView({ auditId, audit, phases }: ResultsViewProps) {
  const [filter, setFilter] = useState<FindingsSeverity | "all">("all");
  const [sortBy, setSortBy] = useState<"severity" | "phase">("severity");

  const isTerminal = TERMINAL_STATUSES.has(audit.status);

  // Gather all findings -- from audit.findings if completed, or from phases if cancelled/failed
  const allFindings = audit.findings
    ? audit.findings.findings
    : phases.flatMap((p) => p.findings ?? []);

  // Apply filter
  const filtered = allFindings
    .filter((f) => filter === "all" || f.severity === filter)
    .sort((a, b) => {
      if (sortBy === "severity") {
        return (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99);
      }
      return a.phase - b.phase;
    });

  return (
    <div className="flex flex-col gap-6">
      {/* Section 1 -- Health Score + Severity Breakdown side by side */}
      {audit.findings && (
        <div className="fade-in stagger-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Health Score card */}
          <div className="rounded-[14px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 flex items-center gap-6">
            <HealthScore
              score={audit.findings.summary.score}
              grade={audit.findings.summary.grade}
              size="lg"
            />
            <div>
              <div className="text-xs text-muted-foreground mb-1">Health Score</div>
              <div className="text-2xl font-bold font-mono tracking-tight">
                {audit.findings.summary.score}{" "}
                <span className="text-base font-normal text-muted-foreground">/ 100</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {SCORE_LABEL[audit.findings.summary.grade] ?? ""}
              </div>
            </div>
          </div>

          {/* Severity Breakdown card */}
          <div className="rounded-[14px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5">
            <div className="text-xs text-muted-foreground mb-3">Severity Breakdown</div>
            <SeverityChart counts={audit.findings.summary.findings_count} />
          </div>
        </div>
      )}

      {/* Section 2 -- Cost summary + action buttons */}
      {isTerminal && (
        <div className="fade-in stagger-2">
          <CostSummary
            actualCostMicrodollars={audit.actualCostMicrodollars}
            estimatedCostMicrodollars={audit.estimatedCostMicrodollars}
            tokenCount={audit.tokenCount}
            phases={phases}
          />
        </div>
      )}

      {/* Action buttons row */}
      <div className="fade-in stagger-2 flex flex-wrap gap-2">
        <a
          href={`/audit/${auditId}/executive`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium hover:bg-[hsl(var(--elevated))] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Executive Report
        </a>
        <a
          href={`/audit/${auditId}/technical`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium hover:bg-[hsl(var(--elevated))] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Technical Report
        </a>
        <a
          href={`/api/audit/${auditId}/download`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium hover:bg-[hsl(var(--elevated))] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download All
        </a>
      </div>

      {/* Section 3 -- Partial results notice (cancelled/failed with no audit.findings) */}
      {!audit.findings && isTerminal && (
        <div className="fade-in rounded-[14px] bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-400">
          This audit was cancelled before completing -- showing partial findings from{" "}
          {phases.filter((p) => p.status === "completed").length} completed phases.
        </div>
      )}

      {/* Section 4 -- Filter bar with severity pills */}
      {allFindings.length > 0 && (
        <div className="fade-in stagger-3 flex items-center gap-1.5 flex-wrap">
          {(["all", "critical", "high", "medium", "low", "info"] as const).map((sev) => {
            const isActive = filter === sev;
            const count = sev !== "all" && audit.findings
              ? audit.findings.summary.findings_count[sev] ?? 0
              : sev === "all" ? allFindings.length : 0;

            const activeStyle = sev === "all"
              ? "bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30"
              : SEVERITY_PILL_COLORS[sev].active;

            return (
              <button
                key={sev}
                type="button"
                onClick={() => setFilter(sev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border capitalize ${
                  isActive
                    ? activeStyle
                    : "text-muted-foreground border-[hsl(var(--border))] hover:text-foreground hover:bg-[hsl(var(--elevated))]"
                }`}
              >
                {sev === "all" ? "All" : sev}
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold leading-none ${
                  isActive ? "bg-white/10" : "bg-[hsl(var(--elevated))]"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "severity" | "phase")}
            className="ml-auto text-xs bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="severity">Sort by severity</option>
            <option value="phase">Sort by phase</option>
          </select>
        </div>
      )}

      {/* Section 5 -- Findings list with stagger */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((f, i) => (
            <div key={f.id} className={`fade-in stagger-${Math.min(i + 1, 5)}`}>
              <FindingCard finding={f} />
            </div>
          ))}
        </div>
      ) : allFindings.length > 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No findings match this filter.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          No findings available.
        </p>
      )}
    </div>
  );
}
