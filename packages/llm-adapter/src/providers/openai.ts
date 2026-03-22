import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "@ai-sdk/provider";

export function createOpenAIProvider(apiKey: string, model: string): LanguageModelV1 {
  const provider = createOpenAI({ apiKey });
  return provider(model);
}
