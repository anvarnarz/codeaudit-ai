import { notFound } from "next/navigation";
import { getDb, audits } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function ExecutiveReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const audit = db.select().from(audits).where(eq(audits.id, id)).get();
  if (!audit) notFound();

  return (
    <div className="flex flex-col h-full">
      {/* App chrome header — back to results + PDF download */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        <Link
          href={`/audit/${id}/results`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Results
        </Link>
        <span className="text-sm font-medium">{audit.folderName} — Executive Report</span>
        <div className="ml-auto flex gap-2">
          <a
            href={`/api/audit/${id}/pdf/management`}
            className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-secondary/50 transition-colors"
          >
            Download PDF
          </a>
        </div>
      </div>
      {/* iframe filling remaining viewport height — Phase 11 management report */}
      <iframe
        src={`/api/audit/${id}/report/management`}
        className="flex-1 w-full border-0"
        title="Executive Report"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
}
