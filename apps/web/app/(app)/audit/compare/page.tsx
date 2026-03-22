import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb, audits } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import type { AuditFinding, AuditFindings } from "@codeaudit-ai/db";
import { FindingCard } from "@/components/audit/finding-card";
import { SeverityChart } from "@/components/audit/severity-chart";
import { HealthScore } from "@/components/ui/health-score";

// ---------------------------------------------------------------
// Helpers
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
// Diff logic
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
// Section component
// ---------------------------------------------------------------

function Section({
  title,
  count,
  icon,
  accentColor,
  borderColor,
  bgColor,
  strikethrough,
  children,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  strikethrough?: boolean;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="fade-in">
      <h3
        className={`text-sm font-semibold mb-3 flex items-center gap-2 ${accentColor}`}
      >
        {icon}
        {title}{" "}
        <span className="font-normal text-muted-foreground">({count})</span>
      </h3>
      <div className="flex flex-col gap-1.5">
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Finding row for compare view
// ---------------------------------------------------------------

function CompareRow({
  finding,
  borderColor,
  bgColor,
  strikethrough,
}: {
  finding: AuditFinding;
  borderColor: string;
  bgColor: string;
  strikethrough?: boolean;
}) {
  const severityColors: Record<string, { color: string; label: string }> = {
    critical: { color: "#ef4444", label: "Critical" },
    high: { color: "#f97316", label: "High" },
    medium: { color: "#eab308", label: "Medium" },
    low: { color: "#3b82f6", label: "Low" },
    info: { color: "#71717a", label: "Info" },
  };
  const sev = severityColors[finding.severity] ?? severityColors.info;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-[10px] ${bgColor}`}
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border"
        style={{
          background: `${sev.color}18`,
          color: sev.color,
          borderColor: `${sev.color}30`,
        }}
      >
        {sev.label}
      </span>
      <span
        className={`text-sm ${strikethrough ? "line-through text-muted-foreground" : "text-foreground"}`}
      >
        {finding.title}
      </span>
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
      <div className="p-8 max-w-[920px]">
        <div className="rounded-[14px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Two audit IDs are required. Use the Compare button from the History
            page.
          </p>
          <Link
            href="/history"
            className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to History
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
      <div className="p-8 max-w-[920px]">
        <Link
          href="/history"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to History
        </Link>
        <div className="mt-6 rounded-[14px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            One or both audits have no findings data. Comparison requires
            completed audits.
          </p>
        </div>
      </div>
    );
  }

  const newerFindings = newerAudit.findings as AuditFindings;
  const olderFindings = olderAudit.findings as AuditFindings;

  const newerScore = newerFindings.summary.score;
  const olderScore = olderFindings.summary.score;
  const delta = newerScore - olderScore;
  const improved = delta > 0;
  const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`;

  const { newFindings, resolvedFindings, persistedFindings } = diffFindings(
    newerFindings.findings,
    olderFindings.findings,
  );

  const olderDate = olderAudit.createdAt ?? new Date();
  const newerDate = newerAudit.createdAt ?? new Date();
  const newerGrade = newerFindings.summary.grade;
  const olderGrade = olderFindings.summary.grade;

  return (
    <div className="p-8 max-w-[920px] flex flex-col gap-7">
      {/* Back link */}
      <Link
        href="/history"
        className="fade-in text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        &larr; Back to History
      </Link>

      {/* Page header */}
      <div className="fade-in">
        <p className="font-mono text-sm font-medium text-muted-foreground mb-1">
          {newerAudit.folderName}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Audit Comparison
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {formatRelativeDate(olderDate)} vs {formatRelativeDate(newerDate)}
        </p>
      </div>

      {/* Delta banner */}
      <div
        className={`fade-in stagger-1 flex items-center gap-4 p-5 rounded-[14px] border ${
          improved
            ? "bg-green-500/5 dark:bg-green-500/8 border-green-500/20"
            : delta < 0
              ? "bg-red-500/5 dark:bg-red-500/8 border-red-500/20"
              : "bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
        }`}
      >
        {/* Arrow icon in colored circle */}
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-[14px] shrink-0 ${
            improved
              ? "bg-green-500/15"
              : delta < 0
                ? "bg-red-500/15"
                : "bg-zinc-200 dark:bg-zinc-700"
          }`}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={
              improved
                ? "stroke-green-500"
                : delta < 0
                  ? "stroke-red-500"
                  : "stroke-muted-foreground"
            }
          >
            {improved ? (
              <>
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </>
            ) : (
              <>
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </>
            )}
          </svg>
        </div>

        <div>
          <div
            className={`text-2xl font-bold ${
              improved
                ? "text-green-500"
                : delta < 0
                  ? "text-red-500"
                  : "text-muted-foreground"
            }`}
          >
            {deltaLabel} points
          </div>
          <div className="text-sm text-muted-foreground">
            Score {improved ? "improved" : "degraded"} from {olderScore} to{" "}
            {newerScore}
          </div>
        </div>
      </div>

      {/* Side-by-side cards */}
      <div className="fade-in stagger-2 grid grid-cols-2 gap-4">
        {/* Previous */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[14px] p-5 text-center">
          <p className="text-xs text-muted-foreground mb-3">
            {formatRelativeDate(olderDate)} (Previous)
          </p>
          <div className="flex justify-center mb-4">
            <HealthScore score={olderScore} grade={olderGrade} size="lg" />
          </div>
          <SeverityChart counts={olderFindings.summary.findings_count} />
        </div>

        {/* Latest */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[14px] p-5 text-center">
          <p className="text-xs text-muted-foreground mb-3">
            {formatRelativeDate(newerDate)} (Latest)
          </p>
          <div className="flex justify-center mb-4">
            <HealthScore score={newerScore} grade={newerGrade} size="lg" />
          </div>
          <SeverityChart counts={newerFindings.summary.findings_count} />
        </div>
      </div>

      {/* Resolved findings (green) */}
      <Section
        title="Resolved"
        count={resolvedFindings.length}
        icon={
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        }
        accentColor="text-green-500"
        borderColor="#22c55e"
        bgColor="bg-green-500/5"
        strikethrough
      >
        {resolvedFindings.map((f) => (
          <CompareRow
            key={f.id}
            finding={f}
            borderColor="#22c55e"
            bgColor="bg-green-500/5 dark:bg-green-500/8"
            strikethrough
          />
        ))}
      </Section>

      {/* New findings (red) */}
      <Section
        title="New"
        count={newFindings.length}
        icon={
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        }
        accentColor="text-red-500"
        borderColor="#ef4444"
        bgColor="bg-red-500/5"
      >
        {newFindings.map((f) => (
          <CompareRow
            key={f.id}
            finding={f}
            borderColor="#ef4444"
            bgColor="bg-red-500/5 dark:bg-red-500/8"
          />
        ))}
      </Section>

      {/* Persisted findings (muted) */}
      <Section
        title="Persisted"
        count={persistedFindings.length}
        icon={
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        }
        accentColor="text-muted-foreground"
        borderColor="hsl(var(--border))"
        bgColor="bg-muted/10"
      >
        {persistedFindings.map((f) => (
          <CompareRow
            key={f.id}
            finding={f}
            borderColor="hsl(var(--muted-foreground))"
            bgColor="bg-zinc-100/50 dark:bg-zinc-800/30"
          />
        ))}
      </Section>

      {/* Empty state */}
      {newFindings.length === 0 &&
        resolvedFindings.length === 0 &&
        persistedFindings.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No findings in either audit &mdash; nothing to compare.
          </p>
        )}
    </div>
  );
}
