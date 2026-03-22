import fs from "node:fs/promises";
import path from "node:path";

export type FolderStats = {
  fileCount: number;
  totalBytes: number;
  estimatedTokens: number;
};

export type AuditType = "full" | "security" | "team-collaboration" | "code-quality";
export type AuditDepth = "quick" | "deep";
export type Provider = "anthropic" | "openai" | "gemini";

// Rough heuristic: average 250 chars/token for code
const CHARS_PER_TOKEN = 250;

export async function collectFolderStats(folderPath: string): Promise<FolderStats> {
  let fileCount = 0;
  let totalBytes = 0;

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        const stat = await fs.stat(fullPath);
        fileCount++;
        totalBytes += stat.size;
      }
    }
  }

  await walk(folderPath);
  return { fileCount, totalBytes, estimatedTokens: Math.round(totalBytes / CHARS_PER_TOKEN) };
}

// Pricing in microdollars per 1k tokens
const PRICING: Record<Provider, { input: number; output: number }> = {
  anthropic: { input: 3000, output: 15000 },   // Claude Sonnet
  openai:    { input: 2500, output: 10000 },    // GPT-4o
  gemini:    { input: 1250, output: 5000 },     // Gemini 2.0 Flash
};

// Phase count by audit type
const PHASE_COUNT: Record<AuditType, number> = {
  full: 13,
  security: 5,
  "team-collaboration": 4,
  "code-quality": 4,
};

// Depth multiplier on input tokens (quick scan samples ~30% of repo)
const DEPTH_MULTIPLIER: Record<AuditDepth, number> = { quick: 0.3, deep: 1.0 };

/**
 * Returns estimated cost range in USD cents [min, max].
 * stats = null means no folder selected yet — uses a default mid-size repo estimate.
 */
export function estimateCostRange(
  stats: FolderStats | null,
  auditType: AuditType,
  depth: AuditDepth,
  provider: Provider,
): [number, number] {
  const tokens = stats?.estimatedTokens ?? 150_000; // ~37k lines default
  const phases = PHASE_COUNT[auditType];
  const depthMult = DEPTH_MULTIPLIER[depth];
  const pricing = PRICING[provider];

  const inputTokens = tokens * phases * depthMult;
  // Output is roughly 15% of input for structured responses
  const outputTokens = inputTokens * 0.15;

  const costMicros = (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
  const costCents = costMicros / 10_000; // microdollars → cents

  // Return a ±40% range to communicate uncertainty
  return [Math.max(1, Math.round(costCents * 0.6)), Math.round(costCents * 1.4)];
}

export function formatCostRange([min, max]: [number, number]): string {
  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  return `${fmt(min)}–${fmt(max)}`;
}
