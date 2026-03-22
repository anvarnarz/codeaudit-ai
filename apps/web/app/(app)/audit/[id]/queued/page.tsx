import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb, audits } from "@codeaudit/db";
import { eq } from "drizzle-orm";
import { LockKeyhole, Clock, ArrowLeft } from "lucide-react";

const AUDIT_TYPE_LABELS: Record<string, string> = {
  full: "Full Audit",
  security: "Security-Only",
  "team-collaboration": "Team & Collaboration",
  "code-quality": "Code Quality",
};

interface QueuedAuditPageProps {
  params: Promise<{ id: string }>;
}

export default async function QueuedAuditPage({ params }: QueuedAuditPageProps) {
  const { id } = await params;
  const db = getDb();
  const audit = db.select().from(audits).where(eq(audits.id, id)).get();

  if (!audit) {
    notFound();
  }

  const auditTypeLabel = AUDIT_TYPE_LABELS[audit.auditType] ?? audit.auditType;
  const depthLabel = audit.depth === "quick" ? "Quick Scan (~30 min)" : "Deep Audit (1–3 hrs)";

  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/20 mx-auto mb-6">
        <LockKeyhole className="h-6 w-6 text-primary" />
      </div>

      <h1 className="text-xl font-semibold tracking-tight mb-2">Audit Queued</h1>
      <p className="text-sm text-muted-foreground mb-8">
        The target folder is now locked read-only.
      </p>

      <div className="rounded-lg border border-border bg-card p-5 text-left space-y-3 mb-8">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <span className="text-muted-foreground">Folder</span>
          <span className="font-mono text-xs break-all">{audit.folderPath}</span>
          <span className="text-muted-foreground">Type</span>
          <span>{auditTypeLabel}</span>
          <span className="text-muted-foreground">Depth</span>
          <span>{depthLabel}</span>
          <span className="text-muted-foreground">Status</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Queued
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 mb-8 flex items-start gap-3">
        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground text-left">
          The audit engine is coming in Phase 2. This page will show live phase-by-phase progress
          once the engine is wired up.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}
