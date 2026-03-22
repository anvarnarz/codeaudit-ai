import { NextRequest, NextResponse } from "next/server";
import { getDb, audits } from "@codeaudit/db";
import { eq } from "drizzle-orm";
import { runAudit } from "@codeaudit/audit-engine";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();

  const audit = db.select().from(audits).where(eq(audits.id, id)).get();
  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }
  if (audit.status !== "queued") {
    return NextResponse.json(
      { error: `Cannot start audit with status "${audit.status}"` },
      { status: 409 },
    );
  }
  if (!audit.apiKeyId) {
    return NextResponse.json({ error: "No API key associated with this audit" }, { status: 400 });
  }

  // Start the engine WITHOUT awaiting — detached async (anti-pattern prevention per RESEARCH.md)
  // The engine runs in background; this handler returns 202 immediately.
  void runAudit({
    auditId: audit.id,
    repoPath: audit.folderPath,
    auditOutputDir: audit.auditOutputDir,
    auditType: audit.auditType,
    depth: audit.depth,
    llmProvider: audit.llmProvider,
    apiKeyId: audit.apiKeyId,
    selectedModel: audit.selectedModel ?? null,
  }).catch((err) => {
    console.error(`[audit-engine] Unhandled error for audit ${id}:`, err);
    // Mark audit as failed in DB so UI can show error state
    db.update(audits)
      .set({ status: "failed", completedAt: new Date() })
      .where(eq(audits.id, id))
      .run();
  });

  return NextResponse.json({ started: true }, { status: 202 });
}
