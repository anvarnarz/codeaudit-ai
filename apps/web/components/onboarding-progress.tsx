interface OnboardingProgressProps {
  currentStep: 1 | 2 | 3 | 4;
  totalSteps?: number;
}

const steps = [
  { number: 1, label: "Welcome" },
  { number: 2, label: "API Key" },
  { number: 3, label: "Repository" },
  { number: 4, label: "Ready" },
];

export function OnboardingProgress({
  currentStep,
  totalSteps = 4,
}: OnboardingProgressProps) {
  return (
    <nav aria-label="Onboarding progress" className="w-full">
      <ol className="flex items-center justify-center gap-2">
        {steps.slice(0, totalSteps).map((step) => {
          const isComplete = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <li key={step.number} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isComplete
                    ? "bg-white text-black"
                    : isCurrent
                      ? "border border-white/60 bg-white/10 text-white"
                      : "border border-white/20 bg-transparent text-muted-foreground"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? (
                  <CheckIcon />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <span
                className={`text-xs hidden sm:block ${
                  isCurrent
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
              {step.number < totalSteps && (
                <span className="h-px w-8 bg-border" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
