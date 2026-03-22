import type { FindingsSeverity } from "@codeaudit-ai/db";

const SEVERITY_STYLES: Record<FindingsSeverity, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high:     "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low:      "bg-blue-500/15 text-blue-400 border-blue-500/30",
  info:     "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

type SeverityBadgeProps = {
  severity: FindingsSeverity;
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium uppercase ${SEVERITY_STYLES[severity]}`}
    >
      {severity}
    </span>
  );
}
