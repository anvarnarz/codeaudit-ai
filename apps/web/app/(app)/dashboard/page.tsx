import { getDb, audits } from "@codeaudit-ai/db";
import { desc } from "drizzle-orm";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const db = getDb();
  const rows = db
    .select({
      id: audits.id,
      folderName: audits.folderName,
      folderPath: audits.folderPath,
      auditType: audits.auditType,
      depth: audits.depth,
      status: audits.status,
      createdAt: audits.createdAt,
      findings: audits.findings,
    })
    .from(audits)
    .orderBy(desc(audits.createdAt))
    .limit(10)
    .all();

  // Serialize for client component (Date → ISO string, findings → score/grade)
  const recentAudits = rows.map((r) => ({
    id: r.id,
    folderName: r.folderName,
    auditType: r.auditType,
    depth: r.depth,
    status: r.status,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    score: (r.findings as any)?.summary?.score ?? null,
    grade: (r.findings as any)?.summary?.grade ?? null,
  }));

  return <DashboardClient audits={recentAudits} />;
}
