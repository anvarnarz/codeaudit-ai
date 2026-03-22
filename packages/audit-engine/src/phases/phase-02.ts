import fs from "node:fs/promises";
import path from "node:path";
import { execCommand } from "../commands";
import { buildPhasePrompt, FINDING_FORMAT_TEMPLATE } from "../prompt-builder";
import { runPhaseLlm } from "../finding-extractor";
import { markPhaseCompleted } from "../progress-emitter";
import { getGuideChunk } from "../guide-chunks";
import { getRepoContext, getModel } from "./shared";
import type { AuditRunContext } from "../orchestrator";
import type { PhaseRunner } from "../phase-registry";

export const phase02Runner: PhaseRunner = async (ctx, phaseNumber) => {
  const { auditId, repoPath, auditOutputDir } = ctx;

  const outputs: string[] = [];

  // Root package.json
  const pkgJson = await execCommand("bash", ["-c", `cat "${repoPath}/package.json" 2>/dev/null || echo "(no package.json)"`], repoPath, 10_000);
  outputs.push(`$ cat package.json\n${pkgJson}`);

  // All package.json files in monorepo (max depth 2)
  const allPkgJsons = await execCommand("find", [repoPath, "-maxdepth", "2", "-name", "package.json",
    "-not", "-path", "*/node_modules/*"], repoPath, 15_000);
  outputs.push(`$ find . -maxdepth 2 -name "package.json" ! -path "*/node_modules/*"\n${allPkgJsons}`);

  // npm/pnpm audit — may fail on chmod-locked repo, wrap gracefully via execCommand's error handling
  const auditResult = await execCommand("bash", ["-c", `cd "${repoPath}" && npm audit --json 2>/dev/null | head -100 || echo "(npm audit not available or failed)"`], repoPath, 60_000);
  outputs.push(`$ npm audit --json (first 100 lines)\n${auditResult}`);

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

  const outputMd = `# Phase ${phaseNumber} — Dependency Health\n\n${summary}\n\n## Findings\n${JSON.stringify(findings, null, 2)}`;
  await fs.writeFile(path.join(auditOutputDir, `phase-${String(phaseNumber).padStart(2, "0")}.md`), outputMd, "utf8");

  await markPhaseCompleted(auditId, phaseNumber, outputMd, findings, usage.totalTokens);
};
