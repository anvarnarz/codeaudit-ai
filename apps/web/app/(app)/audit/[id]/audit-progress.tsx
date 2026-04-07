"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Constants ────────────────────────────────────────────────────────────

const PHASE_NAMES = [
  "Bootstrap",
  "Orientation",
  "Dependency Health",
  "Code Complexity",
  "Security Scan",
  "Secret Detection",
  "Auth & Access",
  "API Security",
  "Data Protection",
  "Test Coverage",
  "Documentation",
  "Git History",
  "CI/CD",
];

const AUDIT_TYPE_LABELS: Record<string, string> = {
  full: "Full Audit",
  security: "Security Only",
  "team-collaboration": "Team & Collab",
  "code-quality": "Code Quality",
};

// ─── Types ────────────────────────────────────────────────────────────────

type AuditData = {
  id: string;
  folderName: string;
  folderPath: string;
  auditType: string;
  depth: string;
  status: string;
  startedAt: string | null;
  tokenCount: number;
  actualCostMicrodollars: number;
  phasesTotal: number;
  phasesCompleted: number;
  phases: PhaseData[];
};

type PhaseData = {
  phaseNumber: number;
  status: string;
  tokensUsed: number;
  findingsCount: number;
  criticalCount: number;
  durationMs: number | null;
};

// ─── Helper functions ─────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDuration(ms: number | null): string {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Phase Status Icon ────────────────────────────────────────────────────

function PhaseStatusIcon({ status }: { status: string }) {
  if (status === "completed" || status === "skipped") {
    return (
      <div className="w-5 h-5 rounded-md bg-success-subtle flex items-center justify-center text-success">
        <CheckIcon />
      </div>
    );
  }
  if (status === "running") {
    return (
      <div className="w-5 h-5 rounded-md bg-accent-subtle flex items-center justify-center">
        <div className="w-2 h-2 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="w-5 h-5 rounded-md bg-destructive-subtle flex items-center justify-center text-destructive">
        <XIcon size={10} />
      </div>
    );
  }
  // pending
  return (
    <div className="w-5 h-5 rounded-md bg-elevated flex items-center justify-center">
      <div className="w-1.5 h-1.5 rounded-full bg-text-muted opacity-30" />
    </div>
  );
}

// ─── AuditProgress component ──────────────────────────────────────────────

export function AuditProgress({ audit }: { audit: AuditData }) {
  const [status, setStatus] = useState(audit.status);
  const [phasesTotal, setPhasesTotal] = useState(audit.phasesTotal || PHASE_NAMES.length);
  const [phasesCompleted, setPhasesCompleted] = useState(audit.phasesCompleted || 0);
  const [totalTokens, setTotalTokens] = useState(audit.tokenCount || 0);
  const [totalCostMicro, setTotalCostMicro] = useState(audit.actualCostMicrodollars || 0);
  const [phases, setPhases] = useState<Map<number, PhaseData>>(() => {
    const m = new Map<number, PhaseData>();
    for (const p of audit.phases ?? []) {
      m.set(p.phaseNumber, p);
    }
    return m;
  });
  const [expanded, setExpanded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  // Kick off the audit engine when status is "queued"
  useEffect(() => {
    if (status !== "queued") return;
    fetch(`/api/audit/${audit.id}`, { method: "POST" }).catch((err) =>
      console.error("Failed to start audit:", err)
    );
  }, [audit.id, status]);

  // SSE connection
  useEffect(() => {
    if (["completed", "cancelled", "failed"].includes(status)) return;

    const es = new EventSource(`/api/audit/${audit.id}/stream`);
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "phase") {
        setPhases((prev) =>
          new Map(prev).set(data.phaseNumber, {
            phaseNumber: data.phaseNumber,
            status: data.status,
            tokensUsed: data.tokensUsed,
            findingsCount: data.findingsCount,
            criticalCount: data.criticalCount,
            durationMs: data.durationMs,
          })
        );
      } else if (data.type === "audit") {
        setStatus(data.status);
        setPhasesTotal(data.phasesTotal);
        setPhasesCompleted(data.phasesCompleted);
        setTotalTokens(data.totalTokens);
        setTotalCostMicro(data.totalCostMicro);
      }
    };
    es.onerror = () => {
      // Don't close — let EventSource auto-reconnect.
      // Only close if audit is done (terminal states handled above).
    };
    return () => es.close();
  }, [audit.id, status]);

  // Elapsed time timer
  useEffect(() => {
    if (!audit.startedAt) return;
    if (!["queued", "running"].includes(status)) return;

    const startMs = new Date(audit.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [audit.startedAt, status]);

  // Cancel handler
  const handleCancel = async () => {
    setCancelling(true);
    try {
      await fetch(`/api/audit/${audit.id}/cancel`, { method: "POST" });
      // Status will update via SSE
    } catch {
      setCancelling(false);
    }
  };

  // Derived state
  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled";
  const isFailed = status === "failed";
  const isRunning = status === "running" || status === "queued";

  const progressPercent = phasesTotal > 0 ? (phasesCompleted / phasesTotal) * 100 : 0;
  const currentPhaseIndex = phasesCompleted < phasesTotal ? phasesCompleted : phasesTotal - 1;

  // Progress bar style
  let barStyle: React.CSSProperties = {};
  if (isCompleted) {
    barStyle = {
      background: "linear-gradient(90deg, var(--success), #4ade80)",
    };
  } else if (isCancelled || isFailed) {
    barStyle = {
      background: "var(--destructive)",
    };
  } else {
    barStyle = {
      background: "linear-gradient(90deg, var(--accent), #f59e0b)",
      animation: "progressPulse 2s infinite",
    };
  }

  // Title color/text
  let titleText = "Audit in Progress...";
  let titleClass = "";
  if (isCompleted) {
    titleText = "Audit Complete";
    titleClass = "text-success";
  } else if (isCancelled) {
    titleText = "Audit Cancelled";
    titleClass = "text-destructive";
  } else if (isFailed) {
    titleText = "Audit Failed";
    titleClass = "text-destructive";
  }

  const phaseLabel = isCompleted
    ? "All phases complete"
    : `Phase ${currentPhaseIndex + 1}: ${PHASE_NAMES[currentPhaseIndex] ?? ""}`;

  return (
    <div className="p-9 px-10 max-w-[720px]">
      {/* Header — PROG-01 */}
      <div className="fade-in mb-2">
        <span className="font-mono text-[13px] text-text-muted">{audit.folderName}</span>
        <span className="mx-2 text-border">·</span>
        <Badge>{AUDIT_TYPE_LABELS[audit.auditType] ?? audit.auditType}</Badge>
        <span className="mx-1" />
        <Badge color="var(--accent)">
          {audit.depth.charAt(0).toUpperCase() + audit.depth.slice(1)}
        </Badge>
      </div>

      <h1 className={`text-2xl font-bold tracking-tight mb-8 ${titleClass}`}>
        {titleText}
      </h1>

      {/* Progress Bar — PROG-02 */}
      <div className="fade-in stagger-1 mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-[13px] font-medium">{phaseLabel}</span>
          <span className="text-[13px] font-semibold font-mono">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="h-2 rounded bg-elevated overflow-hidden">
          <div
            className="h-full rounded transition-[width] duration-300 ease-out"
            style={{ width: `${progressPercent}%`, ...barStyle }}
          />
        </div>
      </div>

      {/* Live Stats — PROG-03 */}
      <div className="fade-in stagger-2 flex gap-6 mb-7 text-[13px] text-text-muted">
        <span className="font-mono">{totalTokens.toLocaleString()} tokens</span>
        <span>·</span>
        <span className="font-mono">${(totalCostMicro / 1_000_000).toFixed(2)}</span>
        <span>·</span>
        <span>{formatElapsed(elapsed)}</span>
      </div>

      {/* Action Buttons — PROG-04 / PROG-06 */}
      <div className="flex gap-2.5 mb-7">
        {isCompleted ? (
          <Button
            variant="primary"
            size="lg"
            className="bg-success hover:bg-success/90"
            asChild
          >
            <Link href={`/audit/${audit.id}/results`}>View Results</Link>
          </Button>
        ) : isRunning ? (
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelling}
          >
            <XIcon size={14} />
            {cancelling ? "Cancelling..." : "Cancel Audit"}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Hide" : "Show"} details
        </Button>
      </div>

      {/* Expandable Phase List — PROG-05 */}
      {expanded && (
        <div className="fade-in bg-surface border border-border rounded-[14px] overflow-hidden">
          {PHASE_NAMES.slice(0, phasesTotal).map((phaseName, i) => {
            const phase = phases.get(i);
            const phaseStatus = phase?.status ?? "pending";
            const isPending = phaseStatus === "pending";
            const isPhaseRunning = phaseStatus === "running";
            const isPhaseCompleted =
              phaseStatus === "completed" || phaseStatus === "skipped";

            return (
              <div
                key={i}
                className={`grid grid-cols-[28px_1fr_80px_70px_60px] items-center py-3 px-4.5 ${
                  i < phasesTotal - 1 ? "border-b border-border-subtle" : ""
                } ${isPending ? "opacity-40" : ""}`}
              >
                {/* Status icon */}
                <PhaseStatusIcon status={phaseStatus} />

                {/* Phase name */}
                <span
                  className={`text-[13px] ${isPhaseRunning ? "font-semibold" : "font-normal"}`}
                >
                  {phaseName}
                </span>

                {/* Findings count */}
                <span className="text-xs text-text-muted">
                  {isPhaseCompleted ? `${phase!.findingsCount} findings` : "—"}
                </span>

                {/* Duration */}
                <span className="text-xs font-mono text-text-muted">
                  {isPhaseCompleted ? formatDuration(phase!.durationMs) : "—"}
                </span>

                {/* Cost estimate */}
                <span className="text-xs font-mono text-text-muted">
                  {isPhaseCompleted
                    ? `$${((phase!.tokensUsed * 3) / 1_000_000).toFixed(2)}`
                    : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
