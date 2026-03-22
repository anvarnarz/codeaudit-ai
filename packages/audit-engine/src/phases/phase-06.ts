import fs from "node:fs/promises";
import path from "node:path";
import { execCommand } from "../commands";
import { buildPhasePrompt, FINDING_FORMAT_TEMPLATE } from "../prompt-builder";
import { runPhaseLlm } from "../finding-extractor";
import { markPhaseCompleted } from "../progress-emitter";
import { getGuideChunk } from "../guide-chunks";
import { getRepoContext, getModel, headLimit } from "./shared";
import type { AuditRunContext, PhaseRunner } from "../orchestrator";

export const phase06Runner: PhaseRunner = async (ctx, phaseNumber) => {
  const { auditId, repoPath, auditOutputDir } = ctx;
  const limit = headLimit(ctx);

  const outputs: string[] = [];

  // 6a: Secrets/credentials — env var references
  const envVarGrep = await execCommand("bash", ["-c",
    `grep -rn "process.env\\|process\\.env" "${repoPath}" --include="*.ts" --include="*.js" -not -path "*/node_modules/*" 2>/dev/null | head ${limit}`], repoPath, 20_000);
  outputs.push(`$ grep -rn "process.env" --include="*.ts" --include="*.js" | head ${limit}\n${envVarGrep}`);

  // 6a: Hardcoded secrets pattern
  const secretsGrep = await execCommand("bash", ["-c",
    `grep -rn "password\\|secret\\|api_key\\|apikey\\|token\\|auth" "${repoPath}" --include="*.ts" --include="*.js" --include="*.env*" -not -path "*/node_modules/*" -i 2>/dev/null | head ${limit}`], repoPath, 20_000);
  outputs.push(`$ grep -rn "password|secret|api_key|token|auth" -i | head ${limit}\n${secretsGrep}`);

  // 6c: Injection vectors
  const evalGrep = await execCommand("bash", ["-c",
    `grep -rn "eval\\|innerHTML\\|dangerouslySetInnerHTML" "${repoPath}" --include="*.ts" --include="*.tsx" --include="*.js" -not -path "*/node_modules/*" 2>/dev/null | head ${limit}`], repoPath, 20_000);
  outputs.push(`$ grep -rn "eval|innerHTML|dangerouslySetInnerHTML" | head ${limit}\n${evalGrep}`);

  // 6c: SQL injection patterns
  const sqlGrep = await execCommand("bash", ["-c",
    `grep -rn "sql\\|SELECT\\|INSERT\\|UPDATE\\|DELETE" "${repoPath}" --include="*.ts" --include="*.js" -not -path "*/node_modules/*" -i 2>/dev/null | head ${limit}`], repoPath, 20_000);
  outputs.push(`$ grep -rn "sql|SELECT|INSERT|UPDATE|DELETE" -i | head ${limit}\n${sqlGrep}`);

  // 6a: Exposed .env files (not .env.example)
  const envFiles = await execCommand("find", [repoPath, "-name", ".env",
    "-not", "-path", "*/node_modules/*", "-not", "-name", ".env.example"], repoPath, 10_000);
  outputs.push(`$ find . -name ".env" (not .env.example)\n${envFiles}`);

  // 6d: External URL references (non-localhost)
  const urlGrep = await execCommand("bash", ["-c",
    `grep -rn "https\\?://" "${repoPath}" --include="*.ts" --include="*.js" -not -path "*/node_modules/*" 2>/dev/null | grep -v "localhost\\|127.0.0.1\\|example.com" | head ${limit}`], repoPath, 20_000);
  outputs.push(`$ grep -rn "https?://" | grep -v "localhost|example.com" | head ${limit}\n${urlGrep}`);

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

  const outputMd = `# Phase ${phaseNumber} — Security Audit\n\n${summary}\n\n## Findings\n${JSON.stringify(findings, null, 2)}`;
  await fs.writeFile(path.join(auditOutputDir, `phase-${String(phaseNumber).padStart(2, "0")}.md`), outputMd, "utf8");

  await markPhaseCompleted(auditId, phaseNumber, outputMd, findings, usage.totalTokens);
};
