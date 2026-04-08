import fs from "node:fs/promises";
import path from "node:path";
import { getDb, auditPhases, audits } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import type { AuditFindings, FindingsSeverity } from "@codeaudit-ai/db";
import { runPhaseLlm } from "../finding-extractor";
import { markPhaseCompleted } from "../progress-emitter";
import { getModel } from "./shared";
import type { AuditRunContext } from "../orchestrator";
import type { PhaseRunner } from "../phase-registry";

/**
 * Severity-weighted deduction scoring, inspired by Contrast Security's
 * Application Scoring methodology.
 *
 * Formula:  score = max(0, 100 − Σ(count × weight))
 *
 * | Severity | Weight |
 * |----------|--------|
 * | critical |   −20  |
 * | high     |   −10  |
 * | medium   |    −5  |
 * | low      |    −1  |
 * | info     |     0  |
 *
 * Grade thresholds (adjusted for holistic audit context):
 *   A 90-100 · B 75-89 · C 60-74 · D 40-59 · F 0-39
 *
 * Reference: https://docs.contrastsecurity.com/en/application-scoring-guide.html
 */
const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 20,
  high: 10,
  medium: 5,
  low: 1,
  info: 0,
};

function calculateScore(findings: { severity: string }[]): number {
  let deductions = 0;
  for (const f of findings) {
    deductions += SEVERITY_WEIGHTS[f.severity] ?? 0;
  }
  return Math.max(0, 100 - deductions);
}

function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

export const phase10Runner: PhaseRunner = async (ctx, phaseNumber) => {
  const { auditId, auditOutputDir } = ctx;

  // Retrieve all completed phase findings from DB
  const db = getDb();
  const allPhases = db.select().from(auditPhases)
    .where(eq(auditPhases.auditId, auditId))
    .all();

  const allFindings = allPhases.flatMap((p) => p.findings ?? []);

  // Deterministic score from severity-weighted deductions
  const score = calculateScore(allFindings);

  // Build synthesis prompt — LLM writes the executive summary only (no scoring)
  const prompt = `You are producing the final report for a codebase audit.
Below is the complete set of findings from all audit phases.

## All Findings (JSON)
<data_block source="audit_findings" trust="internal">
${JSON.stringify(allFindings, null, 2)}
</data_block>

Produce:
1. findings: top 10 most critical findings (already in the list above — select and return the most important ones)
2. summary: 2-3 paragraph executive summary of overall codebase health
3. phaseScore: ignore this field, set it to 0 (scoring is handled externally)`;

  let summary = `Audit completed with ${allFindings.length} findings across ${allPhases.filter(p => p.status === "completed").length} phases.`;
  let llmTokens = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let topFindings = allFindings.slice(0, 10);

  try {
    const model = getModel(ctx, phaseNumber);
    const result = await runPhaseLlm(model as Parameters<typeof runPhaseLlm>[0], prompt, phaseNumber);
    if (result.findings.length > 0) topFindings = result.findings;
    if (result.summary) summary = result.summary;
    llmTokens = result.usage.totalTokens;
    promptTokens = result.usage.promptTokens;
    completionTokens = result.usage.completionTokens;
  } catch (err) {
    console.warn(`[audit-engine] Phase 10: LLM synthesis failed — using aggregated findings directly. Error: ${String(err).slice(0, 150)}`);
  }

  // Build final report markdown
  const outputMd = `# Final Report — Codebase Health Audit

Generated: ${new Date().toISOString()}

## Executive Summary

${summary}

## Overall Health Score: ${Math.round(score)}/100 (${scoreToGrade(Math.round(score))})

## Top Findings

${JSON.stringify(topFindings, null, 2)}

## All Findings (${allFindings.length} total across all phases)

${JSON.stringify(allFindings, null, 2)}
`;

  await fs.writeFile(path.join(auditOutputDir, "final-report.md"), outputMd, "utf8");

  // Build AuditFindings summary for DB
  const severityCounts: Record<FindingsSeverity, number> = {
    critical: 0, high: 0, medium: 0, low: 0, info: 0,
  };
  for (const f of allFindings) {
    const sev = f.severity as FindingsSeverity;
    if (sev in severityCounts) {
      severityCounts[sev]++;
    }
  }

  const auditFindings: AuditFindings = {
    summary: {
      score: Math.round(score),
      grade: scoreToGrade(Math.round(score)),
      findings_count: severityCounts,
      categories: [...new Set(allFindings.map((f) => f.category))],
    },
    findings: allFindings,
    phases_completed: allPhases.filter((p) => p.status === "completed").map((p) => p.phaseNumber),
    generated_at: new Date().toISOString(),
  };

  // Update audits.findings with aggregated AuditFindings object
  db.update(audits).set({ findings: auditFindings }).where(eq(audits.id, auditId)).run();

  await markPhaseCompleted(auditId, phaseNumber, outputMd, topFindings, promptTokens, completionTokens);
};
