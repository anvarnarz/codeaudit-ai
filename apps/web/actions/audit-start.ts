"use server";
import { getDb, audits } from "@codeaudit-ai/db";
import { lockFolder, createAuditOutputDir } from "@/lib/folder-safety";
import { redirect } from "next/navigation";

export type StartAuditInput = {
  folderPaths: string[];      // per D-04: one or more paths
  folderNames: string[];
  auditType: "full" | "security" | "team-collaboration" | "code-quality";
  depth: "quick" | "deep";
  apiKeyId: string;
  selectedModel: string | null;
  llmProvider: "anthropic" | "openai" | "gemini";
};

export async function startAudit(input: StartAuditInput): Promise<void> {
  // Use the first folder as primary (multi-folder execution is Phase 2 per D-05 deferred)
  const primaryFolder = input.folderPaths[0];
  const primaryName = input.folderNames[0] ?? "unknown";

  if (!primaryFolder) {
    throw new Error("At least one folder path is required");
  }

  // Step 1: Create audit output directory BEFORE locking (dir creation requires write access)
  const auditOutputDir = await createAuditOutputDir(primaryFolder);

  // Step 2: Lock folder read-only (git push block first, then chmod — see folder-safety.ts)
  await lockFolder(primaryFolder);

  // Step 3: Insert audit record with status "queued"
  const db = getDb();
  const rows = await db.insert(audits).values({
    folderPath: primaryFolder,
    folderName: primaryName,
    auditOutputDir,
    auditType: input.auditType,
    depth: input.depth,
    llmProvider: input.llmProvider,
    selectedModel: input.selectedModel ?? null,
    apiKeyId: input.apiKeyId,
    status: "queued",
    isGitRepo: true, // caller validates; default true
  }).returning({ id: audits.id });

  const audit = rows[0];
  if (!audit) {
    throw new Error("Failed to create audit record");
  }

  // Redirect to queued audit stub page (audit engine is Phase 2)
  redirect(`/audit/${audit.id}/queued`);
}
