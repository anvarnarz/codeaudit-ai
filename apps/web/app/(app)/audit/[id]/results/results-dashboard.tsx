"use client";

import React, { useState } from "react";
import type { AuditFindings, AuditFinding } from "@codeaudit-ai/db";
import { HealthScore } from "@/components/ui/health-score";
import { SeverityBar } from "@/components/ui/severity-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SerializedAudit {
  id: string;
  folderName: string;
  folderPath: string;
  auditType: string;
  depth: string;
  findings: AuditFindings;
  tokenCount: number;
  actualCostMicrodollars: number;
  completedAt: string | null;
  startedAt: string | null;
}

interface SerializedPhase {
  phaseNumber: number;
  status: string;
  findings: AuditFinding[];
  tokensUsed: number;
  startedAt: string | null;
  completedAt: string | null;
}

interface ResultsDashboardProps {
  audit: SerializedAudit;
  phases: SerializedPhase[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SEVERITY_KEYS = ["critical", "high", "medium", "low", "info"] as const;

const SEVERITY_COLORS: Record<typeof SEVERITY_KEYS[number], { color: string; label: string }> = {
  critical: { color: "var(--severity-critical)", label: "Critical" },
  high: { color: "var(--severity-high)", label: "High" },
  medium: { color: "var(--severity-medium)", label: "Medium" },
  low: { color: "var(--severity-low)", label: "Low" },
  info: { color: "var(--severity-info)", label: "Info" },
};

const PHASE_NAMES: Record<number, string> = {
  0: "Bootstrap",
  1: "Project Structure",
  2: "Dependency Analysis",
  3: "Security Scan",
  4: "Code Quality",
  5: "Test Coverage",
  6: "Performance",
  7: "Architecture",
  8: "Documentation",
  9: "Error Handling",
  10: "Observability",
  11: "Report Generation",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(startIso: string | null, endIso: string | null): string {
  if (!startIso || !endIso) return "—";
  const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
  const diffSec = Math.max(0, Math.round(diffMs / 1000));
  const m = Math.floor(diffSec / 60);
  const s = diffSec % 60;
  return `${m}m ${s}s`;
}

function formatCost(microdollars: number): string {
  return `$${(microdollars / 1_000_000).toFixed(2)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getScoreAssessment(score: number): { text: string; color: string } {
  if (score > 70) return { text: "Healthy codebase", color: "var(--success)" };
  if (score > 40) return { text: "Needs improvement", color: "var(--warning)" };
  return { text: "Critical attention needed", color: "var(--destructive)" };
}

// ─── Chevron SVG ─────────────────────────────────────────────────────────────

function ChevronDown({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 5l4 4 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronUp({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 9l4-4 4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── ResultsDashboard component ───────────────────────────────────────────────

export function ResultsDashboard({ audit, phases }: ResultsDashboardProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [expandedFinding, setExpandedFinding] = useState<number | null>(null);
  const [costExpanded, setCostExpanded] = useState(false);

  const findings = audit.findings;
  const score = findings.summary.score;
  const findingsCount = findings.summary.findings_count;
  const totalFindings = findings.findings.length;
  const assessment = getScoreAssessment(score);

  // Filter findings by active severity
  const filteredFindings =
    activeFilter === "all"
      ? findings.findings
      : findings.findings.filter((f) => f.severity === activeFilter);

  // Per-phase cost estimation (proportional)
  const totalTokens = Math.max(audit.tokenCount, 1);
  const totalCost = audit.actualCostMicrodollars;

  return (
    <div className="p-9" style={{ maxWidth: 920 }}>

      {/* ── Header ── */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-sm text-text-muted">{audit.folderName}</span>
          <Badge>{audit.auditType}</Badge>
          <Badge color="var(--accent)">{audit.depth}</Badge>
        </div>
        <span className="text-[12px] text-text-muted">
          Completed {formatDate(audit.completedAt)}
          {" · "}
          {formatDuration(audit.startedAt, audit.completedAt)}
          {" · "}
          {formatCost(audit.actualCostMicrodollars)}
        </span>
      </div>

      {/* ── Score + Severity grid ── */}
      <div className="grid grid-cols-2 gap-4 mb-7">
        {/* Health Score card */}
        <Card>
          <div className="flex items-center gap-6">
            <HealthScore score={score} size="lg" />
            <div>
              <div className="text-[13px] text-text-muted mb-1">Health Score</div>
              <div
                className="font-mono font-bold"
                style={{ fontSize: 26, letterSpacing: "-0.03em" }}
              >
                {score} / 100
              </div>
              <div className="text-[12px] mt-1" style={{ color: assessment.color }}>
                {assessment.text}
              </div>
            </div>
          </div>
        </Card>

        {/* Severity Breakdown card */}
        <Card>
          <div className="text-[13px] text-text-muted mb-3">Severity Breakdown</div>
          <SeverityBar data={findingsCount} />
        </Card>
      </div>

      {/* ── Cost summary banner ── */}
      <div
        className="rounded-xl border border-border mb-7"
        style={{ background: "var(--bg-surface)" }}
      >
        <div className="flex justify-between items-center px-[18px] py-3 text-[13px]">
          <div className="flex items-center gap-3">
            <span>
              Total cost:{" "}
              <strong className="font-mono">
                {formatCost(audit.actualCostMicrodollars)}
              </strong>{" "}
              ({audit.tokenCount.toLocaleString()} tokens)
            </span>
            <button
              onClick={() => setCostExpanded(!costExpanded)}
              className="text-[12px] text-text-muted hover:text-accent transition-colors cursor-pointer flex items-center gap-1"
            >
              {costExpanded ? "Hide breakdown" : "Show breakdown"}
              {costExpanded ? (
                <ChevronUp color="var(--text-muted)" />
              ) : (
                <ChevronDown color="var(--text-muted)" />
              )}
            </button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/audit/${audit.id}/executive`} target="_blank" rel="noopener noreferrer">
                Executive Report
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/audit/${audit.id}/technical`} target="_blank" rel="noopener noreferrer">
                Technical Report
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/audit/${audit.id}/download`}>
                Download All
              </a>
            </Button>
          </div>
        </div>

        {/* Per-phase cost breakdown */}
        {costExpanded && phases.length > 0 && (
          <div className="border-t border-border px-[18px] py-3">
            <div className="flex flex-col gap-1.5">
              {phases
                .filter((p) => p.tokensUsed > 0)
                .map((phase) => {
                  const phaseCostMicro =
                    phase.tokensUsed * (totalCost / totalTokens);
                  return (
                    <div
                      key={phase.phaseNumber}
                      className="flex justify-between items-center text-[12px]"
                    >
                      <span className="text-text-muted">
                        Phase {phase.phaseNumber}:{" "}
                        {PHASE_NAMES[phase.phaseNumber] ?? `Phase ${phase.phaseNumber}`}
                      </span>
                      <span className="font-mono text-text-secondary">
                        {phase.tokensUsed.toLocaleString()} tokens ·{" "}
                        {formatCost(phaseCostMicro)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex gap-1.5 mb-[18px] flex-wrap">
        {/* All pill */}
        <button
          onClick={() => setActiveFilter("all")}
          className="px-3 py-1 rounded-lg border text-[12px] font-medium capitalize cursor-pointer transition-all"
          style={{
            background: activeFilter === "all" ? "var(--accent-subtle)" : "transparent",
            borderColor:
              activeFilter === "all" ? "var(--accent)" : "var(--border)",
            color: activeFilter === "all" ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          All ({totalFindings})
        </button>

        {/* Severity pills */}
        {SEVERITY_KEYS.map((key) => {
          const { color, label } = SEVERITY_COLORS[key];
          const count = findingsCount[key] ?? 0;
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className="px-3 py-1 rounded-lg border text-[12px] font-medium capitalize cursor-pointer transition-all"
              style={{
                background: isActive ? `${color}18` : "transparent",
                borderColor: isActive ? `${color}50` : "var(--border)",
                color: isActive ? color : "var(--text-muted)",
              }}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Findings list ── */}
      <div className="flex flex-col gap-2">
        {filteredFindings.length === 0 ? (
          <div className="text-center py-10 text-text-muted text-[13px]">
            No findings for the selected severity level.
          </div>
        ) : (
          filteredFindings.map((finding, i) => {
            const sevKey = SEVERITY_KEYS.includes(finding.severity as typeof SEVERITY_KEYS[number])
              ? (finding.severity as typeof SEVERITY_KEYS[number])
              : "info" as const;
            const { color, label } = SEVERITY_COLORS[sevKey];
            const isExpanded = expandedFinding === i;

            return (
              <div
                key={`${finding.id ?? "f"}-${i}`}
                onClick={() => setExpandedFinding(isExpanded ? null : i)}
                className="bg-surface border border-border rounded-xl p-3.5 cursor-pointer transition-all duration-150 hover:border-opacity-60"
                style={{
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <Badge color={color}>{label}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold mb-1">
                      {finding.title}
                    </div>
                    {finding.filePaths?.[0] && (
                      <div className="font-mono text-[12px] text-accent mb-1.5">
                        {finding.filePaths[0]}
                        {finding.lineNumbers?.[0] != null
                          ? `:${finding.lineNumbers[0]}`
                          : ""}
                      </div>
                    )}
                    <div className="text-[12px] text-text-muted leading-relaxed">
                      {finding.description}
                    </div>
                    {isExpanded && finding.recommendation && (
                      <div className="mt-3 bg-elevated rounded-lg p-3 text-[12px] text-text-secondary border-l-2 border-accent leading-relaxed">
                        <strong className="text-text">Remediation:</strong>{" "}
                        {finding.recommendation}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 mt-0.5">
                    {isExpanded ? (
                      <ChevronUp color="var(--text-muted)" />
                    ) : (
                      <ChevronDown color="var(--text-muted)" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
