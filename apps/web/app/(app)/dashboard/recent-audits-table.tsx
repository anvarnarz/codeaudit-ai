"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { HealthScore } from "@/components/ui/health-score";
import { cn } from "@/lib/utils";

export type AuditRow = {
  id: string;
  folderName: string;
  auditType: string;
  depth: string;
  status: string;
  score: number | null;
  createdAt: string; // ISO string
};

function FolderIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-muted shrink-0"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-muted"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

interface RecentAuditsTableProps {
  audits: AuditRow[];
}

export function RecentAuditsTable({ audits }: RecentAuditsTableProps) {
  const router = useRouter();

  const typeLabel: Record<string, string> = {
    full: "Full Audit",
    security: "Security Only",
    "team-collaboration": "Team & Collab",
    "code-quality": "Code Quality",
  };

  if (audits.length === 0) {
    return (
      <div className="p-10 text-center text-text-muted text-sm">
        No audits yet. Start your first audit to see results here.
      </div>
    );
  }

  return (
    <>
      {audits.map((audit, i) => {
        const label = typeLabel[audit.auditType] ?? audit.auditType;
        const depthLabel = audit.depth === "deep" ? "Deep" : "Quick";
        const date = audit.createdAt
          ? new Date(audit.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "";

        return (
          <div
            key={audit.id}
            className={cn(
              "grid items-center py-3.5 px-5 transition-colors duration-150 hover:bg-hover cursor-pointer",
              i < audits.length - 1 && "border-b border-border-subtle"
            )}
            style={{ gridTemplateColumns: "1.5fr 1fr 0.8fr 0.6fr 80px 40px" }}
            onClick={() => router.push(`/audit/${audit.id}/results`)}
          >
            {/* Folder name */}
            <div className="flex items-center gap-2.5">
              <FolderIcon />
              <span className="text-[13px] font-medium font-mono">{audit.folderName}</span>
            </div>
            {/* Date */}
            <span className="text-xs text-text-muted">{date}</span>
            {/* Type badge */}
            <div className="flex gap-1.5">
              <Badge>{label}</Badge>
            </div>
            {/* Depth badge */}
            <Badge color={audit.depth === "deep" ? "var(--accent)" : undefined}>
              {depthLabel}
            </Badge>
            {/* Health score */}
            <div className="flex justify-end">
              {audit.score !== null ? (
                <HealthScore score={audit.score} size="sm" />
              ) : (
                <span className="text-xs text-text-muted">—</span>
              )}
            </div>
            {/* Edit button */}
            <div className="flex justify-end">
              <Link
                href="/audit/new"
                className="w-[30px] h-[30px] rounded-lg flex items-center justify-center hover:bg-elevated transition-colors no-underline"
                onClick={(e) => e.stopPropagation()}
              >
                <EditIcon />
              </Link>
            </div>
          </div>
        );
      })}
    </>
  );
}
