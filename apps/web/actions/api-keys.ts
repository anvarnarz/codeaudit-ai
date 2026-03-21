"use server";

/**
 * Server actions for API key CRUD operations.
 *
 * Security invariants:
 * - All actions require an authenticated session
 * - All DB queries are scoped to the authenticated userId (IDOR prevention)
 * - Encrypted keys are NEVER returned to the client — only metadata
 * - Plaintext keys are validated, then immediately encrypted and discarded
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  getDb,
  apiKeys,
  encryptApiKey,
  maskApiKey,
} from "@codeaudit/db";
import { eq, and } from "drizzle-orm";
import { validateApiKey, type Provider } from "@/lib/api-key-validator";
import { z } from "zod";

// ============================================================
// Input validation schemas
// ============================================================

const providerSchema = z.enum(["anthropic", "openai", "gemini"]);
const labelSchema = z
  .string()
  .min(1, "Label is required")
  .max(64, "Label must be 64 characters or fewer")
  .trim();

// ============================================================
// Types returned to the client (never include encrypted key)
// ============================================================

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
// Helper: get authenticated userId or throw
// ============================================================

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

// ============================================================
// listApiKeys — fetch all keys for the current user
// ============================================================

export async function listApiKeys(): Promise<ActionResult<ApiKeyRecord[]>> {
  try {
    const userId = await requireUserId();
    const db = getDb();

    const rows = await db
      .select({
        id: apiKeys.id,
        provider: apiKeys.provider,
        label: apiKeys.label,
        maskedKey: apiKeys.maskedKey,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(apiKeys.provider, apiKeys.createdAt);

    const records: ApiKeyRecord[] = rows.map((row) => ({
      id: row.id,
      provider: row.provider as Provider,
      label: row.label,
      maskedKey: row.maskedKey,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return { success: true, data: records };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list API keys";
    return { success: false, error: message };
  }
}

// ============================================================
// createApiKey — validate, encrypt, and store a new API key
// ============================================================

export async function createApiKey(
  provider: string,
  label: string,
  rawKey: string,
): Promise<ActionResult<ApiKeyRecord>> {
  try {
    const userId = await requireUserId();

    // Validate inputs
    const parsedProvider = providerSchema.safeParse(provider);
    if (!parsedProvider.success) {
      return { success: false, error: "Invalid provider" };
    }

    const parsedLabel = labelSchema.safeParse(label);
    if (!parsedLabel.success) {
      return { success: false, error: parsedLabel.error.errors[0]?.message ?? "Invalid label" };
    }

    if (!rawKey || rawKey.trim().length === 0) {
      return { success: false, error: "API key is required" };
    }

    // Validate the key against the provider
    const validationResult = await validateApiKey(parsedProvider.data, rawKey);

    if (validationResult.status === "invalid_key") {
      return { success: false, error: validationResult.message };
    }

    if (validationResult.status === "network_error") {
      return { success: false, error: validationResult.message };
    }

    // Key is valid (or rate_limited / quota_exceeded — still a valid key)
    // Encrypt the key
    const { encrypted, iv } = encryptApiKey(rawKey.trim());

    // Store in DB
    const db = getDb();
    const now = new Date();

    const masked = maskApiKey(rawKey.trim());

    const [row] = await db
      .insert(apiKeys)
      .values({
        userId,
        provider: parsedProvider.data,
        label: parsedLabel.data,
        encryptedKey: encrypted,
        iv,
        maskedKey: masked,
      })
      .returning({
        id: apiKeys.id,
        provider: apiKeys.provider,
        label: apiKeys.label,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
      });

    revalidatePath("/settings/api-keys");
    revalidatePath("/onboarding");

    return {
      success: true,
      data: {
        id: row.id,
        provider: row.provider as Provider,
        label: row.label,
        maskedKey: masked,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create API key";
    return { success: false, error: message };
  }
}

// ============================================================
// updateApiKeyLabel — update label only (key must be re-entered to change)
// ============================================================

export async function updateApiKeyLabel(
  keyId: string,
  newLabel: string,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();

    const parsedLabel = labelSchema.safeParse(newLabel);
    if (!parsedLabel.success) {
      return { success: false, error: parsedLabel.error.errors[0]?.message ?? "Invalid label" };
    }

    const db = getDb();

    // Scope update to userId (IDOR prevention)
    const updated = await db
      .update(apiKeys)
      .set({
        label: parsedLabel.data,
        updatedAt: new Date(),
      })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
      .returning({ id: apiKeys.id });

    if (updated.length === 0) {
      return { success: false, error: "API key not found" };
    }

    revalidatePath("/settings/api-keys");
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update API key label";
    return { success: false, error: message };
  }
}

// ============================================================
// deleteApiKey — delete with userId scope check (IDOR prevention)
// ============================================================

export async function deleteApiKey(keyId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const db = getDb();

    // Scope delete to userId — cannot delete another user's keys
    const deleted = await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
      .returning({ id: apiKeys.id });

    if (deleted.length === 0) {
      return { success: false, error: "API key not found" };
    }

    revalidatePath("/settings/api-keys");
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete API key";
    return { success: false, error: message };
  }
}
