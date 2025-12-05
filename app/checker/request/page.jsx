// app/checker/request/page.jsx
"use client";
import { useState } from "react";

export default function CheckerRequestPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/checker/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, note }),
      });
      const data = await res.json();
      if (res.ok) setMsg("Request submitted — wait for admin approval.");
      else setMsg(data.error || "Request failed");
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded p-6 shadow">
        <h2 className="text-lg font-semibold mb-4">Request Checker Access</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name" className="w-full p-2 border rounded" required />
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" type="email" className="w-full p-2 border rounded" required />
          <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full p-2 border rounded" required />
          <input value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Note (optional)" className="w-full p-2 border rounded" />
          <button disabled={loading} className="w-full bg-green-600 text-white p-2 rounded">{loading ? "Submitting..." : "Request Access"}</button>
        </form>
        {msg && <p className="mt-3 text-sm">{msg}</p>}
      </div>
    </div>
  );
}
