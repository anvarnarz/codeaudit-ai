import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@codeaudit/db";
import { accounts, sessions, users, verificationTokens } from "@codeaudit/db";
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
          // Request repo access for future GitHub App integration
          scope: "read:user user:email",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Store tokens are handled by the DrizzleAdapter automatically
      // via the accounts table. We just validate the sign-in.
      if (!user.email) return false;
      if (account?.provider !== "github") return false;
      return true;
    },
    async session({ session, user }) {
      // Include userId in the session for server-side use
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
});
