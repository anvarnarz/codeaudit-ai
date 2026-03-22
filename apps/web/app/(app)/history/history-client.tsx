"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Folder,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import { deleteAudit, deleteAudits } from "@/actions/audit-delete";
import { HealthScore } from "@/components/ui/health-score";

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

export type HistoryAudit = {
  id: string;
  folderPath: string;
  folderName: string;
  auditType: string;
  depth: string;
  status: string;
  score: number | null;
  grade: string | null;
  createdAt: string; // ISO string
};

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

const AUDIT_TYPE_LABELS: Record<string, string> = {
  full: "Full Audit",
  security: "Security-Only",
  "team-collaboration": "Team & Collaboration",
  "code-quality": "Code Quality",
};

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ---------------------------------------------------------------
// Checkbox component
// ---------------------------------------------------------------

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
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onChange();
      }}
      className={`
        flex items-center justify-center w-5 h-5 rounded-md border-[1.5px] shrink-0
        transition-all duration-150 cursor-pointer
        ${
          checked
            ? "border-yellow-400 bg-yellow-400 dark:border-yellow-400 dark:bg-yellow-400"
            : "border-zinc-300 bg-transparent dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500"
        }
      `}
    >
      {checked && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0a0a0b"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------

function DeleteConfirmModal({
  count,
  onConfirm,
  onCancel,
  isPending,
}: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="fade-in w-full max-w-md mx-4 rounded-[14px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
        {/* Icon + title */}
        <div className="flex gap-3.5 mb-5">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 bg-red-500/10">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Delete {count} audit{count > 1 ? "s" : ""}?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              This will permanently delete{" "}
              {count > 1
                ? `${count} selected audits and all associated reports.`
                : "this audit and all associated reports."}
            </p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="rounded-lg px-3 py-2.5 mb-5 bg-orange-500/10 dark:bg-orange-500/10">
          <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
            This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 justify-end">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium rounded-[10px] border border-zinc-200 dark:border-zinc-700 bg-transparent text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium rounded-[10px] bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------

export function HistoryClient({ audits }: { audits: HistoryAudit[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<"bulk" | string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  // Group by folderPath — rows are already newest-first
  const grouped = new Map<string, HistoryAudit[]>();
  for (const row of audits) {
    if (!grouped.has(row.folderPath)) grouped.set(row.folderPath, []);
    grouped.get(row.folderPath)!.push(row);
  }

  const allIds = audits.map((a) => a.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };

  const handleDelete = () => {
    startTransition(async () => {
      if (deleteTarget === "bulk") {
        await deleteAudits(Array.from(selected));
        setSelected(new Set());
      } else if (deleteTarget) {
        await deleteAudit(deleteTarget);
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget);
          return next;
        });
      }
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const deleteCount =
    deleteTarget === "bulk" ? selected.size : deleteTarget ? 1 : 0;

  // ── Empty state ──
  if (audits.length === 0) {
    return (
      <div className="p-8 max-w-[920px]">
        <div className="fade-in mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All past audits grouped by folder.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-[14px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 py-16 text-center">
          <p className="text-sm text-muted-foreground">No audits yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Run your first audit to see results here.
          </p>
          <Link
            href="/audit/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-[10px] bg-yellow-400 text-zinc-900 px-4 py-2 text-xs font-semibold hover:bg-yellow-300 transition-colors"
          >
            Start an audit
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[920px]">
      {/* Header */}
      <div className="fade-in flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All past audits grouped by folder.
          </p>
        </div>
        <div
          onClick={toggleAll}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-xs cursor-pointer select-none"
          style={{ color: "var(--text-muted)" }}
        >
          <Checkbox checked={allSelected} onChange={toggleAll} />
          {allSelected ? "Deselect all" : "Select all"}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fade-in flex items-center justify-between px-4 py-2.5 rounded-xl mb-5 bg-zinc-50 dark:bg-zinc-900 border border-yellow-400/30">
          <span className="text-sm">
            <span className="font-bold text-yellow-500 dark:text-yellow-400">
              {selected.size}
            </span>
            <span className="text-muted-foreground">
              {" "}
              audit{selected.size > 1 ? "s" : ""} selected
            </span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Deselect
            </button>
            <button
              onClick={() => setDeleteTarget("bulk")}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete selected
            </button>
          </div>
        </div>
      )}

      {/* Folder groups */}
      {Array.from(grouped.entries()).map(([folderPath, folderAudits], gi) => {
        const latest = folderAudits[0]!;
        const previous = folderAudits[1];
        const hasCompare = folderAudits.length >= 2;

        return (
          <div
            key={folderPath}
            className={`fade-in stagger-${Math.min(gi + 1, 5)} mb-7`}
          >
            {/* Folder header */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm font-medium text-foreground">
                  {latest.folderName}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({folderAudits.length} audit
                  {folderAudits.length !== 1 ? "s" : ""})
                </span>
              </div>
              {hasCompare && (
                <Link
                  href={`/audit/compare?a=${latest.id}&b=${previous!.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Compare
                </Link>
              )}
            </div>

            {/* Audit rows card */}
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[14px] overflow-hidden">
              {folderAudits.map((audit, i) => {
                const typeLabel =
                  AUDIT_TYPE_LABELS[audit.auditType] ?? audit.auditType;
                const depthLabel =
                  audit.depth === "quick" ? "Quick" : "Deep";
                const isSelected = selected.has(audit.id);

                return (
                  <Link
                    key={audit.id}
                    href={`/audit/${audit.id}/results`}
                    className={`
                      grid grid-cols-[32px_1fr_auto_auto_60px_36px] items-center
                      px-5 py-3.5 transition-colors
                      ${i < folderAudits.length - 1 ? "border-b border-zinc-100 dark:border-zinc-800/60" : ""}
                      ${isSelected ? "bg-yellow-400/8 dark:bg-yellow-400/5" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"}
                    `}
                  >
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleOne(audit.id)}
                    />

                    {/* Folder name + date */}
                    <div className="min-w-0 pl-1">
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {folderPath}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                        {formatRelativeDate(audit.createdAt)}
                      </p>
                    </div>

                    {/* Type badge */}
                    <div className="flex gap-1.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 border border-yellow-400/20">
                        {typeLabel}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide border ${
                          audit.depth === "deep"
                            ? "bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 border-yellow-400/20"
                            : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                        }`}
                      >
                        {depthLabel}
                      </span>
                    </div>

                    {/* Health Score ring */}
                    <div className="flex justify-end px-2">
                      {audit.score != null && audit.grade != null ? (
                        <HealthScore
                          score={audit.score}
                          grade={audit.grade}
                          size="sm"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground/40 capitalize">
                          {audit.status}
                        </span>
                      )}
                    </div>

                    {/* Date (compact) */}
                    <div className="text-[11px] text-muted-foreground text-right tabular-nums">
                      {formatRelativeDate(audit.createdAt)}
                    </div>

                    {/* Delete button */}
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDeleteTarget(audit.id);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          count={deleteCount}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isPending={isPending}
        />
      )}
    </div>
  );
}
