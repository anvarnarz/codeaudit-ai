import { listApiKeys } from "@/actions/api-keys";
import { NewAuditForm } from "./new-audit-form";

export default async function NewAuditPage() {
  const result = await listApiKeys();
  const keys = result.success ? result.data : [];

  return <NewAuditForm initialKeys={keys} />;
}
