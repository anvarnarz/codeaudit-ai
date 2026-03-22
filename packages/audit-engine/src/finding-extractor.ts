import { generateObject } from "ai";
import { z } from "zod";

// OpenAI structured output requires ALL properties to be in the 'required' array.
// Use .default() instead of .optional() to satisfy this constraint.
export const AuditFindingSchema = z.object({
  id: z.string().default(""),
  phase: z.number().default(0),
  category: z.string().default("general"),
  severity: z.enum(["critical", "high", "medium", "low", "info"]).default("info"),
  title: z.string().default(""),
  description: z.string().default(""),
  filePaths: z.array(z.string()).default([]),
  lineNumbers: z.array(z.number()).default([]),
  recommendation: z.string().default(""),
});

export const PhaseOutputSchema = z.object({
  findings: z.array(AuditFindingSchema).default([]),
  summary: z.string().default(""),
  phaseScore: z.number().min(0).max(10).default(5),
});

export type PhaseOutput = z.infer<typeof PhaseOutputSchema>;

export async function runPhaseLlm(
  model: any,
  prompt: string,
  phaseNumber: number,
): Promise<{
  findings: PhaseOutput["findings"];
  summary: string;
  score: number;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}> {
  console.log(`[audit-engine] Phase ${phaseNumber}: calling LLM...`);
  const { object, usage } = await generateObject({
    model: model,
    schema: PhaseOutputSchema,
    prompt,
    maxOutputTokens: 4096,
  });

  // ai@7 uses inputTokens/outputTokens
  const promptTokens = (usage as any).inputTokens ?? (usage as any).promptTokens ?? 0;
  const completionTokens = (usage as any).outputTokens ?? (usage as any).completionTokens ?? 0;

  console.log(`[audit-engine] Phase ${phaseNumber}: LLM returned ${object.findings.length} findings, ${promptTokens + completionTokens} tokens`);

  return {
    findings: object.findings.map((f) => ({ ...f, id: f.id || crypto.randomUUID(), phase: phaseNumber })),
    summary: object.summary,
    score: object.phaseScore,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
  };
}
