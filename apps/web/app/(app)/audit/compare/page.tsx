import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb, audits } from "@codeaudit/db";
import { eq } from "drizzle-orm";
import type { AuditFinding, AuditFindings } from "@codeaudit/db";
import { FindingCard } from "@/components/audit/finding-card";
import { SeverityChart } from "@/components/audit/severity-chart";

// ---------------------------------------------------------------
// Helpers (inline — consistent with other pages in this codebase)
// ---------------------------------------------------------------

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
// Diff logic — pure function, Set-based matching
// Match key: title + "|" + first filePath (or empty string)
// ---------------------------------------------------------------

function diffFindings(
  newerFindings: AuditFinding[],
  olderFindings: AuditFinding[],
): {
  newFindings: AuditFinding[];
  resolvedFindings: AuditFinding[];
  persistedFindings: AuditFinding[];
} {
  const key = (f: AuditFinding) => `${f.title}|${f.filePaths?.[0] ?? ""}`;
  const newerKeys = new Set(newerFindings.map(key));
  const olderKeys = new Set(olderFindings.map(key));
  return {
    newFindings: newerFindings.filter((f) => !olderKeys.has(key(f))),
    resolvedFindings: olderFindings.filter((f) => !newerKeys.has(key(f))),
    persistedFindings: newerFindings.filter((f) => olderKeys.has(key(f))),
  };
}

// ---------------------------------------------------------------
// Section helper — returns null when count === 0 (no empty headers)
// ---------------------------------------------------------------

function Section({
  title,
  count,
  accentClass,
  borderClass,
  children,
}: {
  title: string;
  count: number;
  accentClass: string;
  borderClass: string;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className={`rounded-lg border p-4 flex flex-col gap-3 ${borderClass}`}>
      <h2 className={`text-sm font-semibold ${accentClass}`}>
        {title}{" "}
        <span className="font-normal text-muted-foreground">({count})</span>
      </h2>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;

  // Both IDs are required
  if (!a || !b) {
    return (
      <div className="p-8 max-w-4xl">
        <div className="rounded-lg border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Two audit IDs are required. Use the Compare button from the History
            page.
          </p>
          <Link
            href="/history"
            className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to History
          </Link>
        </div>
      </div>
    );
  }

  const db = getDb();
  const newerAudit = db.select().from(audits).where(eq(audits.id, a)).get();
  const olderAudit = db.select().from(audits).where(eq(audits.id, b)).get();

  if (!newerAudit || !olderAudit) notFound();

  // Both audits must have completed findings
  if (!newerAudit.findings || !olderAudit.findings) {
    return (
      <div className="p-8 max-w-4xl">
        <Link
          href="/history"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to History
        </Link>
        <div className="mt-6 rounded-lg border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            One or both audits have no findings data. Comparison requires
            completed audits.
          </p>
        </div>
      </div>
    );
  }

  // Cast to typed findings (stored as JSON in SQLite)
  const newerFindings = newerAudit.findings as AuditFindings;
  const olderFindings = olderAudit.findings as AuditFindings;

  // Score delta
  const newerScore = newerFindings.summary.score;
  const olderScore = olderFindings.summary.score;
  const delta = newerScore - olderScore;
  const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`;
  const deltaColor =
    delta > 0
      ? "text-green-400"
      : delta < 0
        ? "text-red-400"
        : "text-muted-foreground";

  // Diff findings into three categories
  const { newFindings, resolvedFindings, persistedFindings } = diffFindings(
    newerFindings.findings,
    olderFindings.findings,
  );

  const olderDate = olderAudit.createdAt ?? new Date();
  const newerDate = newerAudit.createdAt ?? new Date();

  return (
    <div className="p-8 max-w-4xl flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/history"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to History
      </Link>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {newerAudit.folderName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Comparison report · {formatRelativeDate(olderDate)} vs{" "}
          {formatRelativeDate(newerDate)}
        </p>
      </div>

      {/* Score delta banner */}
      <div className="rounded-lg border border-border p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Health score</p>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">
              {olderScore} → {newerScore} / 100
            </span>
          </div>
        </div>
        <span className={`text-3xl font-bold ${deltaColor}`}>{deltaLabel}</span>
      </div>

      {/* Side-by-side severity charts */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Previous</p>
          <SeverityChart counts={olderFindings.summary.findings_count} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Latest</p>
          <SeverityChart counts={newerFindings.summary.findings_count} />
        </div>
      </div>

      {/* New findings — present in newer, absent in older */}
      <Section
        title="New findings"
        count={newFindings.length}
        accentClass="text-red-400"
        borderClass="border-red-500/20 bg-red-500/5"
      >
        {newFindings.map((f) => (
          <FindingCard key={f.id} finding={f} />
        ))}
      </Section>

      {/* Resolved findings — present in older, absent in newer */}
      <Section
        title="Resolved findings"
        count={resolvedFindings.length}
        accentClass="text-green-400"
        borderClass="border-green-500/20 bg-green-500/5"
      >
        {resolvedFindings.map((f) => (
          <FindingCard key={f.id} finding={f} />
        ))}
      </Section>

      {/* Persisted findings — present in both */}
      <Section
        title="Persisted findings"
        count={persistedFindings.length}
        accentClass="text-muted-foreground"
        borderClass="border-border bg-muted/10"
      >
        {persistedFindings.map((f) => (
          <FindingCard key={f.id} finding={f} />
        ))}
      </Section>

      {/* Empty state — shown only when all three sections are empty */}
      {newFindings.length === 0 &&
        resolvedFindings.length === 0 &&
        persistedFindings.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No findings in either audit — nothing to compare.
          </p>
        )}
    </div>
  );
}
