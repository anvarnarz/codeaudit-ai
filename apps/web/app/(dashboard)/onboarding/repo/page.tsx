import { getRequiredUser } from "@/lib/auth";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { skipOnboardingAction } from "@/app/actions/onboarding";
import { GitBranch, Check, ExternalLink } from "lucide-react";
import { getGitHubAppInstallUrl } from "@/lib/github-app";
import { getDb, githubInstallations } from "@codeaudit/db";
import { eq } from "drizzle-orm";

export default async function OnboardingRepoPage({
  searchParams,
}: {
  searchParams: Promise<{ github_installed?: string }>;
}) {
  const user = await getRequiredUser();
  const session = await auth();
  const params = await searchParams;

  // Already completed onboarding — redirect to dashboard
  if (user.hasCompletedOnboarding) {
    redirect("/dashboard");
  }

  // Check if user has a GitHub App installation
  let isInstalled = false;
  try {
    const db = getDb();
    const installations = await db
      .select({ id: githubInstallations.id })
      .from(githubInstallations)
      .where(eq(githubInstallations.userId, user.id))
      .limit(1);
    isInstalled = installations.length > 0;
  } catch {
    // DB not available in dev — default to false
  }

  // Also check if GitHub returned from installation redirect
  const justInstalled = params.github_installed === "true";
  const showInstalled = isInstalled || justInstalled;

  // The callback URL state param brings users back here after installation
  const installUrl = getGitHubAppInstallUrl("/onboarding/repo");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-8">
        <OnboardingProgress currentStep={3} />

        <div className="space-y-4 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card mx-auto">
            <GitBranch className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Connect a repository
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Install the CodeAudit GitHub App to grant per-repo access.
            You&apos;ll choose which specific repos to allow.
          </p>
        </div>

        {showInstalled ? (
          /* GitHub App is installed — show confirmation */
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <Check className="h-4 w-4" />
              GitHub App installed
            </div>
            <p className="text-sm text-muted-foreground">
              CodeAudit now has access to the repositories you selected. You can
              manage repository access at any time from{" "}
              <Link
                href="/settings/github"
                className="text-foreground underline underline-offset-2"
              >
                Settings &rarr; GitHub
              </Link>
              .
            </p>
          </div>
        ) : (
          /* GitHub App not yet installed — show install button */
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border border-border bg-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Install the GitHub App</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Opens GitHub where you&apos;ll select which repos to allow.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border border-border bg-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Select repositories</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose specific repos — not all repos. You control access.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border border-border bg-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Return here automatically</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    GitHub will redirect you back when done.
                  </p>
                </div>
              </div>
            </div>

            <a
              href={installUrl}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm rounded bg-white text-black hover:bg-white/90 transition-colors font-medium"
            >
              Install GitHub App
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/onboarding/api-key"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &#8592; Back
            </Link>
            <form action={skipOnboardingAction}>
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip setup
              </button>
            </form>
          </div>

          <Link
            href="/onboarding/ready"
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              showInstalled
                ? "bg-white text-black hover:bg-white/90"
                : "border border-border text-muted-foreground hover:bg-muted/40"
            }`}
          >
            {showInstalled ? "Continue" : "Skip for now"}
            <span aria-hidden="true">&#8594;</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
