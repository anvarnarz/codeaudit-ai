import fs from "node:fs/promises";
import path from "node:path";
import { execCommand } from "../commands";
import { buildPhasePrompt, FINDING_FORMAT_TEMPLATE } from "../prompt-builder";
import { runPhaseLlm } from "../finding-extractor";
import { markPhaseCompleted } from "../progress-emitter";
import { getGuideChunk } from "../guide-chunks";
import { getRepoContext, getModel, headLimit } from "./shared";
import type { AuditRunContext } from "../orchestrator";
import type { PhaseRunner } from "../phase-registry";

export const phase09Runner: PhaseRunner = async (ctx, phaseNumber) => {
  const { auditId, repoPath, auditOutputDir } = ctx;
  const limit = headLimit(ctx);

  const outputs: string[] = [];

  // 9a: README files
  const readmeFiles = await execCommand("bash", ["-c",
    `find "${repoPath}" -name "README*" -not -path "*/node_modules/*" 2>/dev/null | head 10`], repoPath, 10_000);
  outputs.push(`$ find . -name "README*" ! -path "*/node_modules/*" | head 10\n${readmeFiles}`);

  // Read root README if found
  const rootReadme = readmeFiles.trim().split("\n").find((f) => f && (f.endsWith("/README.md") || f.endsWith("/README")));
  if (rootReadme) {
    const readmeContent = await execCommand("bash", ["-c", `head -60 "${rootReadme}" 2>/dev/null`], repoPath, 10_000);
    outputs.push(`$ head -60 ${rootReadme}\n${readmeContent}`);
  }

  // All markdown files
  const markdownFiles = await execCommand("bash", ["-c",
    `find "${repoPath}" -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head 20`], repoPath, 10_000);
  outputs.push(`$ find . -name "*.md" ! -path "*/node_modules/*" | head 20\n${markdownFiles}`);

  // 9b: API docs (openapi/swagger)
  const apiDocs = await execCommand("bash", ["-c",
    `find "${repoPath}" \\( -name "openapi*" -o -name "swagger*" \\) -not -path "*/node_modules/*" 2>/dev/null | head 5`], repoPath, 10_000);
  outputs.push(`$ find . -name "openapi*" -o -name "swagger*" | head 5\n${apiDocs}`);

  // 9c: JSDoc coverage (functions with @param/@returns)
  const jsdocCount = await execCommand("bash", ["-c",
    `grep -rn "@param\\|@returns\\|@description" "${repoPath}" --include="*.ts" -not -path "*/node_modules/*" 2>/dev/null | wc -l`], repoPath, 20_000);
  outputs.push(`$ grep -rn "@param|@returns|@description" --include="*.ts" | wc -l\n${jsdocCount}`);

  // Count exported functions (to compute ratio)
  const exportedFunctions = await execCommand("bash", ["-c",
    `grep -rn "^export function\\|^export async function\\|^export const" "${repoPath}" --include="*.ts" -not -path "*/node_modules/*" 2>/dev/null | wc -l`], repoPath, 20_000);
  outputs.push(`$ grep -rn "^export function|^export async function|^export const" --include="*.ts" | wc -l\n${exportedFunctions}`);

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

  const outputMd = `# Phase ${phaseNumber} — Documentation\n\n${summary}\n\n## Findings\n${JSON.stringify(findings, null, 2)}`;
  await fs.writeFile(path.join(auditOutputDir, `phase-${String(phaseNumber).padStart(2, "0")}.md`), outputMd, "utf8");

  await markPhaseCompleted(auditId, phaseNumber, outputMd, findings, usage.totalTokens);
};
