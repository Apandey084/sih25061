// pages/api/auth/[...nextauth].js
/**
 * Robust NextAuth pages API route for Pages Router.
 * - Handles various module shapes (CJS/ESM) for next-auth and providers.
 * - Adds Credentials provider which checks User and CheckerUser collections.
 *
 * Required env:
 *   NEXTAUTH_SECRET
 *   (optional) GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   (optional) GITHUB_ID, GITHUB_SECRET
 */
// lib/authOptions.js
// Minimal authOptions exported for use with getServerSession in server components.
// Keep in sync with your pages/api/auth/[...nextauth].js callbacks if you change roles/session fields.

export const authOptions = {
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || "user";
        if (user.id) token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = session.user || {};
      session.user.role = token.role || "user";
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  // keep this value identical to NEXTAUTH_SECRET in .env.local
  secret: process.env.NEXTAUTH_SECRET,
};
