import Link from "next/link";
import { ScanSearch, KeyRound, History, Folder } from "lucide-react";
import { getDb, audits } from "@codeaudit-ai/db";
import { desc } from "drizzle-orm";
// HealthScore ring — available when audit results include a score
// import { HealthScore } from "@/components/ui/health-score";

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
      accent: true,
    },
    {
      title: "Audit History",
      description: "Review your previous audit results and compare over time.",
      href: "/history",
      icon: History,
      cta: "View history",
      accent: false,
    },
    {
      title: "API Keys",
      description: "Add your Anthropic, OpenAI, or Gemini key to run audits.",
      href: "/settings/api-keys",
      icon: KeyRound,
      cta: "Manage keys",
      accent: false,
    },
  ] as const;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8 fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Run a codebase audit or review your previous results.
        </p>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-9">
        {quickActions.map((action, i) => (
          <Link
            key={action.href}
            href={action.href}
            className={`fade-in stagger-${i + 1} group bg-[hsl(var(--surface))] border border-border rounded-[14px] p-5 hover:-translate-y-[1px] hover:shadow-lg transition-all duration-200`}
          >
            <div className="mb-3.5">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-[12px] ${
                  action.accent
                    ? "bg-[hsl(var(--accent-subtle))]"
                    : "bg-[hsl(var(--elevated))]"
                }`}
              >
                <action.icon
                  className={`h-[18px] w-[18px] ${
                    action.accent ? "text-[hsl(var(--accent))]" : "text-muted-foreground"
                  }`}
                  aria-hidden="true"
                />
              </div>
            </div>
            <h2 className="text-sm font-semibold text-foreground mb-1">{action.title}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Recent audits */}
      <div className="fade-in stagger-3">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-[15px] font-semibold text-foreground">Recent Audits</h2>
          <Link
            href="/history"
            className="text-xs font-medium text-[hsl(var(--accent))] hover:opacity-80 transition-opacity"
          >
            View all &rarr;
          </Link>
        </div>

        <div className="bg-[hsl(var(--surface))] border border-border rounded-[14px] overflow-hidden">
          {recentAudits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ScanSearch className="h-8 w-8 text-muted-foreground/40 mb-3" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No audits yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Run your first audit to see results here.
              </p>
              <Link
                href="/audit/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-[10px] bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm"
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
                    className="grid grid-cols-[1.5fr_1fr_0.8fr_0.6fr] items-center px-5 py-3.5 hover:bg-[hsl(var(--hover))] transition-colors"
                  >
                    {/* Folder name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground font-mono truncate">
                        {audit.folderName}
                      </span>
                    </div>

                    {/* Type & Depth badges */}
                    <div className="flex gap-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide bg-[hsl(var(--accent-subtle))] text-[hsl(var(--accent))] border border-[hsl(var(--accent)/0.2)]">
                        {typeLabel}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide bg-muted text-muted-foreground border border-border">
                        {depthLabel}
                      </span>
                    </div>

                    {/* Date */}
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeDate(date)}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
