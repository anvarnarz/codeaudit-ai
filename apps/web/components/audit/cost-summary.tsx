"use client";

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
  const overrunPct = getBudgetOverrun(estimatedCostMicrodollars, actualCostMicrodollars);
  const totalTokens = phases.reduce((sum, p) => sum + p.tokensUsed, 0);
  const completedPhases = phases.filter((p) => p.status === "completed");

  return (
    <div className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-card p-4 flex flex-col gap-3 shadow-sm">
      {/* Top banner */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">
          Audit complete —{" "}
          {formatCost(actualCostMicrodollars)}{" "}
          ({formatTokens(tokenCount)} tokens)
        </span>
      </div>

      {/* Budget overrun warning */}
      {overrunPct !== null && (
        <div className="rounded bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 text-xs text-yellow-400">
          Exceeded estimate by {overrunPct}%
        </div>
      )}

      {/* Per-phase breakdown table */}
      {completedPhases.length > 0 && (
        <table className="w-full text-xs text-muted-foreground">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1.5 font-medium">Phase</th>
              <th className="text-right py-1.5 font-medium">Tokens</th>
              <th className="text-right py-1.5 font-medium">Est. Cost</th>
              <th className="text-right py-1.5 font-medium">Duration</th>
            </tr>
          </thead>
          <tbody>
            {completedPhases.map((phase) => (
              <tr key={phase.phaseNumber} className="border-b border-border/50 last:border-0">
                <td className="py-1.5">
                  {PHASE_NAMES[phase.phaseNumber] ?? `Phase ${phase.phaseNumber}`}
                </td>
                <td className="text-right py-1.5">
                  {formatTokens(phase.tokensUsed)}
                </td>
                <td className="text-right py-1.5">
                  {formatCost(
                    phaseTokenCost(phase.tokensUsed, totalTokens, actualCostMicrodollars),
                  )}
                </td>
                <td className="text-right py-1.5">
                  {durationSeconds(phase.startedAt, phase.completedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
