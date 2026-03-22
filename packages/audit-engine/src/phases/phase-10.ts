import fs from "node:fs/promises";
import path from "node:path";
import { getDb, auditPhases, audits } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import type { AuditFindings, FindingsSeverity } from "@codeaudit-ai/db";
import { runPhaseLlm } from "../finding-extractor.js";
import { markPhaseCompleted } from "../progress-emitter.js";
import { getModel } from "./shared.js";
import type { AuditRunContext, PhaseRunner } from "../orchestrator.js";

function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
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

  // Build synthesis prompt (no shell commands — commandOutput is the findings JSON)
  const prompt = `You are producing the final report for a codebase audit.
Below is the complete set of findings from all audit phases.

## All Findings (JSON)
<data_block source="audit_findings" trust="internal">
${JSON.stringify(allFindings, null, 2)}
</data_block>

Produce:
1. findings: top 10 most critical findings (already in the list above — select and return the most important ones)
2. summary: 2-3 paragraph executive summary of overall codebase health
3. phaseScore: overall health score 0-10 (10 = excellent, 0 = critical failures)`;

  const model = getModel(ctx, phaseNumber);
  const { findings, summary, score, usage } = await runPhaseLlm(model as Parameters<typeof runPhaseLlm>[0], prompt, phaseNumber);

  // Build final report markdown
  const outputMd = `# Final Report — Codebase Health Audit

Generated: ${new Date().toISOString()}

## Executive Summary

${summary}

## Overall Health Score: ${Math.round(score * 10)}/100 (${scoreToGrade(Math.round(score * 10))})

## Top Findings

${JSON.stringify(findings, null, 2)}

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
      score: Math.round(score * 10),
      grade: scoreToGrade(Math.round(score * 10)),
      findings_count: severityCounts,
      categories: [...new Set(allFindings.map((f) => f.category))],
    },
    findings: allFindings,
    phases_completed: allPhases.filter((p) => p.status === "completed").map((p) => p.phaseNumber),
    generated_at: new Date().toISOString(),
  };

  // Update audits.findings with aggregated AuditFindings object
  db.update(audits).set({ findings: auditFindings }).where(eq(audits.id, auditId)).run();

  await markPhaseCompleted(auditId, phaseNumber, outputMd, findings, usage.totalTokens);
};
