import fs from "node:fs/promises";
import path from "node:path";
import { generateText, stepCountIs } from "ai";
import { PhaseOutputSchema, AuditFindingSchema, type PhaseOutput } from "./finding-extractor";
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
  type PhaseResult = { findings: PhaseOutput["findings"]; phaseScore: number; summary: string };
  const emptyResult: PhaseResult = { findings: [], phaseScore: 0, summary: "Phase produced no output." };
  let phaseOutput: PhaseResult;
  let totalTokens = 0;

  try {
    // Don't use Output.object — Gemini rejects combining tools + structured output.
    // Instead, ask for JSON in the prompt and parse from result.text.
    const jsonInstruction = `\n\nAfter gathering data with the execCommand tool, return your findings as a JSON object with this exact shape:
{ "findings": [{ "id": "uuid", "phase": ${phaseNumber}, "category": "string", "severity": "critical|high|medium|low|info", "title": "string", "description": "string", "filePaths": ["string"], "lineNumbers": [number], "recommendation": "string" }], "phaseScore": 0-100, "summary": "string" }
Return ONLY the JSON object — no markdown, no code fences, no explanation before or after.`;

    const result = await generateText({
      model,
      prompt: prompt + jsonInstruction,
      tools: { execCommand: execCommandTool },
      stopWhen: stepCountIs(20),
      maxOutputTokens: 65536,
    });

    // Parse JSON from the LLM's final text response
    const text = result.text.trim();
    // Extract JSON — handle cases where LLM wraps in ```json ... ```
    let jsonStr = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // Try parsing, with repair for truncated JSON
    let jsonObj: unknown;
    try {
      jsonObj = JSON.parse(jsonStr);
    } catch {
      // Attempt repair: close open strings/arrays/objects
      let repaired = jsonStr;
      // Close unclosed string
      const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
      if (quoteCount % 2 !== 0) repaired += '"';
      // Close unclosed brackets
      const opens = (repaired.match(/[{[]/g) || []).length;
      const closes = (repaired.match(/[}\]]/g) || []).length;
      for (let i = 0; i < opens - closes; i++) {
        // Guess: if last unclosed was array use ], else }
        repaired += repaired.lastIndexOf("[") > repaired.lastIndexOf("{") ? "]" : "}";
      }
      // Remove trailing comma before closing bracket
      repaired = repaired.replace(/,\s*([}\]])/g, "$1");
      try {
        jsonObj = JSON.parse(repaired);
        console.log(`[audit-engine] Phase ${phaseNumber}: repaired truncated JSON`);
      } catch (e2) {
        throw e2; // let outer catch handle
      }
    }

    const parsed = PhaseOutputSchema.safeParse(jsonObj);
    if (parsed.success) {
      phaseOutput = parsed.data;
    } else {
      // Lenient fallback: try to extract findings array from the JSON even if top-level shape differs
      const obj = jsonObj as Record<string, unknown>;
      const rawFindings = Array.isArray(obj.findings) ? obj.findings : [];
      const validFindings = rawFindings
        .map((f: unknown) => AuditFindingSchema.safeParse(f))
        .filter((r) => r.success)
        .map((r) => (r as { data: PhaseOutput["findings"][number] }).data);

      if (validFindings.length > 0) {
        console.log(`[audit-engine] Phase ${phaseNumber}: schema validation partial — rescued ${validFindings.length} findings`);
        phaseOutput = {
          findings: validFindings,
          phaseScore: typeof obj.phaseScore === "number" ? obj.phaseScore : 0,
          summary: typeof obj.summary === "string" ? obj.summary : `Phase ${phaseNumber} completed with ${validFindings.length} findings.`,
        };
      } else {
        console.warn(`[audit-engine] Phase ${phaseNumber}: JSON parsed but 0 findings passed validation`);
        phaseOutput = { ...emptyResult, summary: "Phase output failed schema validation: " + parsed.error.message.slice(0, 300) };
      }
    }

    const inputTokens = (result.usage as any).inputTokens ?? (result.usage as any).promptTokens ?? 0;
    const outputTokens = (result.usage as any).outputTokens ?? (result.usage as any).completionTokens ?? 0;
    totalTokens = inputTokens + outputTokens;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[audit-engine] Phase ${phaseNumber} (tool-use): LLM error — ${errMsg.slice(0, 200)}`);
    phaseOutput = { ...emptyResult, summary: `Phase failed: ${errMsg.slice(0, 300)}` };
  }

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
  await markPhaseCompleted(ctx.auditId, phaseNumber, outputMd, findings, inputTokensTotal, outputTokensTotal);
}

/**
 * Parse and validate phase output JSON from LLM response.
 * Handles: valid JSON, truncated JSON (repair), partial schema match (rescue findings).
 * Exported for testing.
 */
export function parsePhaseOutput(
  text: string,
  phaseNumber: number,
): { findings: PhaseOutput["findings"]; phaseScore: number; summary: string } {
  const emptyResult = { findings: [] as PhaseOutput["findings"], phaseScore: 0, summary: "Phase produced no output." };

  // Strip markdown code fences
  let jsonStr = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!jsonStr) return { ...emptyResult, summary: "Empty LLM response" };

  // Try parsing, with repair for truncated JSON
  let jsonObj: unknown;
  try {
    jsonObj = JSON.parse(jsonStr);
  } catch {
    let repaired = jsonStr;
    const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) repaired += '"';
    const opens = (repaired.match(/[{[]/g) || []).length;
    const closes = (repaired.match(/[}\]]/g) || []).length;
    for (let i = 0; i < opens - closes; i++) {
      repaired += repaired.lastIndexOf("[") > repaired.lastIndexOf("{") ? "]" : "}";
    }
    repaired = repaired.replace(/,\s*([}\]])/g, "$1");
    try {
      jsonObj = JSON.parse(repaired);
    } catch {
      return { ...emptyResult, summary: "Failed to parse LLM JSON output" };
    }
  }

  const parsed = PhaseOutputSchema.safeParse(jsonObj);
  if (parsed.success) {
    return {
      findings: parsed.data.findings.map((f) => ({ ...f, phase: phaseNumber })),
      phaseScore: parsed.data.phaseScore,
      summary: parsed.data.summary,
    };
  }

  // Lenient: extract individual valid findings
  const obj = jsonObj as Record<string, unknown>;
  const rawFindings = Array.isArray(obj.findings) ? obj.findings : [];
  const validFindings = rawFindings
    .map((f: unknown) => AuditFindingSchema.safeParse(f))
    .filter((r) => r.success)
    .map((r) => (r as { data: PhaseOutput["findings"][number] }).data);

  if (validFindings.length > 0) {
    return {
      findings: validFindings.map((f) => ({ ...f, phase: phaseNumber })),
      phaseScore: typeof obj.phaseScore === "number" ? obj.phaseScore : 0,
      summary: typeof obj.summary === "string" ? obj.summary : `Phase ${phaseNumber} completed with ${validFindings.length} findings.`,
    };
  }

  return { ...emptyResult, summary: "Phase output failed schema validation" };
}
