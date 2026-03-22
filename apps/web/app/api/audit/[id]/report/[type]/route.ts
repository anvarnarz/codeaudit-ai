import path from "node:path";
import fs from "node:fs/promises";
import { getDb, audits } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;

  if (type !== "management" && type !== "technical") {
    return new Response("Invalid report type.", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const db = getDb();
  const audit = db.select().from(audits).where(eq(audits.id, id)).get();
  if (!audit) return new Response("Not found", { status: 404 });

  const htmlFile = type === "technical" ? "report-technical.html" : "report-management.html";
  const filePath = path.join(audit.auditOutputDir, htmlFile);

  try {
    const html = await fs.readFile(filePath, "utf-8");
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return new Response(
      "Report not available — audit may have been cancelled before Phase 11 completed.",
      { status: 404, headers: { "Content-Type": "text/plain" } }
    );
  }
}
