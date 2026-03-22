import { createOpenAI } from "@ai-sdk/openai";


export function createOpenAIProvider(apiKey: string, model: string): any {
  const provider = createOpenAI({ apiKey });
  return provider(model);
}
