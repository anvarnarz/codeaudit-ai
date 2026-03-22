import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getDb, audits, auditPhases, apiKeys } from "@codeaudit-ai/db";
import { eq, and } from "drizzle-orm";
import { decryptApiKey } from "@codeaudit-ai/db";
import "./phases/index.js"; // side-effect: registers all phase runners (plan 02)
import { getPhasesForAuditType } from "./phases/index.js";
import { markPhaseRunning, markPhaseCompleted, markPhaseSkipped, markPhaseFailed } from "./progress-emitter.js";

const execFileAsync = promisify(execFile);

// Inlined from apps/web/lib/folder-safety.ts to avoid cross-package dependency (D-10)
async function unlockFolderLocal(folderPath: string): Promise<void> {
  await execFileAsync("chmod", ["-R", "u+w", folderPath]);
}

// runPhase is implemented per-phase in plan 02. Stub here — replaced in plan 02.
export type PhaseRunner = (config: AuditRunContext, phaseNumber: number) => Promise<void>;

// Registry populated by plan 02
const phaseRunners: Map<number, PhaseRunner> = new Map();
export function registerPhaseRunner(phaseNumber: number, runner: PhaseRunner): void {
  phaseRunners.set(phaseNumber, runner);
}

export type AuditEngineConfig = {
  auditId: string;
  repoPath: string;
  auditOutputDir: string;
  auditType: "full" | "security" | "team-collaboration" | "code-quality";
  depth: "quick" | "deep";
  llmProvider: "anthropic" | "openai" | "gemini";
  apiKeyId: string;
  selectedModel: string | null;
};

export type AuditRunContext = AuditEngineConfig & {
  decryptedApiKey: string;
};

export async function runAudit(config: AuditEngineConfig): Promise<void> {
  const db = getDb();

  // Decrypt API key upfront
  const keyRow = db.select().from(apiKeys).where(eq(apiKeys.id, config.apiKeyId)).get();
  if (!keyRow) throw new Error(`API key ${config.apiKeyId} not found`);
  const decryptedApiKey = decryptApiKey(keyRow.encryptedKey, keyRow.iv);

  const ctx: AuditRunContext = { ...config, decryptedApiKey };

  // Mark audit as running
  db.update(audits).set({ status: "running", startedAt: new Date() })
    .where(eq(audits.id, config.auditId)).run();

  const phasesToRun = getPhasesForAuditType(config.auditType, config.depth);

  try {
    for (const phaseNum of phasesToRun) {
      // Poll cancel flag between phases (D-09 + PROG-05)
      const currentAudit = db.select().from(audits).where(eq(audits.id, config.auditId)).get();
      if (currentAudit?.status === "cancelled") break;

      // Skip already-completed phases — supports resume from checkpoint (D-09, EXEC-08)
      const existing = db.select().from(auditPhases)
        .where(and(eq(auditPhases.auditId, config.auditId), eq(auditPhases.phaseNumber, phaseNum)))
        .get();
      if (existing?.status === "completed") continue;

      const runner = phaseRunners.get(phaseNum);
      if (!runner) {
        // Phase not yet implemented (plan 02 stub) — skip gracefully
        await markPhaseSkipped(config.auditId, phaseNum);
        continue;
      }

      await markPhaseRunning(config.auditId, phaseNum);
      try {
        await runner(ctx, phaseNum);
      } catch (err) {
        await markPhaseFailed(config.auditId, phaseNum, String(err));
        // Non-fatal: continue with next phase
      }
    }

    // Determine final status
    const finalAudit = db.select().from(audits).where(eq(audits.id, config.auditId)).get();
    const finalStatus = finalAudit?.status === "cancelled" ? "cancelled" : "completed";
    db.update(audits).set({ status: finalStatus, completedAt: new Date(), currentPhase: null })
      .where(eq(audits.id, config.auditId)).run();

  } finally {
    // D-10: ALWAYS unlock folder — even on crash/cancel/failure
    try {
      await unlockFolderLocal(config.repoPath);
    } catch (unlockErr) {
      // Log but don't rethrow — unlock failure shouldn't mask original error
      console.error(`[audit-engine] Failed to unlock folder ${config.repoPath}:`, unlockErr);
    }
  }
}
