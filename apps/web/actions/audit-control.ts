"use server";
import { getDb, audits } from "@codeaudit/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function cancelAudit(auditId: string): Promise<void> {
  const res = await fetch(
    `http://localhost:${process.env["PORT"] ?? "3000"}/api/audit/${auditId}/cancel`,
    { method: "POST" },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Cancel failed");
  }
}

export async function resumeAudit(auditId: string): Promise<void> {
  // Resume: set status back to "queued" then trigger engine start
  const db = getDb();
  const audit = db.select().from(audits).where(eq(audits.id, auditId)).get();
  if (!audit) throw new Error("Audit not found");
  if (!["cancelled", "failed"].includes(audit.status)) {
    throw new Error(`Cannot resume audit with status "${audit.status}"`);
  }

  // Reset status to queued — orchestrator will skip already-completed phases (checkpoint resume)
  db.update(audits)
    .set({ status: "queued", completedAt: null })
    .where(eq(audits.id, auditId))
    .run();

  // Trigger engine start
  await fetch(
    `http://localhost:${process.env["PORT"] ?? "3000"}/api/audit/${auditId}`,
    { method: "POST" },
  );

  redirect(`/audit/${auditId}`);
}
