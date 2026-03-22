import fs from "node:fs/promises";
import path from "node:path";
import { getDb, audits } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import { generateText } from "ai";
import { markPhaseCompleted } from "../progress-emitter";
import { getModel } from "./shared";
import type { AuditRunContext, PhaseRunner } from "../orchestrator";

export const phase11Runner: PhaseRunner = async (ctx, phaseNumber) => {
  const { auditId, auditOutputDir } = ctx;

  // Get aggregated findings written by phase 10
  const db = getDb();
  const audit = db.select().from(audits).where(eq(audits.id, auditId)).get();
  const findings = audit?.findings?.findings ?? [];
  const scoreValue = audit?.findings?.summary?.score ?? 0;
  const grade = audit?.findings?.summary?.grade ?? "F";
  const severityCounts = audit?.findings?.summary?.findings_count ?? {
    critical: 0, high: 0, medium: 0, low: 0, info: 0,
  };
  const executiveSummary = findings.slice(0, 5).map((f) => `- [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`).join("\n");

  const model = getModel(ctx, phaseNumber);

  // Call 1: Management/executive HTML report
  const { text: managementHtml } = await generateText({
    // Cast needed: providers return V1, ai@6 types expect V2/V3
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: model as any,
    prompt: `Generate a complete self-contained HTML page for a management/executive codebase audit report.
Use inline CSS only (no external stylesheets or scripts).
Include: health score (${scoreValue}/100, grade ${grade}), severity chart (CSS bars for critical/high/medium/low/info counts), executive summary, top 5 most critical findings.

Severity counts: Critical=${severityCounts.critical}, High=${severityCounts.high}, Medium=${severityCounts.medium}, Low=${severityCounts.low}, Info=${severityCounts.info}

Top findings:
${executiveSummary}

<data_block source="audit_findings" trust="internal">
${JSON.stringify(findings.slice(0, 50), null, 2)}
</data_block>

Return ONLY the HTML document. Start with <!DOCTYPE html>. Use a clean professional dark theme.`,
    maxOutputTokens: 8192,
  });

  // Call 2: Technical HTML report (full findings table)
  const { text: technicalHtml } = await generateText({
    // Cast needed: providers return V1, ai@6 types expect V2/V3
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: model as any,
    prompt: `Generate a complete self-contained HTML page for a technical codebase audit report.
Use inline CSS only (no external stylesheets or scripts).
Include: full findings table with columns: Phase, Category, Severity, Title, Description, File Paths, Line Numbers, Recommendation.
Show all ${findings.length} findings. Color-code by severity (critical=red, high=orange, medium=yellow, low=blue, info=gray).

<data_block source="audit_findings" trust="internal">
${JSON.stringify(findings, null, 2)}
</data_block>

Return ONLY the HTML document. Start with <!DOCTYPE html>. Use a clean professional dark theme with sortable appearance.`,
    maxOutputTokens: 8192,
  });

  // Write both HTML files to auditOutputDir (EXEC-07: never write to repoPath)
  await fs.writeFile(path.join(auditOutputDir, "report-management.html"), managementHtml, "utf8");
  await fs.writeFile(path.join(auditOutputDir, "report-technical.html"), technicalHtml, "utf8");

  const outputMd = `# Phase ${phaseNumber} — HTML Reports Generated

Files written to audit output directory:
- report-management.html (executive/management view)
- report-technical.html (technical full findings view)

Total findings: ${findings.length}
Health score: ${scoreValue}/100 (${grade})
`;

  await markPhaseCompleted(auditId, phaseNumber, outputMd, [], 0);
};
