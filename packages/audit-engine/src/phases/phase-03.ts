import fs from "node:fs/promises";
import path from "node:path";
import { execCommand } from "../commands";
import { buildPhasePrompt, FINDING_FORMAT_TEMPLATE } from "../prompt-builder";
import { runPhaseLlm } from "../finding-extractor";
import { markPhaseCompleted } from "../progress-emitter";
import { getGuideChunk } from "../guide-chunks";
import { getRepoContext, getModel, headLimit } from "./shared";
import type { AuditRunContext, PhaseRunner } from "../orchestrator";

export const phase03Runner: PhaseRunner = async (ctx, phaseNumber) => {
  const { auditId, repoPath, auditOutputDir } = ctx;
  const limit = headLimit(ctx);

  const outputs: string[] = [];

  // Find test files
  const testFiles = await execCommand("bash", ["-c",
    `find "${repoPath}" \\( -name "*.test.ts" -o -name "*.spec.ts" -o -name "*.test.js" -o -name "*.spec.js" \\) -not -path "*/node_modules/*" 2>/dev/null | head ${limit}`], repoPath, 15_000);
  outputs.push(`$ find . -name "*.test.ts" -o -name "*.spec.ts" | head ${limit}\n${testFiles}`);

  // Find test config files
  const testConfigs = await execCommand("bash", ["-c",
    `find "${repoPath}" \\( -name "jest.config.*" -o -name "vitest.config.*" \\) -not -path "*/node_modules/*" 2>/dev/null`], repoPath, 10_000);
  outputs.push(`$ find . -name "jest.config.*" -o -name "vitest.config.*"\n${testConfigs}`);

  // Read first test config found
  const firstConfig = testConfigs.trim().split("\n")[0];
  if (firstConfig && firstConfig !== "(command not found)" && firstConfig.length > 0) {
    const configContent = await execCommand("bash", ["-c", `head -60 "${firstConfig}" 2>/dev/null || echo "(could not read config)"`], repoPath, 10_000);
    outputs.push(`$ head -60 ${firstConfig}\n${configContent}`);
  }

  // Coverage configuration grep
  const coverageGrep = await execCommand("bash", ["-c",
    `grep -r "coverage" "${repoPath}" --include="*.json" --include="*.ts" -l 2>/dev/null | head 10 || echo "(no coverage config found)"`], repoPath, 15_000);
  outputs.push(`$ grep -r "coverage" --include="*.json" --include="*.ts" -l | head 10\n${coverageGrep}`);

  // Count source files vs test files ratio
  const sourceCount = await execCommand("bash", ["-c",
    `find "${repoPath}" \\( -name "*.ts" -o -name "*.tsx" \\) -not -name "*.test.*" -not -name "*.spec.*" -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null | wc -l`], repoPath, 15_000);
  outputs.push(`$ source file count (non-test .ts/.tsx)\n${sourceCount}`);

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

  const outputMd = `# Phase ${phaseNumber} — Test Coverage\n\n${summary}\n\n## Findings\n${JSON.stringify(findings, null, 2)}`;
  await fs.writeFile(path.join(auditOutputDir, `phase-${String(phaseNumber).padStart(2, "0")}.md`), outputMd, "utf8");

  await markPhaseCompleted(auditId, phaseNumber, outputMd, findings, usage.totalTokens);
};
