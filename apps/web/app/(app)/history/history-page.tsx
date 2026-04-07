"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HealthScore } from "@/components/ui/health-score";
import { Modal } from "@/components/ui/modal";
import { deleteAudit, deleteAudits } from "@/actions/audit-delete";
import type { FolderGroup } from "./page";

// ─── Display label maps ───────────────────────────────────────────────────

const AUDIT_TYPE_LABELS: Record<string, string> = {
  "full": "Full Audit",
  "security": "Security Only",
  "team-collaboration": "Team & Collab",
  "code-quality": "Code Quality",
};

const DEPTH_LABELS: Record<string, string> = {
  "quick": "Quick",
  "deep": "Deep",
};

// ─── Inline SVG icons ─────────────────────────────────────────────────────

function FolderIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="4" />
      <polyline points="14 8 18 4 22 8" />
      <line x1="6" y1="4" x2="6" y2="20" />
      <polyline points="10 16 6 20 2 16" />
    </svg>
  );
}

// ─── Checkbox component ───────────────────────────────────────────────────

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          onChange();
        }
      }}
      className="flex items-center justify-center flex-shrink-0 rounded-md transition-all duration-150"
      style={{
        width: 20,
        height: 20,
        border: `1.5px solid ${checked ? "var(--accent)" : "var(--border)"}`,
        background: checked ? "var(--accent)" : "transparent",
        cursor: "pointer",
        padding: 0,
      }}
    >
      {checked && (
        <span style={{ color: "#0a0a0b" }}>
          <CheckIcon />
        </span>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────

interface HistoryPageProps {
  groups: FolderGroup[];
}

// ─── History page client component ───────────────────────────────────────

export function HistoryPage({ groups }: HistoryPageProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const allIds = groups.flatMap((g) => g.audits.map((a) => a.id));
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (showDeleteConfirm === "bulk") {
        await deleteAudits(Array.from(selected));
        setSelected(new Set());
      } else if (showDeleteConfirm?.startsWith("single:")) {
        const auditId = showDeleteConfirm.split(":")[1] ?? "";
        await deleteAudit(auditId);
      }
      setShowDeleteConfirm(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  const isBulkDelete = showDeleteConfirm === "bulk";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "var(--success)";
      case "failed":
      case "cancelled":
        return "var(--destructive)";
      default:
        return "var(--accent)";
    }
  };

  // ─── Empty state ─────────────────────────────────────────────────────

  if (groups.length === 0) {
    return (
      <div className="p-9 pl-10 max-w-[920px]">
        <h1 className="text-2xl font-bold tracking-tight mb-7">History</h1>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-text-muted text-[15px] mb-4">No audits yet</p>
          <Link
            href="/audit/new"
            className="text-accent text-sm font-medium no-underline hover:underline"
          >
            Start your first audit →
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main layout ─────────────────────────────────────────────────────

  return (
    <div className="p-9 pl-10 max-w-[920px]">
      {/* Header */}
      <div className="fade-in flex items-center justify-between mb-7">
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-transparent text-text-muted text-xs cursor-pointer hover:bg-hover transition-colors"
          >
            <Checkbox checked={allSelected} onChange={toggleAll} />
            Select all
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fade-in flex items-center justify-between bg-surface border border-accent/20 rounded-xl p-2.5 px-4 mb-4.5">
          <span className="text-[13px] font-medium">
            <span className="text-accent font-bold">{selected.size}</span>
            <span className="text-text-secondary">
              {" "}
              audit{selected.size > 1 ? "s" : ""} selected
            </span>
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              Deselect
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm("bulk")}
            >
              <TrashIcon />
              Delete selected
            </Button>
          </div>
        </div>
      )}

      {/* Folder groups */}
      {groups.map((group, gi) => (
        <div
          key={group.folder}
          className={`fade-in stagger-${Math.min(gi + 1, 5)} mb-7`}
        >
          {/* Folder header */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 text-text-muted">
              <FolderIcon />
              <span className="font-mono text-[14px] font-medium text-text">
                {group.folderName}
              </span>
              <span className="text-xs text-text-muted">
                ({group.audits.length} audit{group.audits.length > 1 ? "s" : ""})
              </span>
            </div>
            {group.audits.length >= 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  router.push(
                    `/audit/compare?a=${group.audits[0]?.id}&b=${group.audits[1]?.id}`
                  )
                }
              >
                <CompareIcon />
                Compare
              </Button>
            )}
          </div>

          {/* Audit rows */}
          <div className="bg-surface border border-border rounded-[--radius-card] overflow-hidden">
            {group.audits.map((audit, i) => {
              const isSelected = selected.has(audit.id);
              const isLast = i === group.audits.length - 1;
              const dateLabel = new Date(audit.createdAt).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" }
              );
              const typeLabel =
                AUDIT_TYPE_LABELS[audit.auditType] ?? audit.auditType;
              const depthLabel = DEPTH_LABELS[audit.depth] ?? audit.depth;

              return (
                <div
                  key={audit.id}
                  className="grid items-center py-3.5 px-5 cursor-pointer transition-colors duration-150"
                  style={{
                    gridTemplateColumns: "32px 1fr 1fr 0.7fr 80px 40px",
                    background: isSelected
                      ? "var(--accent-subtle)"
                      : undefined,
                    borderBottom: !isLast
                      ? "1px solid var(--border-subtle, var(--border))"
                      : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "";
                    }
                  }}
                  onClick={() => router.push(`/audit/${audit.id}/results`)}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleOne(audit.id)}
                  />

                  {/* Date */}
                  <span className="text-[13px] text-text-secondary">
                    {dateLabel}
                  </span>

                  {/* Type + Depth badges */}
                  <div className="flex gap-1.5">
                    <Badge>{typeLabel}</Badge>
                    <Badge
                      color={
                        audit.depth === "deep"
                          ? "var(--accent)"
                          : undefined
                      }
                    >
                      {depthLabel}
                    </Badge>
                  </div>

                  {/* Status */}
                  <span
                    className="text-[12px] flex items-center gap-1.5"
                    style={{ color: getStatusColor(audit.status) }}
                  >
                    ●{" "}
                    <span className="capitalize">{audit.status}</span>
                  </span>

                  {/* Health score */}
                  <div className="flex justify-end">
                    {audit.score !== null && (
                      <HealthScore score={audit.score} size="sm" />
                    )}
                  </div>

                  {/* Trash button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="w-[30px] h-[30px] rounded-lg border-none flex items-center justify-center cursor-pointer transition-colors duration-150 text-text-muted hover:bg-destructive-subtle hover:text-destructive"
                      style={{ background: "transparent" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(`single:${audit.id}`);
                      }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Delete confirmation modal */}
      <Modal
        open={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
      >
        {/* Header row: warning icon + title/description */}
        <div className="flex gap-3.5 mb-4.5">
          <div
            className="flex items-center justify-center flex-shrink-0 rounded-xl"
            style={{
              width: 44,
              height: 44,
              background: "var(--destructive-subtle)",
            }}
          >
            <span style={{ color: "var(--destructive)" }}>
              <TrashIcon />
            </span>
          </div>
          <div>
            <h3 className="text-[16px] font-bold mb-1">
              Delete audit{isBulkDelete && selected.size > 1 ? "s" : ""}?
            </h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              {isBulkDelete
                ? `This will permanently delete ${selected.size} selected audit${
                    selected.size > 1 ? "s" : ""
                  } and all associated reports.`
                : "This will permanently delete this audit and all associated reports."}
            </p>
          </div>
        </div>

        {/* Warning */}
        <p className="text-[12px] text-warning bg-warning-subtle p-2.5 rounded-lg mb-5">
          This action cannot be undone.
        </p>

        {/* Action buttons */}
        <div className="flex gap-2.5 justify-end">
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(null)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <TrashIcon />
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
