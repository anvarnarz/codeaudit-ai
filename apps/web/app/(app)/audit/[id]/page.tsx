import { notFound } from "next/navigation";
import { getDb, audits } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import { ProgressView } from "./progress-view";

const AUDIT_TYPE_LABEL: Record<string, string> = {
  full: "Full Audit",
  security: "Security Audit",
  "team-collaboration": "Team & Collaboration",
  "code-quality": "Code Quality",
};

export default async function AuditProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const audit = db.select().from(audits).where(eq(audits.id, id)).get();
  if (!audit) notFound();

  // Auto-start engine if queued (e.g. user navigated directly to this URL)
  if (audit.status === "queued") {
    // Fire-and-forget — don't block page render
    void fetch(
      `http://localhost:${process.env["PORT"] ?? "3000"}/api/audit/${id}`,
      { method: "POST" },
    ).catch(() => {/* engine start is best-effort */});
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      <div className="fade-in">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-sm text-muted-foreground">{audit.folderName}</span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center rounded-md bg-[hsl(var(--elevated))] border border-[hsl(var(--border))] px-2 py-0.5 text-[11px] font-medium">
            {AUDIT_TYPE_LABEL[audit.auditType] ?? audit.auditType}
          </span>
          <span className="inline-flex items-center rounded-md bg-[hsl(var(--accent))/0.1] border border-[hsl(var(--accent))/0.2] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--accent))]">
            {audit.depth === "quick" ? "Quick" : "Deep"}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Audit in Progress
        </h1>
      </div>
      <ProgressView auditId={id} initialStatus={audit.status} />
    </div>
  );
}
