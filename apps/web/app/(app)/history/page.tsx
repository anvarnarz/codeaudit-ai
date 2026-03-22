import { getDb, audits } from "@codeaudit-ai/db";
import { desc } from "drizzle-orm";
import type { AuditFindings } from "@codeaudit-ai/db";
import { HistoryClient, type HistoryAudit } from "./history-client";

// ---------------------------------------------------------------
// Page (server component — fetches data, passes to client)
// ---------------------------------------------------------------

export default async function HistoryPage() {
  const db = getDb();
  const rows = db
    .select({
      id: audits.id,
      folderPath: audits.folderPath,
      folderName: audits.folderName,
      auditType: audits.auditType,
      depth: audits.depth,
      status: audits.status,
      findings: audits.findings,
      createdAt: audits.createdAt,
    })
    .from(audits)
    .orderBy(desc(audits.createdAt))
    .all();

  // Serialize rows for the client component
  const serialized: HistoryAudit[] = rows.map((row) => {
    const findings = row.findings as AuditFindings | null;
    return {
      id: row.id,
      folderPath: row.folderPath,
      folderName: row.folderName,
      auditType: row.auditType,
      depth: row.depth,
      status: row.status,
      score: findings?.summary?.score ?? null,
      grade: findings?.summary?.grade ?? null,
      createdAt: (row.createdAt ?? new Date()).toISOString(),
    };
  });

  return <HistoryClient audits={serialized} />;
}
