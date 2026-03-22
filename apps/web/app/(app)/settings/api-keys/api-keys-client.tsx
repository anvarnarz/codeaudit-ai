"use client";

import { useState, useTransition } from "react";
import { Trash2, Plus, Pencil, Loader2, Check, X } from "lucide-react";
import {
  createApiKey,
  deleteApiKey,
  updateApiKeyLabel,
  type ApiKeyRecord,
} from "@/actions/api-keys";
import type { Provider } from "@/lib/api-key-validator";

const PROVIDERS: { id: Provider; label: string; hint: string }[] = [
  {
    id: "anthropic",
    label: "Anthropic",
    hint: "Starts with sk-ant-",
  },
  {
    id: "openai",
    label: "OpenAI",
    hint: "Starts with sk-",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    hint: "AIza... format",
  },
];

// ============================================================
// Delete confirmation dialog
// ============================================================

function DeleteConfirmDialog({
  keyLabel,
  onConfirm,
  onCancel,
  isPending,
}: {
  keyLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-zinc-300 dark:border-zinc-700 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-base font-semibold text-foreground">Delete API Key</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">{keyLabel}</span>? This
          action cannot be undone.
        </p>
        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-3 py-1.5 text-sm rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Add key form
// ============================================================

function AddKeyForm({
  provider,
  onSuccess,
  onCancel,
}: {
  provider: Provider;
  onSuccess: (key: ApiKeyRecord) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("Default");
  const [rawKey, setRawKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const providerInfo = PROVIDERS.find((p) => p.id === provider)!;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createApiKey(provider, rawKey, label);
      if (result.success) {
        onSuccess(result.data);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 p-4 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-muted/30">
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
          className="w-full px-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          {providerInfo.label} API Key
          <span className="ml-1 text-muted-foreground/60">({providerInfo.hint})</span>
        </label>
        <input
          type="password"
          value={rawKey}
          onChange={(e) => setRawKey(e.target.value)}
          placeholder={`Paste your ${providerInfo.label} API key`}
          required
          autoComplete="off"
          className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-start gap-1.5">
          <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </p>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              Save Key
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ============================================================
// Edit label form
// ============================================================

function EditLabelForm({
  keyId,
  currentLabel,
  onSuccess,
  onCancel,
}: {
  keyId: string;
  currentLabel: string;
  onSuccess: (newLabel: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(currentLabel);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateApiKeyLabel(keyId, label);
      if (result.success) {
        onSuccess(label);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={64}
        required
        autoFocus
        className="px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-40"
      />
      <button
        type="submit"
        disabled={isPending}
        className="p-1 rounded hover:bg-accent transition-colors"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5 text-primary" />
        )}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 rounded hover:bg-accent transition-colors"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </form>
  );
}

// ============================================================
// Key row
// ============================================================

function KeyRow({
  apiKey,
  onDelete,
  onLabelUpdate,
}: {
  apiKey: ApiKeyRecord;
  onDelete: (id: string) => void;
  onLabelUpdate: (id: string, newLabel: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteApiKey(apiKey.id);
      onDelete(apiKey.id);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/40 group">
        <div className="flex items-center gap-3 min-w-0">
          {isEditing ? (
            <EditLabelForm
              keyId={apiKey.id}
              currentLabel={apiKey.label}
              onSuccess={(newLabel) => {
                onLabelUpdate(apiKey.id, newLabel);
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <span className="text-sm font-medium text-foreground truncate">
                {apiKey.label}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-all"
                title="Edit label"
              >
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <code className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
            {apiKey.maskedKey}
          </code>
          <span className="text-xs text-muted-foreground">
            {new Date(apiKey.createdAt).toLocaleDateString()}
          </span>
          <button
            onClick={() => setConfirmDelete(true)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
            title="Delete key"
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>

      {confirmDelete && (
        <DeleteConfirmDialog
          keyLabel={apiKey.label}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          isPending={isPending}
        />
      )}
    </>
  );
}

// ============================================================
// Provider section
// ============================================================

function ProviderSection({
  provider,
  keys,
  onKeyAdded,
  onKeyDeleted,
  onLabelUpdated,
}: {
  provider: (typeof PROVIDERS)[number];
  keys: ApiKeyRecord[];
  onKeyAdded: (key: ApiKeyRecord) => void;
  onKeyDeleted: (id: string) => void;
  onLabelUpdated: (id: string, newLabel: string) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-zinc-300 dark:border-zinc-700">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{provider.label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {keys.length === 0
              ? "No keys stored"
              : `${keys.length} key${keys.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add key
        </button>
      </div>

      {/* Keys list */}
      <div className="divide-y divide-border/50">
        {keys.length === 0 && !showAddForm && (
          <div className="px-4 py-4 text-sm text-muted-foreground text-center">
            No {provider.label} keys yet.
          </div>
        )}

        {keys.map((key) => (
          <KeyRow
            key={key.id}
            apiKey={key}
            onDelete={onKeyDeleted}
            onLabelUpdate={onLabelUpdated}
          />
        ))}

        {showAddForm && (
          <div className="px-4 pb-4">
            <AddKeyForm
              provider={provider.id}
              onSuccess={(key) => {
                onKeyAdded(key);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main client component
// ============================================================

export function ApiKeysClient({ initialKeys }: { initialKeys: ApiKeyRecord[] }) {
  const [keys, setKeys] = useState<ApiKeyRecord[]>(initialKeys);

  function handleKeyAdded(newKey: ApiKeyRecord) {
    setKeys((prev) => [...prev, newKey]);
  }

  function handleKeyDeleted(id: string) {
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  function handleLabelUpdated(id: string, newLabel: string) {
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, label: newLabel } : k)),
    );
  }

  return (
    <div className="space-y-4">
      {PROVIDERS.map((provider) => (
        <ProviderSection
          key={provider.id}
          provider={provider}
          keys={keys.filter((k) => k.provider === provider.id)}
          onKeyAdded={handleKeyAdded}
          onKeyDeleted={handleKeyDeleted}
          onLabelUpdated={handleLabelUpdated}
        />
      ))}
    </div>
  );
}
