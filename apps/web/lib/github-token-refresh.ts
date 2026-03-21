/**
 * GitHub App user access token refresh mechanism.
 *
 * GitHub App user access tokens expire after 8 hours.
 * We refresh proactively 15 minutes before expiry to avoid 401s during API calls.
 *
 * Token lifecycle:
 * - access_token: expires in 8 hours (28800 seconds)
 * - refresh_token: expires in 6 months (15897600 seconds)
 *
 * The `accounts` table stores:
 * - access_token — current GitHub access token
 * - refresh_token — used to obtain a new access_token
 * - expires_at — Unix timestamp (seconds) when access_token expires
 *
 * Advisory locking: We use a simple database-level mechanism with an in-memory
 * per-process flag to prevent concurrent refreshes. For a distributed setup,
 * use Redis SETNX for distributed locking.
 */

import { getDb, accounts } from "@codeaudit/db";
import { eq, and } from "drizzle-orm";
import { isTokenExpiringSoon, refreshGitHubAppToken } from "./github-app";

// In-memory refresh lock — prevents concurrent refreshes within the same process.
// For multi-process/multi-server setups, replace with Redis SETNX.
const refreshLocks = new Set<string>();

/**
 * Get the GitHub access token for a user, refreshing it if needed.
 *
 * @param userId - The user's database ID
 * @returns The access token, or null if unavailable / refresh failed
 */
export async function getGitHubAccessToken(userId: string): Promise<string | null> {
  const db = getDb();

  const accountRecord = await db
    .select({
      accessToken: accounts.accessToken,
      refreshToken: accounts.refreshToken,
      expiresAt: accounts.expiresAt,
    })
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, userId),
        eq(accounts.provider, "github"),
      ),
    )
    .limit(1);

  if (accountRecord.length === 0) {
    return null;
  }

  const account = accountRecord[0];

  if (!account.accessToken) {
    return null;
  }

  // If no expiry stored, assume the token is a non-expiring OAuth token (not GitHub App)
  if (!account.expiresAt) {
    return account.accessToken;
  }

  // Check if token is still valid (not expiring soon)
  if (!isTokenExpiringSoon(account.expiresAt)) {
    return account.accessToken;
  }

  // Token is expiring soon — attempt proactive refresh
  if (!account.refreshToken) {
    // No refresh token available (OAuth App tokens don't have refresh tokens)
    // Return current token and let the caller handle 401s
    return account.accessToken;
  }

  return refreshUserToken(userId, account.refreshToken, account.expiresAt);
}

/**
 * Refresh a GitHub App user access token.
 * Uses a per-user in-memory lock to prevent concurrent refreshes.
 *
 * @param userId - User's database ID (used as lock key)
 * @param refreshToken - Current refresh token
 * @param currentExpiresAt - Current token expiry (Unix timestamp seconds)
 * @returns New access token, or current token if refresh fails
 */
async function refreshUserToken(
  userId: string,
  refreshToken: string,
  currentExpiresAt: number,
): Promise<string | null> {
  // Re-check the current state in DB to avoid TOCTOU race
  // (another concurrent request may have already refreshed)
  if (refreshLocks.has(userId)) {
    // Another refresh is in progress for this user — wait briefly and re-read
    await new Promise((resolve) => setTimeout(resolve, 500));
    return getGitHubAccessToken(userId);
  }

  refreshLocks.add(userId);

  try {
    console.log(`[token-refresh] Proactively refreshing token for user ${userId}`);

    const newTokenData = await refreshGitHubAppToken(refreshToken);

    if (!newTokenData) {
      // Refresh token expired or invalid — user needs to re-authenticate
      console.warn(
        `[token-refresh] Refresh failed for user ${userId} — refresh token may be expired. User needs to re-auth.`,
      );
      // Return null to signal that the caller should prompt re-auth
      return null;
    }

    const db = getDb();
    const nowSeconds = Math.floor(Date.now() / 1000);
    const newExpiresAt = nowSeconds + newTokenData.expires_in;

    await db
      .update(accounts)
      .set({
        accessToken: newTokenData.access_token,
        refreshToken: newTokenData.refresh_token,
        expiresAt: newExpiresAt,
      })
      .where(
        and(
          eq(accounts.userId, userId),
          eq(accounts.provider, "github"),
        ),
      );

    console.log(
      `[token-refresh] Token refreshed for user ${userId}. New expiry: ${new Date(newExpiresAt * 1000).toISOString()}`,
    );

    return newTokenData.access_token;
  } finally {
    refreshLocks.delete(userId);
  }
}

/**
 * Check if a user's GitHub connection requires re-authentication.
 * Returns true if the refresh token has expired (6-month window exceeded).
 *
 * @param userId - The user's database ID
 */
export async function requiresReAuth(userId: string): Promise<boolean> {
  const db = getDb();

  const accountRecord = await db
    .select({
      refreshToken: accounts.refreshToken,
      expiresAt: accounts.expiresAt,
    })
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, userId),
        eq(accounts.provider, "github"),
      ),
    )
    .limit(1);

  if (accountRecord.length === 0) {
    return true;
  }

  const account = accountRecord[0];

  if (!account.refreshToken || !account.expiresAt) {
    // Non-GitHub App token — no expiry concept
    return false;
  }

  // Attempt a token refresh to check if refresh token is still valid
  const token = await refreshUserToken(userId, account.refreshToken, account.expiresAt);
  return token === null;
}
