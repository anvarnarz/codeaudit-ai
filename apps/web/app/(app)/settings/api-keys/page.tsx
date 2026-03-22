import { listApiKeys } from "@/actions/api-keys";
import { ApiKeysClient } from "./api-keys-client";

export default async function ApiKeysPage() {
  const result = await listApiKeys();
  const keys = result.success ? result.data : [];

  return (
    <div className="p-8 max-w-[640px]">
      <div className="fade-in flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Store your LLM API keys securely. Keys are encrypted at rest and
            never returned to your browser after submission.
          </p>
        </div>
      </div>

      <ApiKeysClient initialKeys={keys} />
    </div>
  );
}
