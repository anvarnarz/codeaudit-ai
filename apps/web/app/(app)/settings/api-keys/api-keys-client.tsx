"use client";

import { useState, useTransition } from "react";
import {
  Trash2,
  Plus,
  Pencil,
  Loader2,
  Check,
  X,
  AlertTriangle,
  Key,
} from "lucide-react";
import {
  createApiKey,
  deleteApiKey,
  updateApiKeyLabel,
  type ApiKeyRecord,
} from "@/actions/api-keys";
import type { Provider } from "@/lib/api-key-validator";

const PROVIDERS: { id: Provider; label: string; hint: string; initial: string }[] = [
  {
    id: "anthropic",
    label: "Anthropic",
    hint: "Starts with sk-ant-",
    initial: "A",
  },
  {
    id: "openai",
    label: "OpenAI",
    hint: "Starts with sk-",
    initial: "O",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    hint: "AIza... format",
    initial: "G",
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="fade-in bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-[14px] p-6 max-w-sm w-full mx-4 shadow-2xl">
        {/* Icon + title */}
        <div className="flex gap-3.5 mb-5">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 bg-red-500/10">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Delete API Key
            </h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">{keyLabel}</span>?
            </p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="rounded-lg px-3 py-2.5 mb-5 bg-orange-500/10">
          <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-2.5 justify-end">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium rounded-[10px] border border-zinc-200 dark:border-zinc-700 bg-transparent text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium rounded-[10px] bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
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
    <form
      onSubmit={handleSubmit}
      className="fade-in mt-3 space-y-3 p-5 border border-zinc-200 dark:border-zinc-700 rounded-[14px] bg-zinc-50/50 dark:bg-zinc-800/30"
    >
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          Label
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Personal, Work"
          maxLength={64}
          required
          className="w-full px-3.5 py-2.5 text-sm rounded-[10px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-yellow-400 dark:focus:border-yellow-400 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          {providerInfo.label} API Key
          <span className="ml-1 text-muted-foreground/60">
            ({providerInfo.hint})
          </span>
        </label>
        <input
          type="password"
          value={rawKey}
          onChange={(e) => setRawKey(e.target.value)}
          placeholder={`Paste your ${providerInfo.label} API key`}
          required
          autoComplete="off"
          className="w-full px-3.5 py-2.5 text-sm rounded-[10px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-yellow-400 dark:focus:border-yellow-400 font-mono transition-colors"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 flex items-start gap-1.5">
          <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </p>
      )}

      <div className="flex gap-2.5 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium rounded-[10px] border border-zinc-200 dark:border-zinc-700 bg-transparent text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-semibold rounded-[10px] bg-yellow-400 text-zinc-900 hover:bg-yellow-300 transition-colors disabled:opacity-50 flex items-center gap-1.5"
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
        className="px-3 py-1.5 text-sm rounded-[10px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-foreground focus:outline-none focus:border-yellow-400 w-40 transition-colors"
      />
      <button
        type="submit"
        disabled={isPending}
        className="p-1.5 rounded-lg hover:bg-yellow-400/10 transition-colors"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5 text-yellow-500" />
        )}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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
  providerInfo,
  onDelete,
  onLabelUpdate,
}: {
  apiKey: ApiKeyRecord;
  providerInfo: (typeof PROVIDERS)[number];
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
      <div className="flex items-center justify-between py-4 px-5 group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Provider initial icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-zinc-100 dark:bg-zinc-800 shrink-0">
            <span className="text-xs font-bold text-yellow-500 dark:text-yellow-400">
              {providerInfo.initial}
            </span>
          </div>

          <div className="min-w-0">
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
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {providerInfo.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {apiKey.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <code className="text-xs text-muted-foreground font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
                    {apiKey.maskedKey}
                  </code>
                  <span className="text-[11px] text-muted-foreground">
                    Added {new Date(apiKey.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Edit label"
            >
              Edit
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-1.5 text-xs font-medium text-red-500/70 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
              title="Delete key"
            >
              Delete
            </button>
          </div>
        )}
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
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[14px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-50/80 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <span className="text-xs font-bold text-yellow-500 dark:text-yellow-400">
              {provider.initial}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {provider.label}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {keys.length === 0
                ? "No keys stored"
                : `${keys.length} key${keys.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[10px] bg-yellow-400 text-zinc-900 hover:bg-yellow-300 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add key
        </button>
      </div>

      {/* Keys list */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {keys.length === 0 && !showAddForm && (
          <div className="px-5 py-8 text-sm text-muted-foreground text-center">
            <Key className="h-5 w-5 mx-auto mb-2 text-muted-foreground/40" />
            No {provider.label} keys yet.
          </div>
        )}

        {keys.map((key, i) => (
          <KeyRow
            key={key.id}
            apiKey={key}
            providerInfo={provider}
            onDelete={onKeyDeleted}
            onLabelUpdate={onLabelUpdated}
          />
        ))}

        {showAddForm && (
          <div className="px-5 py-4">
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

export function ApiKeysClient({
  initialKeys,
}: {
  initialKeys: ApiKeyRecord[];
}) {
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
    <div className="space-y-5">
      {PROVIDERS.map((provider, i) => (
        <div
          key={provider.id}
          className={`fade-in stagger-${Math.min(i + 1, 5)}`}
        >
          <ProviderSection
            provider={provider}
            keys={keys.filter((k) => k.provider === provider.id)}
            onKeyAdded={handleKeyAdded}
            onKeyDeleted={handleKeyDeleted}
            onLabelUpdated={handleLabelUpdated}
          />
        </div>
      ))}
    </div>
  );
}
