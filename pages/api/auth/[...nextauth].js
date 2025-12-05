// pages/api/auth/[...nextauth].js
// Dynamic runtime loader for NextAuth + providers — handles strange module shapes.

import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import CheckerUser from "@/lib/models/CheckerUser";
import { compare } from "bcryptjs";

/* find callable factory inside different module shapes */
function findCallable(mod) {
  if (!mod) return null;
  if (typeof mod === "function") return mod;
  if (mod.default && typeof mod.default === "function") return mod.default;
  if (mod.default && mod.default.default && typeof mod.default.default === "function")
    return mod.default.default;
  if (mod.default && mod.default.default && mod.default.default.default && typeof mod.default.default.default === "function")
    return mod.default.default.default;
  return null;
}

async function authorizeCredentials(credentials) {
  if (!credentials?.email || !credentials?.password) return null;
  try {
    if (typeof connectDB === "function") await connectDB();
  } catch (err) {
    console.error("DB connect error:", err);
    return null;
  }

  const email = String(credentials.email).toLowerCase().trim();

  // Check main User collection (admin)
  const user = await User.findOne({ email }).lean();
  if (user) {
    const hash = user.passwordHash || user.password || "";
    if (!hash) return null;
    const ok = await compare(credentials.password, hash);
    if (!ok) return null;
    if (!user.role) return null;
    return { id: user._id.toString(), name: user.name || "", email: user.email, role: user.role };
  }

  // Fallback to CheckerUser
  if (CheckerUser) {
    const checker = await CheckerUser.findOne({ email }).lean();
    if (!checker) return null;
    if (!checker.approved || checker.active === false) return null;
    const hash = checker.passwordHash || checker.password || "";
    if (!hash) return null;
    const ok = await compare(credentials.password, hash);
    if (!ok) return null;
    return { id: checker._id.toString(), name: checker.name || "", email: checker.email, role: "checker" };
  }

  return null;
}

export default async function handler(req, res) {
  try {
    // dynamic import of NextAuth
    const NextAuthMod = await import("next-auth");
    const NextAuthFactory = findCallable(NextAuthMod) || findCallable(NextAuthMod.default);

    if (!NextAuthFactory) {
      console.error("NextAuth callable not found. Module keys:", Object.keys(NextAuthMod || {}));
      return res.status(500).json({ error: "NextAuth callable not found — see server logs." });
    }

    // dynamic import of providers
    const GitHubMod = await import("next-auth/providers/github").catch((e) => {
      console.warn("Failed to import github provider:", e && e.message);
      return null;
    });
    const GoogleMod = await import("next-auth/providers/google").catch((e) => {
      console.warn("Failed to import google provider:", e && e.message);
      return null;
    });
    const CredentialsMod = await import("next-auth/providers/credentials").catch((e) => {
      console.warn("Failed to import credentials provider:", e && e.message);
      return null;
    });

    const GitHubProvider = findCallable(GitHubMod) || (GitHubMod && findCallable(GitHubMod.default));
    const GoogleProvider = findCallable(GoogleMod) || (GoogleMod && findCallable(GoogleMod.default));
    const CredentialsProviderFactory =
      findCallable(CredentialsMod) || (CredentialsMod && findCallable(CredentialsMod.default));

    // Build providers array
    const providers = [];

    if (GitHubProvider) {
      providers.push(
        GitHubProvider({
          clientId: process.env.GITHUB_ID || "",
          clientSecret: process.env.GITHUB_SECRET || "",
        })
      );
    } else {
      console.warn("GitHub provider not available - skipping");
    }

    if (GoogleProvider) {
      providers.push(
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID || "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        })
      );
    } else {
      console.warn("Google provider not available - skipping");
    }

    if (CredentialsProviderFactory) {
      providers.push(
        CredentialsProviderFactory({
          id: "credentials",
          name: "Credentials",
          credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
          },
          async authorize(credentials) {
            return authorizeCredentials(credentials);
          },
        })
      );
    } else {
      console.warn("Credentials provider factory not found - credentials login unavailable");
    }

    // build options
    const options = {
      session: { strategy: "jwt" },
      providers,
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
      }
      ,
      pages: { signIn: "/admin/signin" },
      secret: process.env.NEXTAUTH_SECRET,
    };

    // get handler and execute it
    const nextAuthHandler = NextAuthFactory(options);
    // nextAuthHandler is function (req,res)
    return nextAuthHandler(req, res);
  } catch (err) {
    console.error("NextAuth dynamic-handler error:", err);
    return res.status(500).json({ error: "NextAuth dynamic-handler error", detail: String(err && err.message) });
  }
}
