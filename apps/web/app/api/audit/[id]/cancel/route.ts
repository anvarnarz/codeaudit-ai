import { NextRequest, NextResponse } from "next/server";
import { getDb, audits } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";

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
  if (!["queued", "running"].includes(audit.status)) {
    return NextResponse.json(
      { error: `Cannot cancel audit with status "${audit.status}"` },
      { status: 409 },
    );
  }

  // Set cancelled flag — engine polls this between phases (orchestrator in plan 01)
  db.update(audits)
    .set({ status: "cancelled", completedAt: new Date() })
    .where(eq(audits.id, id))
    .run();

  return NextResponse.json({ cancelled: true }, { status: 200 });
}
