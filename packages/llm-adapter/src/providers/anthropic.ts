import { createAnthropic } from "@ai-sdk/anthropic";


export function createAnthropicProvider(apiKey: string, model: string): any {
  const provider = createAnthropic({ apiKey });
  return provider(model);
}
