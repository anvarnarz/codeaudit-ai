import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModelV1 } from "@ai-sdk/provider";

export function createGeminiProvider(apiKey: string, model: string): LanguageModelV1 {
  const provider = createGoogleGenerativeAI({ apiKey });
  return provider(model);
}
