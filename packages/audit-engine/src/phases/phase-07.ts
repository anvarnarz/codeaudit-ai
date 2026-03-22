import fs from "node:fs/promises";
import path from "node:path";
import { execCommand } from "../commands";
import { buildPhasePrompt, FINDING_FORMAT_TEMPLATE } from "../prompt-builder";
import { runPhaseLlm } from "../finding-extractor";
import { markPhaseCompleted } from "../progress-emitter";
import { getGuideChunk } from "../guide-chunks";
import { getRepoContext, getModel, headLimit } from "./shared";
import type { AuditRunContext, PhaseRunner } from "../orchestrator";

export const phase07Runner: PhaseRunner = async (ctx, phaseNumber) => {
  const { auditId, repoPath, auditOutputDir } = ctx;
  const limit = headLimit(ctx);

  const outputs: string[] = [];

  // 7a: Find payment/billing files
  const paymentFiles = await execCommand("bash", ["-c",
    `find "${repoPath}" -name "*.ts" -not -path "*/node_modules/*" 2>/dev/null | xargs grep -l "stripe\\|payment\\|billing\\|invoice\\|subscription" -i 2>/dev/null | head 10`], repoPath, 20_000);
  outputs.push(`$ find . -name "*.ts" | xargs grep -l "stripe|payment|billing" -i | head 10\n${paymentFiles}`);

  // 7b: Find auth files
  const authFiles = await execCommand("bash", ["-c",
    `find "${repoPath}" -name "*.ts" -not -path "*/node_modules/*" 2>/dev/null | xargs grep -l "auth\\|login\\|session\\|jwt\\|token" -i 2>/dev/null | head 10`], repoPath, 20_000);
  outputs.push(`$ find . -name "*.ts" | xargs grep -l "auth|login|session|jwt" -i | head 10\n${authFiles}`);

  // Read first auth file (first 150 lines) if found
  const firstAuthFile = authFiles.trim().split("\n").find((f) => f && f !== "(command not found)");
  if (firstAuthFile) {
    const authContent = await execCommand("bash", ["-c", `head -150 "${firstAuthFile}" 2>/dev/null`], repoPath, 10_000);
    outputs.push(`$ head -150 ${firstAuthFile}\n${authContent}`);
  }

  // Read first payment file (first 150 lines) if found
  const firstPaymentFile = paymentFiles.trim().split("\n").find((f) => f && f !== "(command not found)");
  if (firstPaymentFile) {
    const paymentContent = await execCommand("bash", ["-c", `head -150 "${firstPaymentFile}" 2>/dev/null`], repoPath, 10_000);
    outputs.push(`$ head -150 ${firstPaymentFile}\n${paymentContent}`);
  }

  // 7c: Error handling patterns
  const errorHandling = await execCommand("bash", ["-c",
    `grep -rn "catch\\|try\\|throw\\|Error" "${repoPath}" --include="*.ts" -not -path "*/node_modules/*" 2>/dev/null | head ${limit}`], repoPath, 20_000);
  outputs.push(`$ grep -rn "catch|try|throw|Error" --include="*.ts" | head ${limit}\n${errorHandling}`);

  const commandOutput = outputs.join("\n\n---\n\n");
  const repoContext = getRepoContext(auditId);
  const model = getModel(ctx, phaseNumber);

  const prompt = buildPhasePrompt(
    getGuideChunk(phaseNumber),
    commandOutput,
    repoContext,
    FINDING_FORMAT_TEMPLATE,
  );

  const { findings, summary, usage } = await runPhaseLlm(model as Parameters<typeof runPhaseLlm>[0], prompt, phaseNumber);

  const outputMd = `# Phase ${phaseNumber} — Deep Reads\n\n${summary}\n\n## Findings\n${JSON.stringify(findings, null, 2)}`;
  await fs.writeFile(path.join(auditOutputDir, `phase-${String(phaseNumber).padStart(2, "0")}.md`), outputMd, "utf8");

  await markPhaseCompleted(auditId, phaseNumber, outputMd, findings, usage.totalTokens);
};
