import Link from "next/link";
import { Plus, Clock, Key, Folder, Pencil } from "lucide-react";
import { getDb, audits } from "@codeaudit-ai/db";
import { desc } from "drizzle-orm";
import { HealthScore } from "@/components/ui/health-score";

const AUDIT_TYPE_LABELS: Record<string, string> = {
  full: "Full Audit",
  security: "Security-Only",
  "team-collaboration": "Team & Collaboration",
  "code-quality": "Code Quality",
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
      findings: audits.findings,
    })
    .from(audits)
    .orderBy(desc(audits.createdAt))
    .limit(10)
    .all();

  const quickActions = [
    { icon: Plus, label: "New Audit", desc: "Start a new codebase audit", href: "/audit/new", accent: true },
    { icon: Clock, label: "View History", desc: "Browse all past audits", href: "/history", accent: false },
    { icon: Key, label: "Manage Keys", desc: "Add or edit API keys", href: "/settings/api-keys", accent: false },
  ];

  return (
    <div style={{ padding: "36px 40px", maxWidth: 920 }}>
      <h1 className="fade-in" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 28, color: "var(--text)" }}>
        Dashboard
      </h1>

      {/* Quick actions — CSS hover instead of JS event handlers */}
      <style>{`
        .dash-card { transition: all 0.2s ease; }
        .dash-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(250,204,21,0.06); border-color: rgba(250,204,21,0.25) !important; }
        .dash-row { transition: background 0.15s; }
        .dash-row:hover { background: var(--hover); }
        .dash-edit { transition: background 0.15s; }
        .dash-edit:hover { background: var(--elevated); }
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 36 }}>
        {quickActions.map((a, i) => (
          <Link key={a.href} href={a.href} className={`dash-card fade-in stagger-${i + 1}`}
            style={{
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14,
              padding: 18, textDecoration: "none", color: "inherit",
            }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, marginBottom: 14,
              background: a.accent ? "var(--accent-subtle)" : "var(--elevated)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <a.icon style={{ width: 18, height: 18, color: a.accent ? "var(--accent)" : "var(--text-muted)" }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>{a.label}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{a.desc}</div>
          </Link>
        ))}
      </div>

      {/* Recent audits */}
      <div className="fade-in stagger-3">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Recent Audits</h2>
          <Link href="/history" style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, fontWeight: 500, textDecoration: "none" }}>
            View all &rarr;
          </Link>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          {recentAudits.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No audits yet</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", opacity: 0.6, marginTop: 4 }}>Run your first audit to see results here.</p>
              <Link href="/audit/new" style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 10, background: "var(--accent)", color: "#0a0a0b", padding: "6px 12px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                Start an audit
              </Link>
            </div>
          ) : (
            recentAudits.map((audit, i) => {
              const typeLabel = AUDIT_TYPE_LABELS[audit.auditType] ?? audit.auditType;
              const depthLabel = audit.depth === "quick" ? "Quick" : "Deep";
              const date = audit.createdAt ?? new Date();
              const findings = audit.findings as { summary?: { score?: number; grade?: string } } | null;
              const score = findings?.summary?.score;
              const grade = findings?.summary?.grade;

              return (
                <Link key={audit.id} href={`/audit/${audit.id}/results`} className="dash-row"
                  style={{
                    display: "grid", gridTemplateColumns: "1.5fr 1fr 0.8fr 0.6fr 80px 40px",
                    alignItems: "center", padding: "14px 20px", cursor: "pointer",
                    borderBottom: i < recentAudits.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    textDecoration: "none", color: "inherit",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Folder style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
                    <span style={{ fontSize: 13, fontWeight: 500, fontFamily: "var(--font-jetbrains-mono), monospace", color: "var(--text)" }}>
                      {audit.folderName}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatRelativeDate(date)}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: "0.02em", background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid rgba(250,204,21,0.19)" }}>
                      {typeLabel}
                    </span>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: "0.02em", background: audit.depth === "deep" ? "var(--accent-subtle)" : "rgba(113,113,122,0.12)", color: audit.depth === "deep" ? "var(--accent)" : "var(--text-muted)", border: `1px solid ${audit.depth === "deep" ? "rgba(250,204,21,0.19)" : "rgba(113,113,122,0.19)"}` }}>
                    {depthLabel}
                  </span>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    {score != null && grade != null ? (
                      <HealthScore score={score} grade={grade} size="sm" />
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>{audit.status}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Link href="/audit/new" className="dash-edit"
                      style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                      <Pencil style={{ width: 14, height: 14, color: "var(--text-muted)" }} />
                    </Link>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
