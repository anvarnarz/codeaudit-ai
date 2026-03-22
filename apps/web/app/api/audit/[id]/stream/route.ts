import { NextRequest } from "next/server";
import { getDb, auditPhases, audits } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import { getPhasesForAuditType } from "@codeaudit-ai/audit-engine";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();

  const encoder = new TextEncoder();
  let eventId = 0;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        eventId++;
        try {
          controller.enqueue(
            encoder.encode(`id: ${eventId}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          // client disconnected — ignore
        }
      };

      const emitState = () => {
        const audit = db.select().from(audits).where(eq(audits.id, id)).get();
        if (!audit) { controller.close(); return; }

        const phases = db.select().from(auditPhases).where(eq(auditPhases.auditId, id)).all();
        const phasesToRun = getPhasesForAuditType(audit.auditType, audit.depth);
        const phasesCompleted = phases.filter((p) => ["completed", "skipped"].includes(p.status)).length;

        // Emit each phase's current state (replay completed phases on reconnect — PROG-04)
        for (const phase of phases) {
          const criticalCount = (phase.findings ?? []).filter((f) => f.severity === "critical").length;
          const durationMs = phase.startedAt && phase.completedAt
            ? phase.completedAt.getTime() - phase.startedAt.getTime()
            : null;
          send({
            type: "phase",
            phaseNumber: phase.phaseNumber,
            status: phase.status,
            tokensUsed: phase.tokensUsed,
            findingsCount: phase.findings?.length ?? 0,
            criticalCount,
            durationMs,
          });
        }

        // Emit overall audit state
        send({
          type: "audit",
          status: audit.status,
          currentPhase: audit.currentPhase,
          totalTokens: audit.tokenCount,
          totalCostMicro: audit.actualCostMicrodollars,
          phasesTotal: phasesToRun.length,
          phasesCompleted,
        });

        // Close on terminal state
        if (["completed", "cancelled", "failed"].includes(audit.status)) {
          clearInterval(interval);
          controller.close();
        }
      };

      // Emit immediately on connect (replay completed state for reconnecting clients — PROG-04)
      emitState();

      // Poll every 500ms
      const interval = setInterval(emitState, 500);

      // Safety net: close abandoned streams after 5 minutes
      setTimeout(() => {
        clearInterval(interval);
        try { controller.close(); } catch { /* already closed */ }
      }, 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
