import fs from "node:fs/promises";
import path from "node:path";
import { execCommand } from "../commands";
import { buildPhasePrompt, FINDING_FORMAT_TEMPLATE } from "../prompt-builder";
import { runPhaseLlm } from "../finding-extractor";
import { markPhaseCompleted } from "../progress-emitter";
import { getGuideChunk } from "../guide-chunks";
import { getRepoContext, getModel, headLimit } from "./shared";
import type { AuditRunContext, PhaseRunner } from "../orchestrator";

export const phase04Runner: PhaseRunner = async (ctx, phaseNumber) => {
  const { auditId, repoPath, auditOutputDir } = ctx;
  const limit = headLimit(ctx);

  const outputs: string[] = [];

  // Largest files by line count
  const largestFiles = await execCommand("bash", ["-c",
    `find "${repoPath}" \\( -name "*.ts" -o -name "*.tsx" \\) -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null | xargs wc -l 2>/dev/null | sort -rn | head ${limit}`], repoPath, 30_000);
  outputs.push(`$ find . \\( -name "*.ts" -o -name "*.tsx" \\) | xargs wc -l | sort -rn | head ${limit}\n${largestFiles}`);

  // Function/arrow function count (complexity indicator)
  const functionCount = await execCommand("bash", ["-c",
    `grep -rn "function\\|=>" "${repoPath}" --include="*.ts" --include="*.tsx" -not -path "*/node_modules/*" 2>/dev/null | wc -l`], repoPath, 20_000);
  outputs.push(`$ grep -rn "function|=>" --include="*.ts" --include="*.tsx" | wc -l\n${functionCount}`);

  // Top 20 largest files (absolute)
  const top20Files = await execCommand("bash", ["-c",
    `find "${repoPath}" -name "*.ts" -not -path "*/node_modules/*" 2>/dev/null | xargs wc -l 2>/dev/null | sort -rn | head 20`], repoPath, 30_000);
  outputs.push(`$ find . -name "*.ts" | xargs wc -l | sort -rn | head 20\n${top20Files}`);

  // Deeply nested files (complexity indicator via path depth)
  const deepPaths = await execCommand("bash", ["-c",
    `find "${repoPath}" \\( -name "*.ts" -o -name "*.tsx" \\) -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null | awk -F'/' '{print NF, $0}' | sort -rn | head 15`], repoPath, 20_000);
  outputs.push(`$ deeply nested TS files (by path depth)\n${deepPaths}`);

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

  const outputMd = `# Phase ${phaseNumber} — Code Complexity\n\n${summary}\n\n## Findings\n${JSON.stringify(findings, null, 2)}`;
  await fs.writeFile(path.join(auditOutputDir, `phase-${String(phaseNumber).padStart(2, "0")}.md`), outputMd, "utf8");

  await markPhaseCompleted(auditId, phaseNumber, outputMd, findings, usage.totalTokens);
};
