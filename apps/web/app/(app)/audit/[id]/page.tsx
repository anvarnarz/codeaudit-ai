import { notFound } from "next/navigation";
import { getDb, audits } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import { ProgressView } from "./progress-view";

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
      <div>
        <h1 className="text-2xl font-semibold">{audit.folderName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {audit.auditType === "full" ? "Full Audit" :
           audit.auditType === "security" ? "Security Audit" :
           audit.auditType === "team-collaboration" ? "Team & Collaboration" :
           "Code Quality"} · {audit.depth === "quick" ? "Quick Scan" : "Deep Audit"}
        </p>
      </div>
      <ProgressView auditId={id} initialStatus={audit.status} />
    </div>
  );
}
