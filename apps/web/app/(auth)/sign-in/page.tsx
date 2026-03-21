import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  const params = await searchParams;

  // Already signed in — redirect to dashboard
  if (session?.user) {
    redirect(params.callbackUrl ?? "/dashboard");
  }

  const errorMessages: Record<string, string> = {
    OAuthAccountNotLinked:
      "This email is already associated with another account.",
    OAuthCallbackError: "GitHub authorization was denied or failed.",
    AccessDenied: "Access was denied. Please try again.",
    Configuration: "There is a configuration error. Please contact support.",
    Default: "An error occurred during sign in. Please try again.",
  };

  const errorMessage = params.error
    ? (errorMessages[params.error] ?? errorMessages["Default"]!)
    : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-8">
        {/* Logo / Product name */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center border border-white/20">
              <span className="text-sm font-bold text-white">CA</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase">
              CodeAudit
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in to CodeAudit
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Thorough codebase audits — without the CLI setup.
            <br />
            Connect GitHub, bring your own API key.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        {/* Sign in form */}
        <form
          action={async () => {
            "use server";
            await signIn("github", {
              redirectTo: params.callbackUrl ?? "/dashboard",
            });
          }}
        >
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-3 rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <GitHubIcon />
            Sign in with GitHub
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to use CodeAudit for legitimate codebase
          auditing purposes. Your GitHub data is used only for repo access.
        </p>
      </div>
    </main>
  );
}

function GitHubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
