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

function formatDuration(ms: number | null): string {
  if (ms == null || ms <= 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

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
    : initialStatus === "queued" ? "Starting..." : "—";

  const isTerminal = auditState
    ? ["completed", "cancelled", "failed"].includes(auditState.status)
    : ["completed", "cancelled", "failed"].includes(initialStatus);

  const isCompleted = (auditState?.status ?? initialStatus) === "completed";
  const statusLabel = auditState?.status ?? initialStatus;

  return (
    <div className="flex flex-col gap-4">
      {/* Main progress card */}
      <div className="fade-in rounded-[14px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 flex flex-col gap-3">
        {/* Phase label + percentage */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {isTerminal
              ? statusLabel === "completed" ? "All phases complete" : statusLabel === "cancelled" ? "Audit cancelled" : "Audit failed"
              : `Phase ${(auditState?.currentPhase ?? 0) + 1}: ${currentPhaseName}`}
          </span>
          <span className="text-sm font-semibold font-mono">{percentage}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-[hsl(var(--elevated))] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted
                ? "bg-gradient-to-r from-green-500 to-emerald-400"
                : "bg-gradient-to-r from-[hsl(var(--accent))] to-amber-500"
            } ${!isTerminal ? "animate-[progressPulse_2s_ease-in-out_infinite]" : ""}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Stats row */}
        {auditState && (
          <div className="fade-in stagger-1 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-mono">{formatTokens(auditState.totalTokens)} tokens</span>
            <span>·</span>
            <span className="font-mono">{formatCost(auditState.totalCostMicro)}</span>
            <span>·</span>
            <span>{Math.round(auditState.phasesCompleted)} / {auditState.phasesTotal} phases</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          {!isTerminal && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
            >
              {cancelling ? "Cancelling..." : "Cancel Audit"}
            </button>
          )}
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
            {expanded ? "Hide details" : "Show details"}
          </button>
        </div>
      </div>

      {/* Phase list */}
      {expanded && (
        <div className="fade-in rounded-[14px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden">
          {Array.from({ length: 12 }, (_, i) => i).map((phaseNum) => {
            const phase = phases.get(phaseNum);
            const status = phase?.status ?? "pending";

            return (
              <div
                key={phaseNum}
                className={`grid items-center px-4 py-3 text-sm ${
                  phaseNum < 11 ? "border-b border-[hsl(var(--border))]/50" : ""
                } ${status === "pending" ? "opacity-40" : ""}`}
                style={{ gridTemplateColumns: "28px 1fr 90px 70px 60px" }}
              >
                {/* Status icon in colored circle */}
                <div>
                  {status === "completed" ? (
                    <div className="w-5 h-5 rounded-md bg-green-500/15 flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : status === "running" ? (
                    <div className="w-5 h-5 rounded-md bg-[hsl(var(--accent))]/15 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full border-2 border-[hsl(var(--accent))] border-t-transparent animate-spin" />
                    </div>
                  ) : status === "failed" ? (
                    <div className="w-5 h-5 rounded-md bg-red-500/15 flex items-center justify-center">
                      <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-md bg-[hsl(var(--elevated))] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Phase name */}
                <span className={status === "running" ? "font-semibold" : ""}>
                  {PHASE_NAMES[phaseNum] ?? `Phase ${phaseNum}`}
                </span>

                {/* Findings count */}
                <span className="text-xs text-muted-foreground">
                  {phase && status !== "pending" && status !== "skipped"
                    ? phase.findingsCount > 0
                      ? `${phase.findingsCount} findings`
                      : "no findings"
                    : status === "skipped" ? "skipped" : "—"}
                </span>

                {/* Duration */}
                <span className="text-xs font-mono text-muted-foreground">
                  {phase && status === "completed" ? formatDuration(phase.durationMs) : "—"}
                </span>

                {/* Cost (proportional) */}
                <span className="text-xs font-mono text-muted-foreground">
                  {phase && phase.tokensUsed > 0 && auditState
                    ? formatCost(
                        auditState.totalTokens > 0
                          ? Math.round((phase.tokensUsed / auditState.totalTokens) * auditState.totalCostMicro)
                          : 0,
                      )
                    : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Completion banner */}
      {isTerminal && statusLabel === "completed" && (
        <div className="fade-in rounded-[14px] border border-green-500/20 bg-green-500/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-green-500/15 flex items-center justify-center">
              <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              Audit complete
            </span>
          </div>
          <a
            href={`/audit/${auditId}/results`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
          >
            View Results
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
