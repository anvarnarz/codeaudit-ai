import { getRequiredUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { skipOnboardingAction } from "@/app/actions/onboarding";

export default async function OnboardingWelcomePage() {
  const user = await getRequiredUser();

  // Already completed onboarding — redirect to dashboard
  if (user.hasCompletedOnboarding) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-8">
        <OnboardingProgress currentStep={1} />

        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Welcome to CodeAudit
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Hi{user.name ? `, ${user.name.split(" ")[0]}` : ""}! Let&apos;s get
            you set up in a few quick steps.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-medium text-foreground">
            Here&apos;s what we&apos;ll set up:
          </h2>
          <ul className="space-y-3">
            {[
              {
                step: "1",
                title: "Add an API key",
                description:
                  "Your Anthropic, OpenAI, or Gemini key — you control costs.",
              },
              {
                step: "2",
                title: "Connect a repository",
                description:
                  "Pick a GitHub repo to audit. Public or private, both work.",
              },
              {
                step: "3",
                title: "Run your first audit",
                description:
                  "Choose audit type and depth. We handle the rest.",
              },
            ].map((item) => (
              <li key={item.step} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background">
                  <span className="text-xs text-muted-foreground">
                    {item.step}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-4">
          <form action={skipOnboardingAction}>
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip setup
            </button>
          </form>

          <Link
            href="/onboarding/api-key"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
          >
            Get started
            <span aria-hidden="true">&#8594;</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
