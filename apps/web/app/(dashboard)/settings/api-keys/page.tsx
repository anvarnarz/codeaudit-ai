import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listApiKeys } from "@/actions/api-keys";
import { ApiKeysClient } from "./api-keys-client";

export default async function ApiKeysPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const result = await listApiKeys();
  const keys = result.success ? result.data : [];

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
      <p className="mt-2 text-muted-foreground">
        Store your LLM API keys securely. Keys are encrypted at rest and never
        returned to your browser after submission.
      </p>

      <div className="mt-8 space-y-6">
        <ApiKeysClient initialKeys={keys} />
      </div>
    </div>
  );
}
