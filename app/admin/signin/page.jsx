// app/admin/signin/page.jsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function AdminSignInPage() {
  const search = useSearchParams();
  const from = search?.get("from") || "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: from,
    });

    setLoading(false);

    if (res?.error) {
      setMsg(res.error || "Invalid credentials");
      return;
    }

    // res.url contains callbackUrl when redirect:false
    const dest = res?.url || from || "/admin/dashboard";
    window.location.href = dest;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Admin Sign In</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            className="p-2 border rounded"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="p-2 border rounded"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={loading}>
            {loading ? "Signing in..." : "Sign in as Admin"}
          </button>
          {msg && <p className="text-sm text-red-600 mt-2">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
