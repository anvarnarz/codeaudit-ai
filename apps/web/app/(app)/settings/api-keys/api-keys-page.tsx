"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SelectCard } from "@/components/ui/select-card";
import { addApiKey, deleteApiKey, updateApiKey } from "@/actions/api-keys";
import type { Provider } from "@/actions/api-keys";
import type { SerializedApiKey } from "./page";

// ─── Constants ─────────────────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  gemini: "Google Gemini",
};

const PROVIDERS: Provider[] = ["anthropic", "openai", "gemini"];

const PROVIDER_PLACEHOLDERS: Record<Provider, string> = {
  anthropic: "sk-ant-api03-...",
  openai: "sk-proj-...",
  gemini: "AIza...",
};

// ─── ApiKeysPage (client component) ───────────────────────────────────────────

interface ApiKeysPageProps {
  keys: SerializedApiKey[];
}

export function ApiKeysPage({ keys }: ApiKeysPageProps) {
  const router = useRouter();

  // Add form state
  const [showAdd, setShowAdd] = useState(false);
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!apiKey || submitting) return;
    setSubmitting(true);
    setAddError(null);
    try {
      const result = await addApiKey(provider, apiKey, label);
      if (result.success) {
        setApiKey("");
        setLabel("");
        setProvider("anthropic");
        setShowAdd(false);
        router.refresh();
      } else {
        setAddError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteApiKey(id);
      if (result.success) {
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSave = async (id: string) => {
    setEditSubmitting(true);
    try {
      const result = await updateApiKey(id, editLabel);
      if (result.success) {
        setEditingId(null);
        router.refresh();
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="p-9 px-10 max-w-[640px]">
      {/* Header */}
      <div className="fade-in flex items-center justify-between mb-7">
        <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAdd((prev) => !prev)}
        >
          Add New Key
        </Button>
      </div>

      {/* Inline add form */}
      {showAdd && (
        <Card className="fade-in p-6 mb-5">
          <div className="flex flex-col gap-3.5">
            {/* Provider selector */}
            <div className="flex gap-2">
              {PROVIDERS.map((p) => (
                <SelectCard
                  key={p}
                  selected={provider === p}
                  onClick={() => setProvider(p)}
                  className="flex-1 py-2 px-3.5 text-center"
                >
                  <span
                    className={`text-[13px] ${
                      provider === p
                        ? "font-semibold text-accent"
                        : "text-text-secondary"
                    }`}
                  >
                    {PROVIDER_LABELS[p]}
                  </span>
                </SelectCard>
              ))}
            </div>

            {/* API Key input */}
            <Input
              type="password"
              mono
              placeholder={PROVIDER_PLACEHOLDERS[provider]}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />

            {/* Label input */}
            <Input
              placeholder="Label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />

            {/* Error */}
            {addError && (
              <p className="text-[13px] text-destructive">{addError}</p>
            )}

            {/* Submit */}
            <Button
              variant="primary"
              onClick={handleAdd}
              disabled={!apiKey || submitting}
            >
              {submitting ? "Adding..." : "Add Key"}
            </Button>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {keys.length === 0 && !showAdd && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-[14px] mb-4">No API keys configured</p>
          <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
            Add New Key
          </Button>
        </div>
      )}

      {/* Key list */}
      {keys.length > 0 && (
        <div className="bg-surface border border-border rounded-[--radius-card] overflow-hidden">
          {keys.map((key, i) => (
            <div
              key={key.id}
              className={`flex items-center justify-between py-4 px-5 fade-in stagger-${i + 1} ${
                i < keys.length - 1 ? "border-b border-border-subtle" : ""
              }`}
            >
              {/* Left: provider icon + info */}
              <div className="flex items-center gap-3.5">
                {/* Provider initial icon */}
                <div className="w-10 h-10 rounded-[10px] bg-elevated flex items-center justify-center text-[12px] font-bold text-accent">
                  {(PROVIDER_LABELS[key.provider] ?? key.provider)[0]?.toUpperCase()}
                </div>

                {/* Key info */}
                <div>
                  <div className="text-[13px] font-semibold">
                    {PROVIDER_LABELS[key.provider] ?? key.provider}
                  </div>

                  {editingId === key.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        className="h-7 py-1 text-[12px]"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        autoFocus
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleEditSave(key.id)}
                        disabled={editSubmitting}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="text-[12px] text-text-muted">
                      {key.label} ·{" "}
                      <span className="font-mono">{key.maskedKey}</span> · Added{" "}
                      {formatDate(key.createdAt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: action buttons */}
              {editingId !== key.id && (
                <div className="flex gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(key.id);
                      setEditLabel(key.label);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDelete(key.id)}
                    disabled={deletingId === key.id}
                  >
                    {deletingId === key.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
