import { getRequiredUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { completeOnboardingAction } from "@/app/actions/onboarding";
import { Rocket } from "lucide-react";

export default async function OnboardingReadyPage() {
  const user = await getRequiredUser();

  // Already completed onboarding — redirect to dashboard
  if (user.hasCompletedOnboarding) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-8">
        <OnboardingProgress currentStep={4} />

        <div className="space-y-4 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card mx-auto">
            <Rocket className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            You&apos;re all set
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Head to the dashboard to start your first audit. You can always add
            API keys and connect more repos from Settings.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-3">
          <h2 className="text-sm font-medium text-foreground">What&apos;s next:</h2>
          <ul className="space-y-2">
            {[
              "Select a repo from your dashboard",
              "Choose an audit type (full, security, code quality)",
              "Pick a depth — quick scan or deep audit",
              "Watch the 13-phase audit run phase-by-phase",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 flex-shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <form action={completeOnboardingAction} className="flex justify-center">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-sm font-medium text-black transition-colors hover:bg-white/90"
          >
            Go to dashboard
            <span aria-hidden="true">&#8594;</span>
          </button>
        </form>
      </div>
    </main>
  );
}
