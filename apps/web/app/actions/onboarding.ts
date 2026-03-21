"use server";

import { redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/auth";
import { getDb, users } from "@codeaudit/db";
import { eq } from "drizzle-orm";

/**
 * Mark the onboarding flow as complete for the current user.
 * Sets has_completed_onboarding = true and redirects to dashboard.
 */
export async function completeOnboardingAction() {
  const session = await getRequiredSession();
  const db = getDb();

  await db
    .update(users)
    .set({
      hasCompletedOnboarding: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  redirect("/dashboard");
}

/**
 * Skip the onboarding flow for the current user.
 * Also sets has_completed_onboarding = true so it doesn't appear again.
 */
export async function skipOnboardingAction() {
  return completeOnboardingAction();
}
