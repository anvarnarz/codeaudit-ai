import path from "node:path";
import fs from "node:fs/promises";
import puppeteer from "puppeteer";
import { getDb, audits } from "@codeaudit/db";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;

  if (type !== "management" && type !== "technical") {
    return new Response("Invalid report type. Use 'management' or 'technical'.", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const db = getDb();
  const audit = db.select().from(audits).where(eq(audits.id, id)).get();
  if (!audit) return new Response("Not found", { status: 404 });

  const htmlFile = type === "technical" ? "report-technical.html" : "report-management.html";
  const filePath = path.join(audit.auditOutputDir, htmlFile);

  // Guard: check file exists — Phase 11 may have been skipped if audit was cancelled
  try {
    await fs.access(filePath);
  } catch {
    return new Response(
      "Report not available — audit may have been cancelled before Phase 11 completed.",
      { status: 404, headers: { "Content-Type": "text/plain" } }
    );
  }

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    // Use absolute file:// path (Pitfall 4: relative paths fail in Puppeteer)
    await page.goto(`file://${filePath}`, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="audit-${type}-${id.slice(0, 8)}.pdf"`,
      },
    });
  } finally {
    // Always close browser to prevent resource leaks
    await browser?.close();
  }
}
