import fs from "node:fs/promises";
import path from "node:path";
import { execCommand } from "../commands";
import { buildPhasePrompt, FINDING_FORMAT_TEMPLATE } from "../prompt-builder";
import { runPhaseLlm } from "../finding-extractor";
import { markPhaseCompleted } from "../progress-emitter";
import { getGuideChunk } from "../guide-chunks";
import { getRepoContext, getModel, headLimit } from "./shared";
import type { AuditRunContext, PhaseRunner } from "../orchestrator";

export const phase05Runner: PhaseRunner = async (ctx, phaseNumber) => {
  const { auditId, repoPath, auditOutputDir } = ctx;
  const limit = headLimit(ctx);

  const outputs: string[] = [];

  // Commit frequency last 6 months
  const commitFrequency = await execCommand("git", ["-C", repoPath, "log", "--oneline", "--since=6 months ago"], repoPath, 20_000);
  const commitLines = commitFrequency.split("\n").filter(Boolean);
  outputs.push(`$ git log --oneline --since="6 months ago" | wc -l\n${commitLines.length} commits`);

  // Top committers last 12 months
  const topCommitters = await execCommand("git", ["-C", repoPath, "log", "--format=%an", "--since=12 months ago"], repoPath, 20_000);
  const committerCounts: Record<string, number> = {};
  for (const name of topCommitters.split("\n").filter(Boolean)) {
    committerCounts[name] = (committerCounts[name] ?? 0) + 1;
  }
  const sortedCommitters = Object.entries(committerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => `${count} ${name}`)
    .join("\n");
  outputs.push(`$ git log --format="%an" --since="12 months ago" | sort | uniq -c | sort -rn | head 10\n${sortedCommitters}`);

  // Churn hotspots — most-modified files
  const churnFiles = await execCommand("git", ["-C", repoPath, "log", "--follow", "--diff-filter=M",
    "--format=%f", "--", "*.ts"], repoPath, 30_000);
  const fileCounts: Record<string, number> = {};
  for (const f of churnFiles.split("\n").filter(Boolean)) {
    fileCounts[f] = (fileCounts[f] ?? 0) + 1;
  }
  const topChurn = Object.entries(fileCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, parseInt(limit))
    .map(([f, count]) => `${count} ${f}`)
    .join("\n");
  outputs.push(`$ git log --follow --diff-filter=M --format="%f" -- "*.ts" | sort | uniq -c | sort -rn | head ${limit}\n${topChurn}`);

  // Recent commits (last 30 days)
  const recentCommits = await execCommand("git", ["-C", repoPath, "log", "--oneline", "--since=30 days ago"], repoPath, 15_000);
  const recentLines = recentCommits.split("\n").slice(0, 20).join("\n");
  outputs.push(`$ git log --oneline --since="30 days ago" | head 20\n${recentLines}`);

  // Branches
  const branches = await execCommand("git", ["-C", repoPath, "branch", "-a"], repoPath, 10_000);
  const branchLines = branches.split("\n").slice(0, 20).join("\n");
  outputs.push(`$ git branch -a | head 20\n${branchLines}`);

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

  const outputMd = `# Phase ${phaseNumber} — Git Archaeology\n\n${summary}\n\n## Findings\n${JSON.stringify(findings, null, 2)}`;
  await fs.writeFile(path.join(auditOutputDir, `phase-${String(phaseNumber).padStart(2, "0")}.md`), outputMd, "utf8");

  await markPhaseCompleted(auditId, phaseNumber, outputMd, findings, usage.totalTokens);
};
