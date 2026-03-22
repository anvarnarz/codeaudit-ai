import Link from "next/link";
import { ScanSearch, KeyRound, History } from "lucide-react";

export default function DashboardPage() {
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
      </div>
    </div>
  );
}
