import fs from "node:fs/promises";
import path from "node:path";
import { execCommand } from "../commands";
import { buildPhasePrompt, FINDING_FORMAT_TEMPLATE } from "../prompt-builder";
import { runPhaseLlm } from "../finding-extractor";
import { markPhaseCompleted } from "../progress-emitter";
import { getGuideChunk } from "../guide-chunks";
import { getRepoContext, getModel } from "./shared";
import type { AuditRunContext, PhaseRunner } from "../orchestrator";

export const phase08Runner: PhaseRunner = async (ctx, phaseNumber) => {
  const { auditId, repoPath, auditOutputDir } = ctx;

  const outputs: string[] = [];

  // GitHub Actions workflow files
  const workflows = await execCommand("bash", ["-c",
    `find "${repoPath}" \\( -path "*/.github/workflows/*.yml" -o -path "*/.github/workflows/*.yaml" \\) 2>/dev/null | head 10`], repoPath, 10_000);
  outputs.push(`$ find . -path "*/.github/workflows/*.yml" | head 10\n${workflows}`);

  // Read first workflow file if found
  const firstWorkflow = workflows.trim().split("\n").find((f) => f && f !== "(command not found)");
  if (firstWorkflow) {
    const workflowContent = await execCommand("bash", ["-c", `head -80 "${firstWorkflow}" 2>/dev/null`], repoPath, 10_000);
    outputs.push(`$ head -80 ${firstWorkflow}\n${workflowContent}`);
  }

  // Docker files
  const dockerFiles = await execCommand("bash", ["-c",
    `find "${repoPath}" \\( -name "Dockerfile" -o -name "docker-compose.yml" -o -name "docker-compose.yaml" \\) -not -path "*/node_modules/*" 2>/dev/null | head 5`], repoPath, 10_000);
  outputs.push(`$ find . -name "Dockerfile" -o -name "docker-compose.yml" | head 5\n${dockerFiles}`);

  // Read Dockerfile if found
  const firstDockerfile = dockerFiles.trim().split("\n").find((f) => f && f.includes("Dockerfile"));
  if (firstDockerfile) {
    const dockerContent = await execCommand("bash", ["-c", `head -50 "${firstDockerfile}" 2>/dev/null`], repoPath, 10_000);
    outputs.push(`$ head -50 ${firstDockerfile}\n${dockerContent}`);
  }

  // Environment config templates
  const envTemplates = await execCommand("bash", ["-c",
    `find "${repoPath}" \\( -name ".env.example" -o -name ".env.template" -o -name ".env.sample" \\) -not -path "*/node_modules/*" 2>/dev/null`], repoPath, 10_000);
  outputs.push(`$ find . -name ".env.example" -o -name ".env.template"\n${envTemplates}`);

  // Read .env.example if found
  const firstEnvExample = envTemplates.trim().split("\n").find((f) => f && f !== "(command not found)");
  if (firstEnvExample) {
    const envContent = await execCommand("bash", ["-c", `cat "${firstEnvExample}" 2>/dev/null | head 40`], repoPath, 10_000);
    outputs.push(`$ cat ${firstEnvExample} | head 40\n${envContent}`);
  }

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

  const outputMd = `# Phase ${phaseNumber} — CI/CD\n\n${summary}\n\n## Findings\n${JSON.stringify(findings, null, 2)}`;
  await fs.writeFile(path.join(auditOutputDir, `phase-${String(phaseNumber).padStart(2, "0")}.md`), outputMd, "utf8");

  await markPhaseCompleted(auditId, phaseNumber, outputMd, findings, usage.totalTokens);
};
