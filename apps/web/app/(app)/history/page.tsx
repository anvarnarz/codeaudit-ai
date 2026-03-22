import Link from "next/link";
import { getDb, audits } from "@codeaudit-ai/db";
import { desc } from "drizzle-orm";
import type { AuditFindings } from "@codeaudit-ai/db";

// ---------------------------------------------------------------
// Helpers (inline — do not import from dashboard)
// ---------------------------------------------------------------

const AUDIT_TYPE_LABELS: Record<string, string> = {
  full: "Full Audit",
  security: "Security-Only",
  "team-collaboration": "Team & Collaboration",
  "code-quality": "Code Quality",
};

const GRADE_COLOR: Record<string, string> = {
  A: "text-green-400",
  B: "text-blue-400",
  C: "text-yellow-400",
  D: "text-orange-400",
  F: "text-red-400",
};

function formatRelativeDate(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------

export default async function HistoryPage() {
  const db = getDb();
  const rows = db
    .select({
      id: audits.id,
      folderPath: audits.folderPath,
      folderName: audits.folderName,
      auditType: audits.auditType,
      depth: audits.depth,
      status: audits.status,
      findings: audits.findings,
      createdAt: audits.createdAt,
    })
    .from(audits)
    .orderBy(desc(audits.createdAt))
    .all();

  // Group by folderPath — rows are already newest-first, so index 0 = latest
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    if (!grouped.has(row.folderPath)) grouped.set(row.folderPath, []);
    grouped.get(row.folderPath)!.push(row);
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Audit History
        </h1>
        <p className="mt-1 text-muted-foreground">
          All past audits grouped by folder.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">No audits yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Run your first audit to see results here.
          </p>
          <Link
            href="/audit/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/15 transition-colors"
          >
            Start an audit
          </Link>
        </div>
      ) : (
        <div>
          {Array.from(grouped.entries()).map(([folderPath, folderAudits]) => {
            const latest = folderAudits[0]!;
            const previous = folderAudits[1];
            const hasCompare = folderAudits.length >= 2;

            return (
              <div
                key={folderPath}
                className="rounded-lg border border-border divide-y divide-border/50 mb-4"
              >
                {/* Folder header */}
                <div className="px-5 py-3 bg-muted/20 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {latest.folderName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {folderPath}
                    </p>
                  </div>
                </div>

                {/* Audit rows */}
                {folderAudits.map((audit) => {
                  const typeLabel =
                    AUDIT_TYPE_LABELS[audit.auditType] ?? audit.auditType;
                  const depthLabel = audit.depth === "quick" ? "Quick" : "Deep";
                  const date = audit.createdAt ?? new Date();
                  const findings = audit.findings as AuditFindings | null;
                  const score = findings?.summary?.score;
                  const grade = findings?.summary?.grade;

                  return (
                    <Link
                      key={audit.id}
                      href={`/audit/${audit.id}/results`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {typeLabel} · {depthLabel}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {formatRelativeDate(date)}
                        </p>
                      </div>

                      {score != null && grade != null ? (
                        <span
                          className={`text-xs font-medium tabular-nums flex-shrink-0 ml-4 ${GRADE_COLOR[grade] ?? "text-muted-foreground"}`}
                        >
                          {score} / 100 · {grade}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40 flex-shrink-0 ml-4 capitalize">
                          {audit.status}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* Compare button — only when 2+ audits in folder */}
                {hasCompare && (
                  <div className="px-5 py-3 flex justify-end">
                    <Link
                      href={`/audit/compare?a=${latest.id}&b=${previous!.id}`}
                      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-secondary/50 transition-colors"
                    >
                      Compare latest two
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
