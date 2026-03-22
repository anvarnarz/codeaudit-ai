import Link from "next/link";
import { ScanSearch, KeyRound, History } from "lucide-react";
import { getDb, audits } from "@codeaudit/db";
import { desc } from "drizzle-orm";

const AUDIT_TYPE_LABELS: Record<string, string> = {
  full: "Full Audit",
  security: "Security-Only",
  "team-collaboration": "Team & Collaboration",
  "code-quality": "Code Quality",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  queued:    { label: "Queued",    className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  running:   { label: "Running",   className: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  completed: { label: "Completed", className: "bg-green-500/10 text-green-400 border border-green-500/20" },
  failed:    { label: "Failed",    className: "bg-red-500/10 text-red-400 border border-red-500/20" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground border border-border" },
};

function formatRelativeDate(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default async function DashboardPage() {
  const db = getDb();
  const recentAudits = db
    .select({
      id: audits.id,
      folderName: audits.folderName,
      folderPath: audits.folderPath,
      auditType: audits.auditType,
      depth: audits.depth,
      status: audits.status,
      createdAt: audits.createdAt,
    })
    .from(audits)
    .orderBy(desc(audits.createdAt))
    .limit(10)
    .all();

  const quickActions = [
    {
      title: "New Audit",
      description: "Select a local folder and start a comprehensive codebase analysis.",
      href: "/audit/new",
      icon: ScanSearch,
      cta: "Start audit",
    },
    {
      title: "Audit History",
      description: "Review your previous audit results and compare over time.",
      href: "/history",
      icon: History,
      cta: "View history",
    },
    {
      title: "API Keys",
      description: "Add your Anthropic, OpenAI, or Gemini key to run audits.",
      href: "/settings/api-keys",
      icon: KeyRound,
      cta: "Manage keys",
    },
  ] as const;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Run a codebase audit or review your previous results.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-lg border border-border bg-card p-5 hover:border-white/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
                <action.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
            </div>
            <h2 className="text-sm font-medium text-foreground mb-1">{action.title}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">Recent audits</h2>
          <Link
            href="/history"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>

        {recentAudits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ScanSearch className="h-8 w-8 text-muted-foreground/40 mb-3" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No audits yet</p>
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
          <div className="divide-y divide-border/50">
            {recentAudits.map((audit) => {
              const badge = STATUS_BADGE[audit.status] ?? STATUS_BADGE.queued!;
              const typeLabel = AUDIT_TYPE_LABELS[audit.auditType] ?? audit.auditType;
              const depthLabel = audit.depth === "quick" ? "Quick" : "Deep";
              const date = audit.createdAt ?? new Date();

              return (
                <Link
                  key={audit.id}
                  href={`/audit/${audit.id}/queued`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{audit.folderName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {typeLabel} · {depthLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeDate(date)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
