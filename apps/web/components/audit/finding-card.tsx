"use client";

import { useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import type { AuditFinding } from "@codeaudit-ai/db";
import { SeverityBadge } from "./severity-badge";

const SEVERITY_BORDER_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
  info: "#71717a",
};

type FindingCardProps = {
  finding: AuditFinding;
};

export function FindingCard({ finding }: FindingCardProps) {
  const [open, setOpen] = useState(false);

  const fileInfo = finding.filePaths && finding.filePaths.length > 0
    ? [
        finding.filePaths.join(", "),
        finding.lineNumbers && finding.lineNumbers.length > 0
          ? `L${finding.lineNumbers.join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join(" : ")
    : null;

  const borderColor = SEVERITY_BORDER_COLORS[finding.severity] ?? "#71717a";

  return (
    <div
      className="rounded-[14px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 flex flex-col gap-2.5 transition-shadow duration-150 hover:shadow-md hover:shadow-black/5"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {/* Header row: badge + title + category */}
      <div className="flex items-center gap-2 flex-wrap">
        <SeverityBadge severity={finding.severity} />
        <span className="font-semibold text-sm">{finding.title}</span>
        {finding.category && (
          <span className="inline-flex items-center rounded-md bg-[hsl(var(--elevated))] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {finding.category}
          </span>
        )}
      </div>

      {/* File path */}
      {fileInfo && (
        <p className="text-xs font-mono text-[hsl(var(--accent))]">{fileInfo}</p>
      )}

      {/* Evidence / description */}
      <p className="text-sm text-muted-foreground leading-relaxed">{finding.description}</p>

      {/* Collapsible remediation */}
      {finding.recommendation && (
        <Collapsible.Root open={open} onOpenChange={setOpen}>
          <Collapsible.Trigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5">
            <span
              className="inline-block transition-transform duration-200 text-[10px]"
              style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              ▶
            </span>
            Remediation
          </Collapsible.Trigger>
          <Collapsible.Content className="mt-2.5 text-sm text-muted-foreground leading-relaxed rounded-lg bg-[hsl(var(--elevated))] px-3.5 py-3 border-l-2 border-[hsl(var(--accent))]">
            {finding.recommendation}
          </Collapsible.Content>
        </Collapsible.Root>
      )}
    </div>
  );
}
