import { getDb, auditPhases, audits } from "@codeaudit-ai/db";
import { eq, and } from "drizzle-orm";
import type { AuditFinding } from "@codeaudit-ai/db";

export async function markPhaseRunning(auditId: string, phaseNumber: number): Promise<void> {
  const db = getDb();
  // Upsert: create if not exists, update to running
  const existing = db.select().from(auditPhases)
    .where(and(eq(auditPhases.auditId, auditId), eq(auditPhases.phaseNumber, phaseNumber)))
    .get();
  if (existing) {
    db.update(auditPhases).set({ status: "running", startedAt: new Date() })
      .where(eq(auditPhases.id, existing.id)).run();
  } else {
    db.insert(auditPhases).values({
      auditId, phaseNumber, status: "running", startedAt: new Date(),
    }).run();
  }
  // Update audits.currentPhase
  db.update(audits).set({ currentPhase: phaseNumber })
    .where(eq(audits.id, auditId)).run();
}

export async function markPhaseCompleted(
  auditId: string,
  phaseNumber: number,
  output: string,
  findings: AuditFinding[],
  tokensUsed: number,
): Promise<void> {
  const db = getDb();
  const existing = db.select().from(auditPhases)
    .where(and(eq(auditPhases.auditId, auditId), eq(auditPhases.phaseNumber, phaseNumber)))
    .get();
  if (existing) {
    db.update(auditPhases).set({
      status: "completed", output, findings, tokensUsed, completedAt: new Date(),
    }).where(eq(auditPhases.id, existing.id)).run();
  }
  // Add tokens and cost to audit running total
  const audit = db.select().from(audits).where(eq(audits.id, auditId)).get();
  if (audit) {
    // Estimate cost from tokens using provider pricing (microdollars per 1k tokens)
    // Assume ~75% input, ~25% output token split
    const PRICING: Record<string, { input: number; output: number }> = {
      anthropic: { input: 3000, output: 15000 },
      openai:    { input: 2500, output: 10000 },
      gemini:    { input: 1250, output: 5000 },
    };
    const pricing = PRICING[audit.provider] ?? PRICING.anthropic;
    const inputTokens = Math.round(tokensUsed * 0.75);
    const outputTokens = tokensUsed - inputTokens;
    const costMicro = Math.round(
      (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output
    );

    db.update(audits).set({
      tokenCount: audit.tokenCount + tokensUsed,
      actualCostMicrodollars: (audit.actualCostMicrodollars ?? 0) + costMicro,
      updatedAt: new Date(),
    }).where(eq(audits.id, auditId)).run();
  }
}

export async function markPhaseSkipped(auditId: string, phaseNumber: number): Promise<void> {
  const db = getDb();
  db.insert(auditPhases).values({
    auditId, phaseNumber, status: "skipped",
  }).run();
}

export async function markPhaseFailed(auditId: string, phaseNumber: number, error: string): Promise<void> {
  const db = getDb();
  const existing = db.select().from(auditPhases)
    .where(and(eq(auditPhases.auditId, auditId), eq(auditPhases.phaseNumber, phaseNumber)))
    .get();
  if (existing) {
    db.update(auditPhases).set({ status: "failed", output: error, completedAt: new Date() })
      .where(eq(auditPhases.id, existing.id)).run();
  }
}
