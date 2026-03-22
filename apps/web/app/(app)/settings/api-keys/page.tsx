import { listApiKeys } from "@/actions/api-keys";
import { ApiKeysPage } from "./api-keys-page";

// ─── Serialized type for client ────────────────────────────────────────────────

export type SerializedApiKey = {
  id: string;
  provider: string;
  label: string;
  maskedKey: string;
  createdAt: string;
};

// ─── API Keys Page (server component) ─────────────────────────────────────────

export default async function ApiKeysSettingsPage() {
  const result = await listApiKeys();

  if (!result.success) {
    return (
      <div className="p-9 px-10 max-w-[640px]">
        <h1 className="text-2xl font-bold tracking-tight mb-4">API Keys</h1>
        <div className="p-4 rounded-[--radius-card] bg-destructive-subtle border border-destructive/20 text-destructive text-[13px]">
          Failed to load API keys: {result.error}
        </div>
      </div>
    );
  }

  // Serialize — convert Date fields to ISO strings for client
  const serializedKeys: SerializedApiKey[] = result.data.map((key) => ({
    id: key.id,
    provider: key.provider,
    label: key.label,
    maskedKey: key.maskedKey,
    createdAt: key.createdAt.toISOString(),
  }));

  return <ApiKeysPage keys={serializedKeys} />;
}
