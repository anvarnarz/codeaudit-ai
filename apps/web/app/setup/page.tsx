import { redirect } from "next/navigation";
import { getDb, appSettings } from "@codeaudit/db";
import { eq } from "drizzle-orm";

/**
 * First-time setup wizard.
 * For now: auto-complete setup so the app is immediately accessible.
 * Future plan will implement a proper setup flow.
 */
export default async function SetupPage() {
  const db = getDb();

  // Auto-mark setup as complete so the app shell loads
  // (first-time setup wizard is a future plan — Phase 1 Plan 2)
  const existing = db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "setup_complete"))
    .get();

  if (!existing) {
    await db
      .insert(appSettings)
      .values({ key: "setup_complete", value: "true" })
      .run();
  }

  redirect("/dashboard");
}
