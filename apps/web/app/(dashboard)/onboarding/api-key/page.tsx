import { getRequiredUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { skipOnboardingAction } from "@/app/actions/onboarding";
import { KeyRound } from "lucide-react";

export default async function OnboardingApiKeyPage() {
  const user = await getRequiredUser();

  // Already completed onboarding — redirect to dashboard
  if (user.hasCompletedOnboarding) {
    redirect("/dashboard");
  }

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
            CodeAudit is BYOK — bring your own key. We never store it
            unencrypted and it&apos;s only used to run your audits.
          </p>
        </div>

        {/* Placeholder — wired in Plan 01-03 */}
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            API key management UI is coming in the next step of setup.
          </p>
          <p className="text-xs text-muted-foreground/60">
            You can skip this now and add keys from Settings later.
          </p>
        </div>

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

          <Link
            href="/onboarding/repo"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
          >
            Continue
            <span aria-hidden="true">&#8594;</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
