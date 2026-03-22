"use client";

import { useState } from "react";
import { formatCost, formatTokens, getBudgetOverrun } from "@/lib/format";

const PHASE_NAMES: Record<number, string> = {
  0: "Bootstrap", 1: "Orientation", 2: "Dependency Health", 3: "Test Coverage",
  4: "Code Complexity", 5: "Git Archaeology", 6: "Security Audit", 7: "Deep Reads",
  8: "CI/CD", 9: "Documentation", 10: "Final Report", 11: "HTML Reports",
};

function phaseTokenCost(
  phaseTokens: number,
  totalTokens: number,
  totalCostMicro: number,
): number {
  if (totalTokens === 0) return 0;
  return Math.round((phaseTokens / totalTokens) * totalCostMicro);
}

function durationSeconds(
  startedAt: Date | null,
  completedAt: Date | null,
): string {
  if (!startedAt || !completedAt) return "—";
  return `${Math.round((completedAt.getTime() - startedAt.getTime()) / 1000)}s`;
}

type CostSummaryProps = {
  actualCostMicrodollars: number;
  estimatedCostMicrodollars: number;
  tokenCount: number;
  phases: Array<{
    phaseNumber: number;
    tokensUsed: number;
    startedAt: Date | null;
    completedAt: Date | null;
    status: string;
  }>;
};

export function CostSummary({
  actualCostMicrodollars,
  estimatedCostMicrodollars,
  tokenCount,
  phases,
}: CostSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const overrunPct = getBudgetOverrun(estimatedCostMicrodollars, actualCostMicrodollars);
  const totalTokens = phases.reduce((sum, p) => sum + p.tokensUsed, 0);
  const completedPhases = phases.filter((p) => p.status === "completed");

  return (
    <div className="rounded-[14px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 flex flex-col gap-3">
      {/* Total cost row */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground">Total cost</span>
          <span className="text-lg font-bold font-mono">
            {formatCost(actualCostMicrodollars)}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            ({formatTokens(tokenCount)} tokens)
          </span>
        </div>

        {completedPhases.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span
              className="inline-block transition-transform duration-200 text-[10px]"
              style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              ▶
            </span>
            {expanded ? "Hide breakdown" : "Per-phase breakdown"}
          </button>
        )}
      </div>

      {/* Budget overrun warning */}
      {overrunPct !== null && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-xs text-yellow-400">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Exceeded estimate by {overrunPct}%
        </div>
      )}

      {/* Expandable per-phase breakdown */}
      {expanded && completedPhases.length > 0 && (
        <div className="fade-in">
          <table className="w-full text-xs text-muted-foreground">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                <th className="text-left py-2 font-medium">Phase</th>
                <th className="text-right py-2 font-medium font-mono">Tokens</th>
                <th className="text-right py-2 font-medium font-mono">Est. Cost</th>
                <th className="text-right py-2 font-medium font-mono">Duration</th>
              </tr>
            </thead>
            <tbody>
              {completedPhases.map((phase) => (
                <tr key={phase.phaseNumber} className="border-b border-[hsl(var(--border))]/30 last:border-0">
                  <td className="py-2">
                    {PHASE_NAMES[phase.phaseNumber] ?? `Phase ${phase.phaseNumber}`}
                  </td>
                  <td className="text-right py-2 font-mono">
                    {formatTokens(phase.tokensUsed)}
                  </td>
                  <td className="text-right py-2 font-mono">
                    {formatCost(
                      phaseTokenCost(phase.tokensUsed, totalTokens, actualCostMicrodollars),
                    )}
                  </td>
                  <td className="text-right py-2 font-mono">
                    {durationSeconds(phase.startedAt, phase.completedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
