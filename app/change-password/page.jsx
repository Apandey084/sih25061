"use client";

import { useState } from "react";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleReset(e) {
    e.preventDefault();
    setMsg("");

    const res = await fetch("/api/users/reset-password", {
      method: "PUT", // ✅ must be PUT, not POST
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (res.ok) setMsg("✅ Password updated successfully. Please log in again.");
    else setMsg(data.error || "❌ Failed to update password");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleReset}
        className="bg-white p-6 rounded shadow w-80 flex flex-col gap-3"
      >
        <h2 className="text-lg font-bold">Change Password</h2>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <button className="bg-blue-600 text-white py-2 rounded" type="submit">
          Update Password
        </button>
        {msg && <p className="text-sm text-center mt-2">{msg}</p>}
      </form>
    </div>
  );
}
