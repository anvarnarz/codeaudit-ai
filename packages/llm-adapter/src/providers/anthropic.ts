import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV1 } from "@ai-sdk/provider";

export function createAnthropicProvider(apiKey: string, model: string): LanguageModelV1 {
  const provider = createAnthropic({ apiKey });
  return provider(model);
}
