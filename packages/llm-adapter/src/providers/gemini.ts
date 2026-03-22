import { createGoogleGenerativeAI } from "@ai-sdk/google";


export function createGeminiProvider(apiKey: string, model: string): any {
  const provider = createGoogleGenerativeAI({ apiKey });
  return provider(model);
}
