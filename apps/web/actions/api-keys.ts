"use server";

/**
 * Server actions for API key CRUD operations.
 *
 * No-auth local-first design: no session guard, no userId scoping.
 * The tool runs on localhost — whoever has access to localhost is the user.
 */

import { revalidatePath } from "next/cache";
import { getDb, apiKeys, encryptApiKey, decryptApiKey, maskApiKey } from "@codeaudit/db";
import { validateApiKey } from "@/lib/api-key-validator";
import { eq } from "drizzle-orm";

export type Provider = "anthropic" | "openai" | "gemini";

export type ApiKeyRecord = {
  id: string;
  provider: Provider;
  label: string;
  maskedKey: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================
// addApiKey — validate, encrypt, and store a new API key
// ============================================================

export async function addApiKey(
  provider: Provider,
  rawKey: string,
  label: string,
): Promise<ActionResult<ApiKeyRecord>> {
  try {
    if (!rawKey || rawKey.trim().length === 0) {
      return { success: false, error: "API key is required" };
    }

    const validation = await validateApiKey(provider, rawKey);
    if (validation.status === "invalid_key") {
      return { success: false, error: validation.message };
    }
    if (validation.status === "network_error") {
      return { success: false, error: validation.message };
    }

    const { encrypted, iv } = encryptApiKey(rawKey.trim());
    const masked = maskApiKey(rawKey.trim());
    const db = getDb();

    const rows = await db
      .insert(apiKeys)
      .values({ provider, label: label || "Default", encryptedKey: encrypted, iv, maskedKey: masked })
      .returning({
        id: apiKeys.id,
        provider: apiKeys.provider,
        label: apiKeys.label,
        maskedKey: apiKeys.maskedKey,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
      });

    const row = rows[0];
    if (!row) {
      return { success: false, error: "Failed to insert API key" };
    }

    revalidatePath("/settings/api-keys");

    return {
      success: true,
      data: {
        id: row.id,
        provider: row.provider as Provider,
        label: row.label,
        maskedKey: row.maskedKey,
        createdAt: row.createdAt ?? new Date(),
        updatedAt: row.updatedAt ?? new Date(),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add API key";
    return { success: false, error: message };
  }
}

// Alias: old action name expected by client component
export const createApiKey = addApiKey;

// ============================================================
// listApiKeys — fetch all stored keys
// ============================================================

export async function listApiKeys(): Promise<ActionResult<ApiKeyRecord[]>> {
  try {
    const db = getDb();
    const rows = db
      .select({
        id: apiKeys.id,
        provider: apiKeys.provider,
        label: apiKeys.label,
        maskedKey: apiKeys.maskedKey,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
      })
      .from(apiKeys)
      .orderBy(apiKeys.provider, apiKeys.label)
      .all();

    const records: ApiKeyRecord[] = rows.map((row) => ({
      id: row.id,
      provider: row.provider as Provider,
      label: row.label,
      maskedKey: row.maskedKey,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    }));

    return { success: true, data: records };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list API keys";
    return { success: false, error: message };
  }
}

// ============================================================
// deleteApiKey — remove a stored key by id
// ============================================================

export async function deleteApiKey(id: string): Promise<ActionResult> {
  try {
    const db = getDb();
    db.delete(apiKeys).where(eq(apiKeys.id, id)).run();
    revalidatePath("/settings/api-keys");
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete API key";
    return { success: false, error: message };
  }
}

// ============================================================
// updateApiKey / updateApiKeyLabel — update label of a stored key
// ============================================================

export async function updateApiKey(id: string, label: string): Promise<ActionResult> {
  try {
    const db = getDb();
    db.update(apiKeys).set({ label, updatedAt: new Date() }).where(eq(apiKeys.id, id)).run();
    revalidatePath("/settings/api-keys");
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update API key";
    return { success: false, error: message };
  }
}

// Alias for client component compatibility
export const updateApiKeyLabel = updateApiKey;

// Re-export decryptApiKey for audit engine use
export { decryptApiKey };
