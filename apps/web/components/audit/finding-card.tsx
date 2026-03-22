"use client";

import { useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import type { AuditFinding } from "@codeaudit-ai/db";
import { SeverityBadge } from "./severity-badge";

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
        .join(" · ")
    : null;

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-2">
      {/* Header row: badge + title */}
      <div className="flex items-center gap-2 flex-wrap">
        <SeverityBadge severity={finding.severity} />
        <span className="font-medium text-sm">{finding.title}</span>
      </div>

      {/* File info row */}
      {fileInfo && (
        <p className="text-xs text-muted-foreground">{fileInfo}</p>
      )}

      {/* Description */}
      <p className="text-sm text-muted-foreground">{finding.description}</p>

      {/* Collapsible remediation */}
      {finding.recommendation && (
        <Collapsible.Root open={open} onOpenChange={setOpen}>
          <Collapsible.Trigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
            <span
              className="inline-block transition-transform duration-200"
              style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              ›
            </span>
            Remediation
          </Collapsible.Trigger>
          <Collapsible.Content className="mt-2 text-sm text-muted-foreground border-l-2 border-border pl-3">
            {finding.recommendation}
          </Collapsible.Content>
        </Collapsible.Root>
      )}
    </div>
  );
}
