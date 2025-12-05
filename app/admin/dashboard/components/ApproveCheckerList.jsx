"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * ApproveCheckerList.jsx
 * - Fetches pending checker requests
 * - Approve / Reject per item using id-specific endpoints:
 *    PUT /api/users/:id/approve
 *    PUT /api/users/:id/reject
 *
 * Place in: app/admin/dashboard/components/ApproveCheckerList.jsx
 */

export default function ApproveCheckerList() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyMap, setBusyMap] = useState({}); // { [id]: "approve" | "reject" | false }
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    // If not signed-in as admin redirect to login (client-side)
    if (status === "loading") return;
    if (!session || session.user?.role !== "admin") {
      router.push("/login");
      return;
    }
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  function setBusy(id, state) {
    setBusyMap((s) => ({ ...s, [id]: state || false }));
  }

  async function fetchPending() {
    setLoading(true);
    setMsg(null);
    try {
      // prefer admin endpoint
      let res = await fetch("/api/admin/pending-checkers");
      let json = null;
      if (res.ok) json = await res.json().catch(() => null);

      // fallback to /api/users?pending=true
      if (!json || (!Array.isArray(json) && !Array.isArray(json.pending) && !Array.isArray(json.users))) {
        const r2 = await fetch("/api/users?pending=true");
        json = await r2.json().catch(() => null);
      }

      // Coerce to array
      let list = [];
      if (Array.isArray(json)) list = json;
      else if (Array.isArray(json.pending)) list = json.pending;
      else if (Array.isArray(json.users)) list = json.users;
      else if (json?.ok && Array.isArray(json.pending)) list = json.pending;
      else list = [];

      setPending(list);
    } catch (err) {
      console.error("fetchPending error:", err);
      setMsg("Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  }

  async function doApprove(id, email) {
    if (!confirm(`Approve checker request for ${email}?`)) return;
    setMsg(null);
    setBusy(id, "approve");
    try {
      const res = await fetch(`/api/users/${id}/approve`, { method: "PUT" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Approve failed");
      }
      // success — remove from list
      setPending((p) => p.filter((u) => (u._id || u.id) !== id));
      setMsg(`✅ ${email} approved`);
    } catch (err) {
      console.error("approve error:", err);
      setMsg(`❌ Approve failed: ${err.message || err}`);
      // if unauthorized, redirect to login
      if (String(err).toLowerCase().includes("unauthorized")) router.push("/login");
    } finally {
      setBusy(id, false);
    }
  }

  async function doReject(id, email) {
    if (!confirm(`Reject checker request for ${email}?`)) return;
    setMsg(null);
    setBusy(id, "reject");
    try {
      const res = await fetch(`/api/users/${id}/reject`, { method: "PUT" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Reject failed");
      }
      setPending((p) => p.filter((u) => (u._id || u.id) !== id));
      setMsg(`❌ ${email} rejected`);
    } catch (err) {
      console.error("reject error:", err);
      setMsg(`❌ Reject failed: ${err.message || err}`);
      if (String(err).toLowerCase().includes("unauthorized")) router.push("/login");
    } finally {
      setBusy(id, false);
    }
  }

  return (
    <div>
      {msg && (
        <div className="mb-4 text-sm">
          <div className="inline-block bg-black text-white px-3 py-1 rounded">{msg}</div>
        </div>
      )}

      {loading ? (
        <p>Loading pending requests…</p>
      ) : pending.length === 0 ? (
        <p>No pending checker requests</p>
      ) : (
        <div className="grid gap-3">
          {pending.map((u) => {
            const id = u._id || u.id;
            const name = u.name || "Unknown";
            const email = u.email || "—";
            const note = u.note || "";
            const busy = busyMap[id];

            return (
              <div key={id} className="p-4 rounded flex justify-between items-center">
                <div>
                  <div className="font-semibold">{name}</div>
                  <div className="text-sm text-gray-600">{email}</div>
                  {note && <div className="text-xs text-gray-500 mt-1">Note: {note}</div>}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => doApprove(id, email)}
                    disabled={!!busy}
                    className={`px-3 py-1 rounded text-white ${busy === "approve" ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {busy === "approve" ? "Approving..." : "Approve"}
                  </button>

                  <button
                    onClick={() => doReject(id, email)}
                    disabled={!!busy}
                    className={`px-3 py-1 rounded text-white ${busy === "reject" ? "bg-red-400" : "bg-red-600 hover:bg-red-700"}`}
                  >
                    {busy === "reject" ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
