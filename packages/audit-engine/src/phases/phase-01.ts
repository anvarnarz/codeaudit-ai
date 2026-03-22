import fs from "node:fs/promises";
import path from "node:path";
import { execCommand } from "../commands";
import { buildPhasePrompt, FINDING_FORMAT_TEMPLATE } from "../prompt-builder";
import { runPhaseLlm } from "../finding-extractor";
import { markPhaseCompleted } from "../progress-emitter";
import { getGuideChunk } from "../guide-chunks";
import { getRepoContext, getModel, headLimit } from "./shared";
import type { AuditRunContext, PhaseRunner } from "../orchestrator";

export const phase01Runner: PhaseRunner = async (ctx, phaseNumber) => {
  const { auditId, repoPath, auditOutputDir } = ctx;
  const limit = headLimit(ctx);

  const outputs: string[] = [];

  // Top-level directory listing
  const topLevel = await execCommand("find", [repoPath, "-maxdepth", "3", "-type", "f",
    "-not", "-path", "*/node_modules/*", "-not", "-path", "*/.git/*", "-not", "-path", "*/dist/*"], repoPath, 30_000);
  outputs.push(`$ find . -maxdepth 3 -type f (trimmed to ${limit} lines)\n${topLevel.split("\n").slice(0, parseInt(limit)).join("\n")}`);

  // package.json (head 80)
  const pkgJson = await execCommand("bash", ["-c", `head -80 "${repoPath}/package.json" 2>/dev/null || echo "(no package.json at root)"`], repoPath, 10_000);
  outputs.push(`$ head -80 package.json\n${pkgJson}`);

  // TS/JS file count
  const tsFileCount = await execCommand("bash", ["-c",
    `find "${repoPath}" -name "*.ts" -o -name "*.tsx" -not -path "*/node_modules/*" 2>/dev/null | wc -l`], repoPath, 15_000);
  outputs.push(`$ find . \\( -name "*.ts" -o -name "*.tsx" \\) ! -path "*/node_modules/*" | wc -l\n${tsFileCount}`);

  // Test file count
  const testFileCount = await execCommand("bash", ["-c",
    `find "${repoPath}" \\( -name "*.test.ts" -o -name "*.spec.ts" -o -name "*.test.js" -o -name "*.spec.js" \\) -not -path "*/node_modules/*" 2>/dev/null | wc -l`], repoPath, 15_000);
  outputs.push(`$ find . \\( -name "*.test.ts" -o -name "*.spec.ts" \\) ! -path "*/node_modules/*" | wc -l\n${testFileCount}`);

  // tsconfig.json if present
  const tsconfig = await execCommand("bash", ["-c",
    `cat "${repoPath}/tsconfig.json" 2>/dev/null | head -40 || echo "(no tsconfig.json at root)"`], repoPath, 10_000);
  outputs.push(`$ head -40 tsconfig.json\n${tsconfig}`);

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

  const outputMd = `# Phase ${phaseNumber} — Orientation\n\n${summary}\n\n## Findings\n${JSON.stringify(findings, null, 2)}`;
  await fs.writeFile(path.join(auditOutputDir, `phase-${String(phaseNumber).padStart(2, "0")}.md`), outputMd, "utf8");

  await markPhaseCompleted(auditId, phaseNumber, outputMd, findings, usage.totalTokens);
};
