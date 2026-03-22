import { NextRequest, NextResponse } from "next/server";
import { getDb, decryptApiKey, apiKeys } from "@codeaudit/db";
import { eq } from "drizzle-orm";

// Anthropic models we surface (from research D-14)
const ANTHROPIC_MODELS = [
  { id: "claude-opus-4-5", name: "Claude Opus 4.5" },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5" },
  { id: "claude-haiku-3-5", name: "Claude Haiku 3.5" },
];

// OpenAI model filter pattern
const OPENAI_PATTERN = /^gpt-4/;

export async function GET(request: NextRequest) {
  const keyId = request.nextUrl.searchParams.get("keyId");
  if (!keyId) return NextResponse.json({ error: "keyId required" }, { status: 400 });

  const db = getDb();
  const key = db.select().from(apiKeys).where(eq(apiKeys.id, keyId)).get();
  if (!key) return NextResponse.json({ error: "Key not found" }, { status: 404 });

  const rawKey = decryptApiKey(key.encryptedKey, key.iv);
  const models = await fetchModelsForProvider(key.provider, rawKey);

  return NextResponse.json({ models, provider: key.provider });
}

async function fetchModelsForProvider(
  provider: "anthropic" | "openai" | "gemini",
  rawKey: string,
): Promise<Array<{ id: string; name: string }>> {
  try {
    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/models", {
        headers: { "x-api-key": rawKey, "anthropic-version": "2023-06-01" },
      });
      if (res.ok) {
        const data = await res.json() as { data: Array<{ id: string; display_name: string }> };
        return data.data
          .filter(m => m.id.includes("claude-sonnet") || m.id.includes("claude-opus") || m.id.includes("claude-haiku"))
          .map(m => ({ id: m.id, name: m.display_name ?? m.id }));
      }
      return ANTHROPIC_MODELS;
    }

    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${rawKey}` },
      });
      if (res.ok) {
        const data = await res.json() as { data: Array<{ id: string }> };
        return data.data
          .filter(m => OPENAI_PATTERN.test(m.id))
          .map(m => ({ id: m.id, name: m.id }))
          .slice(0, 10);
      }
    }

    if (provider === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${rawKey}`
      );
      if (res.ok) {
        const data = await res.json() as { models: Array<{ name: string; displayName: string }> };
        return data.models
          .filter(m => m.name.includes("gemini"))
          .map(m => ({ id: m.name.replace("models/", ""), name: m.displayName }));
      }
    }
  } catch {
    // Fall through to empty list
  }
  return [];
}
