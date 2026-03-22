import { NextRequest, NextResponse } from "next/server";
import archiver from "archiver";
import { Readable } from "node:stream";
import { getDb, audits } from "@codeaudit/db";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const audit = db.select().from(audits).where(eq(audits.id, id)).get();
  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const archive = archiver("zip", { zlib: { level: 6 } });

  // Attach error handler BEFORE finalize to prevent silent corruption
  archive.on("error", (err) => { throw err; });

  // Include all files in auditOutputDir (HTML dashboards, markdown reports, JSON, budget log, repo context)
  archive.directory(audit.auditOutputDir, false);

  // Append structured JSON from DB — BEFORE finalize (Pitfall 3: append before finalize)
  if (audit.findings) {
    archive.append(JSON.stringify(audit.findings, null, 2), { name: "findings-structured.json" });
  }

  archive.finalize();

  // Convert Node stream to Web stream for Next.js Route Handler
  const webStream = Readable.toWeb(archive as unknown as import("node:stream").Readable) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="audit-${audit.folderName}-${id.slice(0, 8)}.zip"`,
    },
  });
}
