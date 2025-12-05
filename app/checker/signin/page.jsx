// // app/checker/signin/page.jsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CheckerSignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get("from") || "/checker/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      // `credentials` should match the id used in your NextAuth provider.
      // We use redirect: false to handle response client-side.
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      // res is { ok, error, status, url } when redirect:false
      if (!res) {
        setError("Authentication service unavailable");
        return;
      }
      if (res.error) {
        // show message from server if any
        setError(res.error || "Invalid credentials");
        return;
      }
      if (res.ok) {
        // success — go to `from` or checker dashboard
        router.push(from);
        return;
      }

      setError("Sign-in failed");
    } catch (err) {
      console.error("Signin error:", err);
      setError("Network or server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-4 text-center">Sign in as Checker</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-4 flex justify-between text-sm">
          <a href="/checker/request" className="text-blue-600 hover:underline">
            Request checker access
          </a>
          <a href="/login" className="text-gray-600 hover:underline">
            Back to site login
          </a>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Note: only approved checkers can sign in. If you were recently approved, try again after a few seconds.
        </p>
      </div>
    </div>
  );
}
