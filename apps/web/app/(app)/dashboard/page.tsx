import Link from "next/link";
import { getDb, audits } from "@codeaudit-ai/db";
import { desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { RecentAuditsTable } from "./recent-audits-table";
import { cn } from "@/lib/utils";

// ─── Quick-action icon helper (server-safe SVGs) ──────────────────────────

function QuickActionIcon({ name, className }: { name: string; className?: string }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
  switch (name) {
    case "plus":
      return (
        <svg {...props}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15.5 14" />
        </svg>
      );
    case "key":
      return (
        <svg {...props}>
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Quick actions definition ─────────────────────────────────────────────

const quickActions = [
  {
    icon: "plus",
    label: "New Audit",
    desc: "Start a new codebase audit",
    href: "/audit/new",
    accent: true,
  },
  {
    icon: "clock",
    label: "View History",
    desc: "Browse all past audits",
    href: "/history",
    accent: false,
  },
  {
    icon: "key",
    label: "Manage Keys",
    desc: "Add or edit API keys",
    href: "/settings/api-keys",
    accent: false,
  },
] as const;

// ─── Dashboard page (server component) ───────────────────────────────────

export default async function DashboardPage() {
  const db = getDb();
  const recentAuditsRaw = db
    .select({
      id: audits.id,
      folderName: audits.folderName,
      auditType: audits.auditType,
      depth: audits.depth,
      status: audits.status,
      findings: audits.findings,
      createdAt: audits.createdAt,
    })
    .from(audits)
    .orderBy(desc(audits.createdAt))
    .limit(5)
    .all();

  // Serialize for client component (Date → ISO string, extract score)
  const recentAudits = recentAuditsRaw.map((a) => ({
    id: a.id,
    folderName: a.folderName,
    auditType: a.auditType,
    depth: a.depth,
    status: a.status,
    score: a.findings?.summary?.score ?? null,
    createdAt: a.createdAt ? a.createdAt.toISOString() : "",
  }));

  return (
    <div className="p-9 pl-10 max-w-[920px]">
      <h1 className="text-2xl font-bold tracking-[-0.03em] mb-7 fade-in">Dashboard</h1>

      {/* Quick action cards */}
      <div className="grid grid-cols-3 gap-3.5 mb-9">
        {quickActions.map((a, i) => (
          <Link key={a.href} href={a.href} className="no-underline text-inherit">
            <Card hover className="p-[18px]">
              <div className={cn("fade-in", `stagger-${i + 1}`)}>
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl mb-3.5 flex items-center justify-center",
                    a.accent ? "bg-accent-subtle" : "bg-elevated"
                  )}
                >
                  <QuickActionIcon
                    name={a.icon}
                    className={a.accent ? "text-accent" : "text-text-muted"}
                  />
                </div>
                <div className="text-sm font-semibold mb-1">{a.label}</div>
                <div className="text-xs text-text-muted">{a.desc}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent audits section */}
      <div className="fade-in stagger-3">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-[15px] font-semibold">Recent Audits</h2>
          <Link
            href="/history"
            className="text-accent text-xs font-medium no-underline hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="bg-surface border border-border rounded-[--radius-card] overflow-hidden">
          <RecentAuditsTable audits={recentAudits} />
        </div>
      </div>
    </div>
  );
}
