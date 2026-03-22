"use server";

import { redirect } from "next/navigation";
import { getDb, appSettings } from "@codeaudit-ai/db";
import { eq } from "drizzle-orm";

/**
 * Mark setup as complete and redirect to dashboard.
 * Called after the first API key is successfully added.
 */
export async function completeSetup(): Promise<void> {
  const db = getDb();

  const existing = db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "setup_complete"))
    .get();

  if (!existing) {
    db.insert(appSettings).values({ key: "setup_complete", value: "true" }).run();
  } else {
    db.update(appSettings).set({ value: "true" }).where(eq(appSettings.key, "setup_complete")).run();
  }

  redirect("/dashboard");
}
