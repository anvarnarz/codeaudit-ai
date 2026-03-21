import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@codeaudit/db";
import { accounts, sessions, users, verificationTokens, githubInstallations } from "@codeaudit/db";
import { eq } from "drizzle-orm";

const db = getDb();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "database",
  },
  providers: [
    GitHub({
      clientId: process.env["AUTH_GITHUB_ID"]!,
      clientSecret: process.env["AUTH_GITHUB_SECRET"]!,
      authorization: {
        params: {
          // read:user and user:email for OAuth sign-in.
          // Repo access is handled by the GitHub App installation separately.
          scope: "read:user user:email",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Tokens are stored by the DrizzleAdapter automatically via the accounts table.
      if (!user.email) return false;
      if (account?.provider !== "github") return false;
      return true;
    },
    async session({ session, user }) {
      // Include userId in the session for server-side use
      if (session.user) {
        session.user.id = user.id;
      }

      // Check if user has a GitHub App installation
      if (user.id) {
        try {
          const installation = await db
            .select({ installationId: githubInstallations.installationId })
            .from(githubInstallations)
            .where(eq(githubInstallations.userId, user.id))
            .limit(1);

          (session as Record<string, unknown>)["githubInstalled"] =
            installation.length > 0;
        } catch {
          // DB not yet available (local dev without DB) — gracefully degrade
          (session as Record<string, unknown>)["githubInstalled"] = false;
        }
      }

      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  events: {
    async signIn({ user, isNewUser }) {
      // New users are redirected to onboarding — handled in middleware / redirect
      // This event fires after a successful sign-in; we use it to log for observability.
      if (isNewUser) {
        console.log(`[auth] New user registered: ${user.email}`);
      }
    },
  },
});
