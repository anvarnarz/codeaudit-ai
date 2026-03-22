import { notFound } from "next/navigation";
import { getDb, audits, auditPhases } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import { ResultsView } from "./results-view";

const AUDIT_TYPE_LABEL: Record<string, string> = {
  full: "Full Audit",
  security: "Security Audit",
  "team-collaboration": "Team & Collaboration",
  "code-quality": "Code Quality",
};

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const audit = db.select().from(audits).where(eq(audits.id, id)).get();
  if (!audit) notFound();

  const phases = db.select().from(auditPhases)
    .where(eq(auditPhases.auditId, id))
    .all();

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
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
        <h1 className="text-2xl font-bold tracking-tight">Audit Results</h1>
      </div>
      <ResultsView auditId={id} audit={audit} phases={phases} />
    </div>
  );
}
