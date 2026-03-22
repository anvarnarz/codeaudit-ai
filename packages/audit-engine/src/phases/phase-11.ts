import fs from "node:fs/promises";
import path from "node:path";
import { getDb, audits } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import { markPhaseCompleted } from "../progress-emitter";
import { generateManagementReport, generateTechnicalReport } from "../report-templates";
import type { PhaseRunner } from "../orchestrator";

export const phase11Runner: PhaseRunner = async (ctx, phaseNumber) => {
  const { auditId, auditOutputDir } = ctx;

  const db = getDb();
  const audit = db.select().from(audits).where(eq(audits.id, auditId)).get();
  const findings = audit?.findings?.findings ?? [];
  const scoreValue = audit?.findings?.summary?.score ?? 0;
  const grade = audit?.findings?.summary?.grade ?? "F";
  const severityCounts = audit?.findings?.summary?.findings_count ?? {
    critical: 0, high: 0, medium: 0, low: 0, info: 0,
  };

  const reportData = {
    repoName: audit?.folderName ?? path.basename(ctx.repoPath),
    date: new Date().toISOString().slice(0, 10),
    score: scoreValue,
    grade,
    severityCounts,
    findings,
    auditType: ctx.auditType,
    depth: ctx.depth,
  };

  const managementHtml = generateManagementReport(reportData);
  const technicalHtml = generateTechnicalReport(reportData);

  await fs.writeFile(path.join(auditOutputDir, "report-management.html"), managementHtml, "utf8");
  await fs.writeFile(path.join(auditOutputDir, "report-technical.html"), technicalHtml, "utf8");

  const outputMd = `# Phase 11 — HTML Reports Generated\n\nFiles: report-management.html, report-technical.html\nScore: ${scoreValue}/100 (${grade}), ${findings.length} findings`;

  await markPhaseCompleted(auditId, phaseNumber, outputMd, [], 0);
};
