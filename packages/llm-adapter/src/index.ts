import type { LanguageModelV1 } from "@ai-sdk/provider";
import { createAnthropicProvider } from "./providers/anthropic";
import { createOpenAIProvider } from "./providers/openai";
import { createGeminiProvider } from "./providers/gemini";
export { resolveModel, PHASE_COMPLEXITY } from "./models";
export type { LlmProvider, PhaseComplexity } from "./models";

export type LlmAdapterConfig = {
  provider: "anthropic" | "openai" | "gemini";
  apiKey: string; // decrypted — never log this
  model: string;  // already resolved via resolveModel()
};

// Returns the provider's LanguageModelV1 instance.
// Vercel AI SDK's generateObject / generateText accept LanguageModelV1 at runtime.
export function createLlmProvider(config: LlmAdapterConfig): LanguageModelV1 {
  switch (config.provider) {
    case "anthropic": return createAnthropicProvider(config.apiKey, config.model);
    case "openai":    return createOpenAIProvider(config.apiKey, config.model);
    case "gemini":    return createGeminiProvider(config.apiKey, config.model);
    default:
      throw new Error(`Unknown LLM provider: ${String(config.provider)}`);
  }
}
