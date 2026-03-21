import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDb } from "@codeaudit/db";
import { users } from "@codeaudit/db";
import { eq } from "drizzle-orm";

/**
 * Get the current session, throwing a redirect to /sign-in if not authenticated.
 *
 * Use in Server Components and Server Actions that require authentication:
 *
 * ```ts
 * const session = await getRequiredSession();
 * // session.user.id is guaranteed to be set
 * ```
 */
export async function getRequiredSession() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return session as typeof session & {
    user: { id: string; name?: string | null; email?: string | null; image?: string | null };
  };
}

/**
 * Get the current session without redirecting.
 * Returns null if not authenticated.
 */
export async function getOptionalSession() {
  return auth();
}

/**
 * Get the full user record from the database for the current session user.
 * Throws redirect to /sign-in if not authenticated.
 * Throws if the user record is not found in the database.
 */
export async function getRequiredUser() {
  const session = await getRequiredSession();
  const db = getDb();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    // Session exists but user record missing — this shouldn't happen in normal flow
    redirect("/sign-in");
  }

  return user;
}
