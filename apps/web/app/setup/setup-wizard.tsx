"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle2, Key, ShieldCheck, Sparkles, Activity, GitCompareArrows, ArrowRight } from "lucide-react";
import { createApiKey } from "@/actions/api-keys";
import { completeSetup } from "./actions";
import type { Provider } from "@/lib/api-key-validator";

const PROVIDERS: { id: Provider; label: string; hint: string }[] = [
  { id: "anthropic", label: "Anthropic", hint: "Starts with sk-ant-" },
  { id: "openai", label: "OpenAI", hint: "Starts with sk-" },
  { id: "gemini", label: "Google Gemini", hint: "AIza... format" },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    text: "13-phase audit covering security, code quality, dependencies, and more",
  },
  {
    icon: Sparkles,
    text: "Supports Anthropic, OpenAI, and Google Gemini",
  },
  {
    icon: Activity,
    text: "Live progress tracking with real-time cost monitoring",
  },
  {
    icon: GitCompareArrows,
    text: "Compare audits over time to track improvements",
  },
];

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
      const result = await createApiKey(provider, apiKey, label || `${PROVIDERS.find(p => p.id === provider)?.label} Key`);
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className={`h-1.5 w-8 rounded-full transition-colors ${
              step === 1 ? "bg-primary" : "bg-primary/30"
            }`}
          />
          <div
            className={`h-1.5 w-8 rounded-full transition-colors ${
              step === 2 ? "bg-primary" : "bg-primary/30"
            }`}
          />
        </div>

        {step === 1 && (
          <>
            {/* Welcome Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-4">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Welcome to CodeAudit AI
              </h1>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Run comprehensive code audits on your local codebase using AI.
                Your code never leaves your machine — only LLM API calls are
                made with your own key.
              </p>
            </div>

            {/* Feature list */}
            <div className="border border-border rounded-xl bg-card shadow-sm p-6 space-y-4">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            {/* Get Started button */}
            <button
              onClick={() => setStep(2)}
              className="mt-6 w-full py-2.5 px-4 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
                <Key className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Add Your API Key
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your first LLM API key to get started. Your key is encrypted and stored locally.
              </p>
            </div>

            {/* Card */}
            <div className="border border-border rounded-xl bg-card shadow-sm p-6">
              {success ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                  <p className="text-sm font-medium text-foreground">API key added — redirecting…</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Provider */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Provider</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PROVIDERS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setProvider(p.id)}
                          className={`px-3 py-2 text-xs rounded-md border transition-colors ${
                            provider === p.id
                              ? "border-primary bg-white text-black font-medium ring-2 ring-primary dark:bg-white dark:text-black"
                              : "border-border bg-card text-muted-foreground hover:border-muted-foreground/50 hover:bg-accent"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* API Key */}
                  <div className="space-y-2">
                    <label htmlFor="apiKey" className="text-sm font-medium text-foreground">
                      API Key
                    </label>
                    <input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={PROVIDERS.find((p) => p.id === provider)?.hint}
                      required
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Label (optional) */}
                  <div className="space-y-2">
                    <label htmlFor="keyLabel" className="text-sm font-medium text-foreground">
                      Label{" "}
                      <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <input
                      id="keyLabel"
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="Personal key"
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                    className="w-full py-2.5 px-4 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isPending ? "Validating…" : "Add Key & Continue"}
                  </button>

                  <p className="text-xs text-center text-muted-foreground">
                    You can add more keys in Settings → API Keys at any time.
                  </p>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
