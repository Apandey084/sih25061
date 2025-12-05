"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [checkerName, setCheckerName] = useState("");
  const [checkerEmail, setCheckerEmail] = useState("");
  const [checkerNote, setCheckerNote] = useState("");
  const [msg, setMsg] = useState("");

  async function handleAdminLogin(e) {
    e.preventDefault();
    setMsg("");
    const res = await signIn("credentials", { redirect: false, email: adminEmail, password: adminPassword });
    if (res?.error) setMsg(res.error);
    else window.location.href = "/admin/dashboard";
  }

  async function handleCheckerRequest(e) {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch("/api/checker/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: checkerName, email: checkerEmail, note: checkerNote }),
      });
      const data = await res.json();
      if (res.ok) setMsg("Request submitted — wait for admin approval.");
      else setMsg(data.error || "Request failed");
    } catch (err) {
      setMsg("Request failed");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User OAuth Card
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-bold mb-4">User Login</h3>
          <p className="text-sm text-gray-600 mb-4">Sign in with Google or GitHub to explore monasteries and book tickets.</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => signIn("google")} className="px-4 py-2 bg-red-500 text-white rounded">Sign in with Google</button>
            <button onClick={() => signIn("github")} className="px-4 py-2 bg-gray-800 text-white rounded">Sign in with GitHub</button>
          </div>
        </div> */}

        {/* Admin Credentials Card */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-bold mb-4">Admin Login</h3>
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-3">
            <input value={adminEmail} onChange={(e)=>setAdminEmail(e.target.value)} placeholder="Admin email" className="p-2 border rounded" />
            <input value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} placeholder="Password" type="password" className="p-2 border rounded" />
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Sign in as Admin</button>
          </form>
        </div>

        {/* Checker Request Card */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-bold mb-4">Request Checker Access</h3>
          <p className="text-sm text-gray-600 mb-2">Fill this form to request checker access. Admin will review and approve.</p>
          <form onSubmit={handleCheckerRequest} className="flex flex-col gap-3">
            <input value={checkerName} onChange={(e)=>setCheckerName(e.target.value)} placeholder="Full name" className="p-2 border rounded" required />
            <input value={checkerEmail} onChange={(e)=>setCheckerEmail(e.target.value)} placeholder="Email" type="email" className="p-2 border rounded" required />
            <input value={checkerNote} onChange={(e)=>setCheckerNote(e.target.value)} placeholder="Note (optional)" className="p-2 border rounded" />
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Request Access</button>
          </form>
        </div>
      </div>

      {msg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded">
          {msg}
        </div>
      )}
    </div>
  );
}
