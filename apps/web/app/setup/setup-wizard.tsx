"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Loader2,
  CheckCircle2,
  Key,
  ShieldCheck,
  Sparkles,
  Activity,
  GitCompareArrows,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";
import { createApiKey } from "@/actions/api-keys";
import { completeSetup } from "./actions";
import { SelectCard } from "@/components/ui/select-card";
import { Input } from "@/components/ui/input";
import type { Provider } from "@/lib/api-key-validator";

const PROVIDERS: { id: Provider; label: string; hint: string }[] = [
  { id: "anthropic", label: "Anthropic", hint: "Starts with sk-ant-" },
  { id: "openai", label: "OpenAI", hint: "Starts with sk-" },
  { id: "gemini", label: "Google Gemini", hint: "AIza... format" },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "13-Phase Audit",
    description: "Security, code quality, dependencies, and more",
  },
  {
    icon: Sparkles,
    title: "Multi-Provider",
    description: "Anthropic, OpenAI, and Google Gemini",
  },
  {
    icon: Activity,
    title: "Live Tracking",
    description: "Real-time progress with cost monitoring",
  },
  {
    icon: GitCompareArrows,
    title: "Compare Audits",
    description: "Track improvements over time",
  },
];

function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function setTheme(dark: boolean) {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  return (
    <div className="flex rounded-[10px] bg-[hsl(var(--elevated))] p-1">
      <button
        onClick={() => setTheme(false)}
        className={`flex h-7 w-9 items-center justify-center rounded-[8px] transition-all ${
          !isDark ? "bg-[hsl(var(--surface))]" : ""
        }`}
        title="Light mode"
      >
        <Sun
          className={`h-3.5 w-3.5 ${
            !isDark
              ? "text-[hsl(var(--foreground))]"
              : "text-[hsl(var(--text-secondary))]"
          }`}
          aria-hidden="true"
        />
      </button>
      <button
        onClick={() => setTheme(true)}
        className={`flex h-7 w-9 items-center justify-center rounded-[8px] transition-all ${
          isDark ? "bg-[hsl(var(--surface))]" : ""
        }`}
        title="Dark mode"
      >
        <Moon
          className={`h-3.5 w-3.5 ${
            isDark
              ? "text-[hsl(var(--foreground))]"
              : "text-[hsl(var(--text-secondary))]"
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

export function SetupWizard() {
  const [step, setStep] = useState<1 | 2>(1);
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createApiKey(
        provider,
        apiKey,
        label || `${PROVIDERS.find((p) => p.id === provider)?.label} Key`
      );
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      // Small delay to show success state before redirect
      await new Promise((r) => setTimeout(r, 800));
      await completeSetup();
    });
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4">
      {/* Theme toggle — top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className={`h-2 w-2 rounded-full transition-colors ${
              step === 1
                ? "bg-[hsl(var(--accent))]"
                : "bg-[hsl(var(--text-muted))]"
            }`}
          />
          <div
            className={`h-2 w-2 rounded-full transition-colors ${
              step === 2
                ? "bg-[hsl(var(--accent))]"
                : "bg-[hsl(var(--text-muted))]"
            }`}
          />
        </div>

        {step === 1 && (
          <>
            {/* Welcome Header */}
            <div className="text-center mb-8 fade-in">
              <div className="inline-flex items-center justify-center h-[72px] w-[72px] rounded-[20px] bg-gradient-to-br from-yellow-400 to-amber-500 shadow-[0_0_40px_rgba(250,204,21,0.15)] mb-5">
                <ShieldCheck className="h-9 w-9 text-[#0a0a0b]" />
              </div>
              <h1 className="text-[30px] font-bold tracking-[-0.03em] text-foreground">
                Welcome to CodeAudit AI
              </h1>
              <p className="mt-3 text-[hsl(var(--text-secondary))] max-w-md mx-auto leading-relaxed">
                Run comprehensive code audits on your local codebase using AI.
                Your code never leaves your machine — only LLM API calls are
                made with your own key.
              </p>
            </div>

            {/* Feature cards — 2x2 grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {FEATURES.map(({ icon: Icon, title, description }, i) => (
                <div
                  key={title}
                  className={`fade-in stagger-${i + 1} rounded-[14px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[hsl(var(--accent-subtle))] mb-3">
                    <Icon className="h-[18px] w-[18px] text-[hsl(var(--accent))]" />
                  </div>
                  <p className="font-bold text-foreground leading-tight">
                    {title}
                  </p>
                  <p className="text-sm text-[hsl(var(--text-muted))] mt-1 leading-snug">
                    {description}
                  </p>
                </div>
              ))}
            </div>

            {/* Get Started button */}
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 px-4 text-sm font-medium rounded-[10px] bg-[hsl(var(--accent))] text-[#0a0a0b] hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {/* Header */}
            <div className="text-center mb-8 fade-in">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-[16px] bg-[hsl(var(--accent-subtle))] mb-4">
                <Key className="h-6 w-6 text-[hsl(var(--accent))]" />
              </div>
              <h1 className="text-[30px] font-bold tracking-[-0.03em] text-foreground">
                Add Your API Key
              </h1>
              <p className="mt-2 text-[hsl(var(--text-secondary))] max-w-md mx-auto">
                Add your first LLM API key to get started. Your key is encrypted
                and stored locally.
              </p>
            </div>

            {/* Form area */}
            {success ? (
              <div className="flex flex-col items-center gap-3 py-8 fade-in">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
                <p className="text-sm font-medium text-foreground">
                  API key added — redirecting…
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 fade-in">
                {/* Provider selector — 3 SelectCards in a row */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Provider
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROVIDERS.map((p) => (
                      <SelectCard
                        key={p.id}
                        selected={provider === p.id}
                        onClick={() => setProvider(p.id)}
                        className="!p-3 text-center"
                      >
                        <span
                          className={`text-xs font-medium ${
                            provider === p.id
                              ? "text-[hsl(var(--accent))]"
                              : "text-[hsl(var(--text-secondary))]"
                          }`}
                        >
                          {p.label}
                        </span>
                      </SelectCard>
                    ))}
                  </div>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <label
                    htmlFor="apiKey"
                    className="text-sm font-medium text-foreground"
                  >
                    API Key
                  </label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      PROVIDERS.find((p) => p.id === provider)?.hint
                    }
                    required
                    mono
                  />
                </div>

                {/* Label (optional) */}
                <div className="space-y-2">
                  <label
                    htmlFor="keyLabel"
                    className="text-sm font-medium text-foreground"
                  >
                    Label{" "}
                    <span className="text-xs text-[hsl(var(--text-muted))] font-normal">
                      (optional)
                    </span>
                  </label>
                  <Input
                    id="keyLabel"
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Personal key"
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isPending || !apiKey.trim()}
                  className="w-full py-3 px-4 text-sm font-medium rounded-[10px] bg-[hsl(var(--accent))] text-[#0a0a0b] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isPending ? "Validating…" : "Add Key & Continue"}
                </button>

                <p className="text-xs text-center text-[hsl(var(--text-muted))]">
                  You can add more keys in Settings → API Keys at any time.
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
