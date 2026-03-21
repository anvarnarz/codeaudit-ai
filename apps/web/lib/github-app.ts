/**
 * GitHub App utilities for installation management.
 *
 * Two separate GitHub mechanisms work together:
 * 1. Auth.js / GitHub OAuth — user sign-in (AUTH_GITHUB_ID / AUTH_GITHUB_SECRET)
 * 2. GitHub App — per-repo access (GITHUB_APP_ID, GITHUB_APP_CLIENT_ID, etc.)
 */

export const GITHUB_APP_NAME = process.env["GITHUB_APP_NAME"] ?? "codeaudit-app";

/**
 * Returns the URL to install the GitHub App on the user's account/org.
 * GitHub redirects back to GITHUB_APP_CALLBACK_URL after installation.
 */
export function getGitHubAppInstallUrl(state?: string): string {
  const baseUrl = `https://github.com/apps/${GITHUB_APP_NAME}/installations/new`;
  if (state) {
    return `${baseUrl}?state=${encodeURIComponent(state)}`;
  }
  return baseUrl;
}

/**
 * Returns the URL to manage existing repositories for a GitHub App installation.
 */
export function getGitHubAppManageUrl(installationId: number): string {
  return `https://github.com/settings/installations/${installationId}`;
}

/**
 * Check if a GitHub App user access token is expiring within the threshold.
 * GitHub App user tokens expire after 8 hours; we refresh proactively at 15 min.
 *
 * @param expiresAt - Unix timestamp (seconds) when the token expires
 * @param thresholdMinutes - minutes before expiry to consider it "expiring soon" (default: 15)
 */
export function isTokenExpiringSoon(
  expiresAt: number,
  thresholdMinutes: number = 15,
): boolean {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const thresholdSeconds = thresholdMinutes * 60;
  return expiresAt - nowSeconds <= thresholdSeconds;
}

/**
 * Check if a refresh token has expired (GitHub App refresh tokens expire after 6 months).
 */
export function isRefreshTokenExpired(refreshTokenExpiresAt: number): boolean {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return refreshTokenExpiresAt <= nowSeconds;
}

/**
 * Refresh a GitHub App user access token using the refresh token.
 * Returns null if the refresh token itself is expired (user needs to re-auth).
 */
export async function refreshGitHubAppToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  token_type: string;
} | null> {
  const clientId = process.env["GITHUB_APP_CLIENT_ID"];
  const clientSecret = process.env["GITHUB_APP_CLIENT_SECRET"];

  if (!clientId || !clientSecret) {
    throw new Error(
      "GITHUB_APP_CLIENT_ID and GITHUB_APP_CLIENT_SECRET must be set",
    );
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  // GitHub returns an error field if the refresh token is expired
  if (data.error) {
    return null;
  }

  return data;
}
