import fs from "node:fs/promises";
import path from "node:path";
import { generateText, Output, stepCountIs } from "ai";
import { PhaseOutputSchema } from "./finding-extractor";
import { buildToolUsePhasePrompt, FINDING_FORMAT_TEMPLATE } from "./prompt-builder";
import { createExecCommandTool } from "./tools/exec-command-tool";
import { getGuideChunk } from "./guide-chunks";
import { getPhaseName } from "./phases/index";
import { getRepoContext } from "./phases/shared";
import { getModel } from "./phases/shared";
import { markPhaseCompleted } from "./progress-emitter";
import type { AuditRunContext } from "./orchestrator";

/**
 * Shared phase runner helper that uses generateText with tool-use.
 *
 * The LLM reads the audit guide section + RepoContext, then decides what shell commands
 * to run against the repository via the sandboxed execCommand tool. After gathering data,
 * it produces structured findings that match PhaseOutputSchema.
 *
 * This enables polyglot auditing: instead of hardcoding JS/TS-specific commands,
 * the LLM selects commands appropriate for the detected stack.
 *
 * @param ctx         - Audit run context (auditId, repoPath, auditOutputDir, provider, model, depth)
 * @param phaseNumber - Phase number (1-9) to execute
 */
export async function runPhaseWithTools(
  ctx: AuditRunContext,
  phaseNumber: number,
): Promise<void> {
  console.log(`[audit-engine] Phase ${phaseNumber} (tool-use): starting...`);

  // 1. Gather inputs
  const repoContext = getRepoContext(ctx.auditId);
  const model = getModel(ctx, phaseNumber);
  const guideChunk = getGuideChunk(phaseNumber);

  // 2. Build tool-use prompt (no pre-embedded command output)
  const prompt = buildToolUsePhasePrompt(
    guideChunk,
    repoContext,
    ctx.repoPath,
    FINDING_FORMAT_TEMPLATE,
  );

  // 3. Create sandboxed execCommand tool (30s default timeout per command)
  const execCommandTool = createExecCommandTool(ctx.repoPath);

  // 4. Run LLM with tool-use loop
  //    - output: Output.object({ schema: PhaseOutputSchema }) — structured output matching existing schema (PRF-13)
  //    - stopWhen: stepCountIs(15) — cap at 15 tool call rounds to prevent infinite loops
  //    - maxOutputTokens: 16384 — enough for findings JSON
  const result = await generateText({
    model,
    prompt,
    tools: { execCommand: execCommandTool },
    output: Output.object({ schema: PhaseOutputSchema }),
    stopWhen: stepCountIs(15),
    maxOutputTokens: 16384,
  });

  // 5. Extract structured output
  //    In AI SDK v6 with output, the result has .output property containing the parsed object
  const phaseOutput = result.output;

  // 6. Extract token usage (AI SDK v6 uses inputTokens/outputTokens)
  const inputTokens = (result.usage as any).inputTokens ?? (result.usage as any).promptTokens ?? 0;
  const outputTokens = (result.usage as any).outputTokens ?? (result.usage as any).completionTokens ?? 0;
  const totalTokens = inputTokens + outputTokens;

  console.log(
    `[audit-engine] Phase ${phaseNumber} (tool-use): ${phaseOutput.findings.length} findings, ${totalTokens} tokens`
  );

  // 7. Set phase number on each finding (same pattern as runPhaseLlm)
  const findings = phaseOutput.findings.map((f) => ({ ...f, phase: phaseNumber }));

  // 8. Build markdown output file
  const phaseName = getPhaseName(phaseNumber);
  const outputMd = [
    `# Phase ${phaseNumber} — ${phaseName}`,
    "",
    phaseOutput.summary,
    "",
    "## Findings",
    JSON.stringify(findings, null, 2),
  ].join("\n");

  // 9. Write output markdown to the audit output directory
  const phaseFile = path.join(
    ctx.auditOutputDir,
    `phase-${String(phaseNumber).padStart(2, "0")}.md`,
  );
  await fs.writeFile(phaseFile, outputMd, "utf-8");

  // 10. Persist phase results to DB
  await markPhaseCompleted(ctx.auditId, phaseNumber, outputMd, findings, totalTokens);
}
