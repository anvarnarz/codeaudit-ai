import { getRequiredUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { skipOnboardingAction } from "@/app/actions/onboarding";
import { listApiKeys } from "@/actions/api-keys";
import { KeyRound } from "lucide-react";
import { OnboardingApiKeyClient } from "./onboarding-api-key-client";

export default async function OnboardingApiKeyPage() {
  const user = await getRequiredUser();

  // Already completed onboarding — redirect to dashboard
  if (user.hasCompletedOnboarding) {
    redirect("/dashboard");
  }

  // Load existing keys to show if user already added one
  const keysResult = await listApiKeys();
  const existingKeys = keysResult.success ? keysResult.data : [];
  const hasKey = existingKeys.length > 0;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-8">
        <OnboardingProgress currentStep={2} />

        <div className="space-y-4 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card mx-auto">
            <KeyRound className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Add your API key
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            CodeAudit is BYOK — bring your own key. We validate it, encrypt it
            with AES-256-GCM, and it&apos;s never returned to your browser.
          </p>
        </div>

        {/* Wired API key form (replaces placeholder from 01-02) */}
        <OnboardingApiKeyClient initialHasKey={hasKey} existingKeys={existingKeys} />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/onboarding"
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

          {hasKey ? (
            <Link
              href="/onboarding/repo"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
            >
              Continue
              <span aria-hidden="true">&#8594;</span>
            </Link>
          ) : (
            <Link
              href="/onboarding/repo"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40"
            >
              Skip for now
              <span aria-hidden="true">&#8594;</span>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
