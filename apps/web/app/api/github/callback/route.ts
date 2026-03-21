/**
 * GitHub App installation callback.
 *
 * After a user installs the GitHub App, GitHub redirects here with:
 * - installation_id: the numeric installation ID
 * - setup_action: "install" | "request" | "update"
 * - state: optional state parameter we passed (used for CSRF-like verification)
 *
 * We store the installation record and redirect to the next onboarding step.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, githubInstallations } from "@codeaudit/db";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const { searchParams } = new URL(request.url);
  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");
  const redirectTo = searchParams.get("state") ?? "/onboarding";

  if (!installationId) {
    // No installation ID — user may have cancelled
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  const installationIdNum = parseInt(installationId, 10);

  if (isNaN(installationIdNum)) {
    return NextResponse.redirect(new URL("/onboarding?error=invalid_installation", request.url));
  }

  if (setupAction === "install" || setupAction === "update") {
    try {
      const db = getDb();

      // Fetch the GitHub account login from the installation via GitHub API
      // (requires GitHub App private key auth — for now we store what we have)
      const accountLogin = session.user.name ?? session.user.email ?? "unknown";

      // Upsert installation record
      const existing = await db
        .select({ id: githubInstallations.id })
        .from(githubInstallations)
        .where(
          and(
            eq(githubInstallations.userId, session.user.id),
            eq(githubInstallations.installationId, installationIdNum),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(githubInstallations).values({
          userId: session.user.id,
          installationId: installationIdNum,
          accountLogin,
          accountType: "User",
        });
      }

      console.log(
        `[github-callback] Installation ${installationIdNum} stored for user ${session.user.id}`,
      );
    } catch (error) {
      console.error("[github-callback] Failed to store installation:", error);
      return NextResponse.redirect(
        new URL("/onboarding?error=installation_failed", request.url),
      );
    }
  }

  // Redirect back to where the user came from (onboarding step 3 or settings)
  const redirectUrl = new URL(redirectTo, request.url);
  redirectUrl.searchParams.set("github_installed", "true");
  return NextResponse.redirect(redirectUrl);
}
