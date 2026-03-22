import { getDb, auditPhases } from "@codeaudit/db";
import { eq, and } from "drizzle-orm";
import { createLlmProvider, resolveModel } from "@codeaudit/llm-adapter";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import type { AuditRunContext } from "../orchestrator.js";

/**
 * Retrieve the Phase 0 repo context JSON string for use in subsequent phase prompts.
 * Returns a descriptive string if Phase 0 hasn't completed yet.
 */
export function getRepoContext(auditId: string): string {
  const db = getDb();
  const phase0 = db.select().from(auditPhases)
    .where(and(eq(auditPhases.auditId, auditId), eq(auditPhases.phaseNumber, 0)))
    .get();
  return phase0?.output ?? "Repo context not available (Phase 0 not completed)";
}

/**
 * Create the LLM model instance for a given phase and audit context.
 */
export function getModel(ctx: AuditRunContext, phaseNumber: number): LanguageModelV1 {
  return createLlmProvider({
    provider: ctx.llmProvider,
    apiKey: ctx.decryptedApiKey,
    model: resolveModel(ctx.llmProvider, phaseNumber, ctx.selectedModel),
  });
}

/**
 * Returns the head limit for grep/find command output.
 * Quick scan caps at 15 lines; deep audit uses 30 (EXEC-06).
 */
export function headLimit(ctx: AuditRunContext): string {
  return ctx.depth === "quick" ? "15" : "30";
}
