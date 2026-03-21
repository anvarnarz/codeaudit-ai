"use client";

import { useState, useTransition } from "react";
import { Check, X, Loader2, Key, Plus } from "lucide-react";
import { createApiKey, type ApiKeyRecord } from "@/actions/api-keys";
import type { Provider } from "@/lib/api-key-validator";

const PROVIDERS: { id: Provider; label: string; hint: string }[] = [
  { id: "anthropic", label: "Anthropic", hint: "sk-ant-..." },
  { id: "openai", label: "OpenAI", hint: "sk-..." },
  { id: "gemini", label: "Google Gemini", hint: "AIza..." },
];

interface Props {
  initialHasKey: boolean;
  existingKeys: ApiKeyRecord[];
}

export function OnboardingApiKeyClient({ initialHasKey, existingKeys }: Props) {
  const [hasKey, setHasKey] = useState(initialHasKey);
  const [keys, setKeys] = useState<ApiKeyRecord[]>(existingKeys);
  const [showForm, setShowForm] = useState(!initialHasKey);

  // Key add form state
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [label, setLabel] = useState("Default");
  const [rawKey, setRawKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createApiKey(provider, label, rawKey);
      if (result.success) {
        setKeys((prev) => [...prev, result.data]);
        setHasKey(true);
        setShowForm(false);
        setRawKey("");
        setLabel("Default");
      } else {
        setError(result.error);
      }
    });
  }

  if (hasKey && !showForm) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm text-primary font-medium">
          <Check className="h-4 w-4" />
          API key added
        </div>

        <div className="space-y-2">
          {keys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between text-xs rounded bg-muted/40 px-3 py-2"
            >
              <span className="text-foreground font-medium">{k.label}</span>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="capitalize">{k.provider}</span>
                <code className="bg-muted px-1.5 py-0.5 rounded font-mono">
                  {k.maskedKey}
                </code>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add another key
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {hasKey && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-foreground">Add another key</span>
          <button
            onClick={() => setShowForm(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Provider picker */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Provider
          </label>
          <div className="flex gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={`flex-1 py-2 px-2 text-xs rounded border transition-colors ${
                  provider === p.id
                    ? "border-white/40 bg-white/5 text-foreground font-medium"
                    : "border-border text-muted-foreground hover:bg-muted/40"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Label */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Personal, Work"
            maxLength={64}
            required
            className="w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* API key */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            API Key{" "}
            <span className="text-muted-foreground/60">
              ({PROVIDERS.find((p) => p.id === provider)?.hint})
            </span>
          </label>
          <input
            type="password"
            value={rawKey}
            onChange={(e) => setRawKey(e.target.value)}
            placeholder={`Paste your ${PROVIDERS.find((p) => p.id === provider)?.label} key`}
            required
            autoComplete="off"
            className="w-full px-3 py-2 text-sm rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            We&apos;ll validate it with a lightweight test call, then encrypt and store it.
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive flex items-start gap-1.5">
            <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Validating & saving...
            </>
          ) : (
            <>
              <Key className="h-4 w-4" />
              Save API key
            </>
          )}
        </button>
      </form>
    </div>
  );
}
