import { generateObject } from "ai";
import { z } from "zod";


export const AuditFindingSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  phase: z.number(),
  category: z.string(),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  title: z.string(),
  description: z.string(),
  filePaths: z.array(z.string()).optional(),
  lineNumbers: z.array(z.number()).optional(),
  recommendation: z.string().optional(),
});

export const PhaseOutputSchema = z.object({
  findings: z.array(AuditFindingSchema),
  summary: z.string(),     // 1-2 sentence phase summary
  phaseScore: z.number().min(0).max(10), // health score for this dimension
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
  const { object, usage } = await generateObject({
    // Cast needed: providers return V1, ai@6 types expect V2/V3
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: model,
    schema: PhaseOutputSchema,
    prompt,
    maxOutputTokens: 4096,
  });

  // ai@6 uses inputTokens/outputTokens (not promptTokens/completionTokens)
  const promptTokens = usage.inputTokens ?? 0;
  const completionTokens = usage.outputTokens ?? 0;

  return {
    findings: object.findings.map((f) => ({ ...f, phase: phaseNumber })),
    summary: object.summary,
    score: object.phaseScore,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
  };
}
