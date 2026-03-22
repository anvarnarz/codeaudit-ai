import { notFound } from "next/navigation";
import { getDb, audits, auditPhases } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import { ResultsView } from "./results-view";

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
      <div>
        <h1 className="text-2xl font-semibold">{audit.folderName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {audit.auditType === "full" ? "Full Audit" :
           audit.auditType === "security" ? "Security Audit" :
           audit.auditType === "team-collaboration" ? "Team & Collaboration" :
           "Code Quality"} · {audit.depth === "quick" ? "Quick Scan" : "Deep Audit"}
        </p>
      </div>
      <ResultsView auditId={id} audit={audit} phases={phases} />
    </div>
  );
}
