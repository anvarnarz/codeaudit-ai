import { redirect } from "next/navigation";
import { getDb, appSettings } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";
import { SetupWizard } from "./setup-wizard";

/**
 * First-time setup wizard.
 * Checks if setup is already complete — if so, redirect to dashboard.
 * Otherwise, show the setup wizard to add the first API key.
 */
export default async function SetupPage() {
  const db = getDb();

  const existing = db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "setup_complete"))
    .get();

  if (existing?.value === "true") {
    redirect("/dashboard");
  }

  return <SetupWizard />;
}
