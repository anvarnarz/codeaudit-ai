"use client";
import { useEffect, useRef, useState } from "react";
import { cancelAudit } from "@/actions/audit-control";
import { formatCost, formatTokens } from "@/lib/format";

// Types matching SSE event shapes from stream/route.ts
type PhaseEvent = {
  type: "phase";
  phaseNumber: number;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  tokensUsed: number;
  findingsCount: number;
  criticalCount: number;
  durationMs: number | null;
};

type AuditEvent = {
  type: "audit";
  status: string;
  currentPhase: number | null;
  totalTokens: number;
  totalCostMicro: number;
  phasesTotal: number;
  phasesCompleted: number;
};

// Phase names matching PHASE_REGISTRY from audit-engine (duplicated for client bundle — no server import)
const PHASE_NAMES: Record<number, string> = {
  0: "Bootstrap", 1: "Orientation", 2: "Dependency Health", 3: "Test Coverage",
  4: "Code Complexity", 5: "Git Archaeology", 6: "Security Audit", 7: "Deep Reads",
  8: "CI/CD", 9: "Documentation", 10: "Final Report", 11: "HTML Reports",
};

export function ProgressView({
  auditId,
  initialStatus,
}: {
  auditId: string;
  initialStatus: string;
}) {
  const [phases, setPhases] = useState<Map<number, PhaseEvent>>(new Map());
  const [auditState, setAuditState] = useState<AuditEvent | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE stream — reconnects automatically on disconnect (browser EventSource behavior)
    const es = new EventSource(`/api/audit/${auditId}/stream`);
    esRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data as string) as PhaseEvent | AuditEvent;
      if (data.type === "phase") {
        setPhases((prev) => {
          const next = new Map(prev);
          next.set(data.phaseNumber, data);
          return next;
        });
      } else if (data.type === "audit") {
        setAuditState(data);
        // Close EventSource on terminal status (server also closes, but belt-and-suspenders)
        if (["completed", "cancelled", "failed"].includes(data.status)) {
          es.close();
        }
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects — no manual action needed
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [auditId]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelAudit(auditId);
    } catch {
      setCancelling(false);
    }
  };

  const percentage = auditState
    ? auditState.phasesTotal > 0
      ? Math.round((auditState.phasesCompleted / auditState.phasesTotal) * 100)
      : 0
    : 0;

  const currentPhaseName = auditState?.currentPhase != null
    ? PHASE_NAMES[auditState.currentPhase] ?? `Phase ${auditState.currentPhase}`
    : initialStatus === "queued" ? "Starting…" : "—";

  const isTerminal = auditState
    ? ["completed", "cancelled", "failed"].includes(auditState.status)
    : ["completed", "cancelled", "failed"].includes(initialStatus);

  const statusLabel = auditState?.status ?? initialStatus;

  return (
    <div className="flex flex-col gap-4">
      {/* Simplified view — D-05 */}
      <div className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-card p-5 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {isTerminal
              ? statusLabel === "completed" ? "Audit complete" : statusLabel === "cancelled" ? "Audit cancelled" : "Audit failed"
              : currentPhaseName}
          </span>
          <span className="text-sm text-muted-foreground">{percentage}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Token / cost row — PROG-03 */}
        {auditState && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{formatTokens(auditState.totalTokens)} tokens</span>
            <span>{formatCost(auditState.totalCostMicro)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? "Hide details" : "Show details"}
          </button>
          {!isTerminal && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="ml-auto text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
            >
              {cancelling ? "Cancelling…" : "Cancel audit"}
            </button>
          )}
        </div>
      </div>

      {/* Expanded detail — D-06 */}
      {expanded && (
        <div className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-card divide-y divide-border shadow-sm">
          {Array.from({ length: 12 }, (_, i) => i).map((phaseNum) => {
            const phase = phases.get(phaseNum);
            const status = phase?.status ?? "pending";
            const icon =
              status === "completed" ? "✓"
              : status === "running"   ? "▶"
              : status === "failed"    ? "✗"
              : status === "skipped"   ? "⊘"
              : "○";
            const iconColor =
              status === "completed" ? "text-green-500"
              : status === "running"   ? "text-yellow-500"
              : status === "failed"    ? "text-destructive"
              : "text-muted-foreground";

            return (
              <div key={phaseNum} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className={`font-mono w-4 shrink-0 ${iconColor}`}>{icon}</span>
                <span className={status === "pending" || status === "skipped" ? "text-muted-foreground" : ""}>
                  {PHASE_NAMES[phaseNum] ?? `Phase ${phaseNum}`}
                </span>
                {phase && status !== "pending" && status !== "skipped" && (
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">
                    {phase.findingsCount > 0
                      ? `${phase.findingsCount} findings${phase.criticalCount > 0 ? ` (${phase.criticalCount} critical)` : ""}`
                      : "no findings"}
                    {phase.tokensUsed > 0 ? ` · ${formatTokens(phase.tokensUsed)} tokens` : ""}
                  </span>
                )}
                {status === "skipped" && (
                  <span className="ml-auto text-xs text-muted-foreground">skipped</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Completion state */}
      {isTerminal && statusLabel === "completed" && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 flex items-center justify-between">
          <span className="text-sm text-green-600 dark:text-green-400">Audit complete</span>
          <a
            href={`/audit/${auditId}/results`}
            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
          >
            View Results
          </a>
        </div>
      )}
    </div>
  );
}
