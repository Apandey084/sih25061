"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CheckerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("from") || "/checker/dashboard";

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Request fields
  const [name, setName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [note, setNote] = useState("");
  const [reqLoading, setReqLoading] = useState(false);
  const [reqMsg, setReqMsg] = useState("");
  const [reqError, setReqError] = useState("");

  // -------------------------
  // CHECKER LOGIN HANDLER
  // -------------------------
  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email: loginEmail.trim().toLowerCase(),
      password: loginPassword,
    });

    if (!res || res.error) {
      setLoginError(res?.error || "Invalid credentials");
      setLoginLoading(false);
      return;
    }

    router.replace(redirectTo);
  }

  // -------------------------
  // CHECKER REQUEST HANDLER
  // -------------------------
  async function handleRequest(e) {
    e.preventDefault();
    setReqMsg("");
    setReqError("");
    setReqLoading(true);

    try {
      const res = await fetch("/api/checker/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: reqEmail.trim().toLowerCase(),
          note: note.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setReqMsg("Request submitted — wait for admin approval.");
        setName("");
        setReqEmail("");
        setNote("");
      } else {
        setReqError(data.error || "Request failed.");
      }
    } catch (err) {
      setReqError("Network error, try again later.");
    } finally {
      setReqLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CHECKER LOGIN CARD */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-xl font-semibold mb-4">Checker Login</h3>
          <p className="text-sm text-slate-500 mb-4">
            Login with your checker credentials (email & password).
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full mt-1 rounded-md border px-3 py-2 focus:ring-2 focus:ring-slate-300 outline-none"
                placeholder="checker@example.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full mt-1 rounded-md border px-3 py-2 focus:ring-2 focus:ring-slate-300 outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-slate-800 text-white rounded-md py-2 font-medium hover:bg-slate-700 disabled:opacity-60"
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>

            {loginError && (
              <p className="text-red-600 text-sm">{loginError}</p>
            )}
          </form>
        </div>

        {/* REQUEST ACCESS CARD */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-xl font-semibold mb-4">Request Checker Access</h3>
          <p className="text-sm text-slate-500 mb-4">
            Request access to become a checker. Admin will review and approve.
          </p>

          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 rounded-md border px-3 py-2"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={reqEmail}
                onChange={(e) => setReqEmail(e.target.value)}
                className="w-full mt-1 rounded-md border px-3 py-2"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full mt-1 rounded-md border px-3 py-2"
                placeholder="Any message for admin"
              />
            </div>

            <button
              type="submit"
              disabled={reqLoading}
              className="w-full bg-green-600 text-white rounded-md py-2 font-medium hover:bg-green-700 disabled:opacity-60"
            >
              {reqLoading ? "Submitting..." : "Submit Request"}
            </button>

            {reqMsg && <p className="text-green-700 text-sm">{reqMsg}</p>}
            {reqError && <p className="text-red-600 text-sm">{reqError}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
