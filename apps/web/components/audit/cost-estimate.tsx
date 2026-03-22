"use client";
import { useMemo } from "react";
import { estimateCostRange, formatCostRange, type FolderStats, type AuditType, type AuditDepth, type Provider } from "@/lib/cost-estimator-shared";
import { DollarSign } from "lucide-react";

interface CostEstimateProps {
  stats: FolderStats | null;
  auditType: AuditType;
  depth: AuditDepth;
  provider: Provider | null;
}

export function CostEstimate({ stats, auditType, depth, provider }: CostEstimateProps) {
  const range = useMemo(() => {
    if (!provider) return null;
    return estimateCostRange(stats, auditType, depth, provider);
  }, [stats, auditType, depth, provider]);

  if (!provider) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-card px-4 py-3 shadow-sm">
      <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
      <div>
        <p className="text-sm font-medium">
          Estimated cost: {range ? formatCostRange(range) : "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          {stats
            ? `Based on ${stats.fileCount.toLocaleString()} files (~${Math.round(stats.estimatedTokens / 1000)}k tokens)`
            : "Based on a typical medium-size repository"}
        </p>
      </div>
    </div>
  );
}
