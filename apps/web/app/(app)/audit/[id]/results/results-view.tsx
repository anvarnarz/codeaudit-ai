"use client";

import { useState } from "react";
import type { FindingsSeverity, AuditFindings } from "@codeaudit-ai/db";
import { SeverityChart } from "@/components/audit/severity-chart";
import { FindingCard } from "@/components/audit/finding-card";
import { CostSummary } from "@/components/audit/cost-summary";

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

const GRADE_COLOR: Record<string, string> = {
  A: "text-green-400",
  B: "text-blue-400",
  C: "text-yellow-400",
  D: "text-orange-400",
  F: "text-red-400",
};

const TERMINAL_STATUSES = new Set(["completed", "cancelled", "failed"]);

export function ResultsView({ auditId, audit, phases }: ResultsViewProps) {
  const [filter, setFilter] = useState<FindingsSeverity | "all">("all");
  const [sortBy, setSortBy] = useState<"severity" | "phase">("severity");

  const isTerminal = TERMINAL_STATUSES.has(audit.status);

  // Gather all findings — from audit.findings if completed, or from phases if cancelled/failed
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

  const gradeColor = audit.findings
    ? (GRADE_COLOR[audit.findings.summary.grade] ?? "text-foreground")
    : "";

  return (
    <div className="flex flex-col gap-6">
      {/* Section 1 — Health score (completed audits only) */}
      {audit.findings && (
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-bold ${gradeColor}`}>
            {audit.findings.summary.score}
          </span>
          <span className="text-2xl text-muted-foreground">
            / 100 · {audit.findings.summary.grade}
          </span>
        </div>
      )}

      {/* Section 2 — Cost summary banner (terminal audits) */}
      {isTerminal && (
        <CostSummary
          actualCostMicrodollars={audit.actualCostMicrodollars}
          estimatedCostMicrodollars={audit.estimatedCostMicrodollars}
          tokenCount={audit.tokenCount}
          phases={phases}
        />
      )}

      {/* Section 3 — Severity chart (completed audits with findings) */}
      {audit.findings && (
        <SeverityChart counts={audit.findings.summary.findings_count} />
      )}

      {/* Section 4 — Partial results notice (cancelled/failed with no audit.findings) */}
      {!audit.findings && isTerminal && (
        <div className="rounded bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-400">
          This audit was cancelled before completing — showing partial findings from{" "}
          {phases.filter((p) => p.status === "completed").length} completed phases.
        </div>
      )}

      {/* Section 5 — Filter / sort bar */}
      {allFindings.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {(["all", "critical", "high", "medium", "low", "info"] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setFilter(sev)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${
                filter === sev
                  ? "bg-white text-black border-primary ring-1 ring-primary dark:bg-white dark:text-black"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-accent"
              }`}
            >
              {sev === "all" ? "All" : sev}
              {sev !== "all" && audit.findings && (
                <span className="ml-1 text-muted-foreground">
                  ({audit.findings.summary.findings_count[sev] ?? 0})
                </span>
              )}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "severity" | "phase")}
            className="ml-auto text-xs bg-background border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="severity">Sort by severity</option>
            <option value="phase">Sort by phase</option>
          </select>
        </div>
      )}

      {/* Section 6 — Findings list */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((f) => (
            <FindingCard key={f.id} finding={f} />
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

      {/* Section 7 — Download / report links placeholder */}
      <div className="flex gap-2 pt-2">
        <a
          href={`/api/audit/${auditId}/download`}
          className="inline-flex items-center gap-1.5 rounded-md bg-secondary border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
        >
          Download Zip
        </a>
        <a
          href={`/audit/${auditId}/executive`}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Executive Report
        </a>
        <a
          href={`/audit/${auditId}/technical`}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Technical Report
        </a>
      </div>
    </div>
  );
}
