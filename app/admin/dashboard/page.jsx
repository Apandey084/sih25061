// // app/admin/dashboard/page.jsx
// "use client";

// import { useEffect, useState } from "react";
// import { useSession } from "next-auth/react";
// import { useRouter } from "next/navigation";

// export default function AdminDashboard() {
//   const { data: session, status } = useSession();
//   const router = useRouter();

//   const [pending, setPending] = useState([]);
//   const [msg, setMsg] = useState("");
//   const [loadingPending, setLoadingPending] = useState(false);
//   const [busyMap, setBusyMap] = useState({}); // { [id]: "approve" | "reject" | false }

//   // stats
//   const [stats, setStats] = useState({
//     monasteries: 0,
//     users: 0,
//     images: 0,
//     pendingReviews: 0,
//   });
//   const [loadingStats, setLoadingStats] = useState(false);

//   useEffect(() => {
//     if (status === "loading") return;
//     if (!session || session.user?.role !== "admin") {
//       // redirect to login (or safe page)
//       router.push("/login");
//       return;
//     }
//     fetchPending();
//     fetchStats();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, status]);

//   // utility to coerce typical response shapes into an array
//   function coerceToArray(data) {
//     if (!data) return [];
//     if (Array.isArray(data)) return data;
//     if (Array.isArray(data.pending)) return data.pending;
//     if (Array.isArray(data.users)) return data.users;
//     if (data.ok && Array.isArray(data.pending)) return data.pending;
//     if (data.ok && Array.isArray(data.users)) return data.users;
//     // unknown shape — return empty
//     return [];
//   }

//   async function fetchPending() {
//     setLoadingPending(true);
//     setMsg("");
//     try {
//       // prefer the admin helper endpoint if available
//       let res = await fetch("/api/admin/pending-checkers");
//       let json = await res.json().catch(() => null);

//       // fallback to /api/users?pending=true if admin endpoint isn't present
//       if (!json || (Array.isArray(json) === false && !json.pending && !json.users)) {
//         const r2 = await fetch("/api/users?pending=true");
//         const j2 = await r2.json().catch(() => null);
//         json = j2 ?? json;
//       }

//       const list = coerceToArray(json);
//       setPending(list);
//     } catch (err) {
//       console.error("fetchPending error:", err);
//       setMsg("Failed to fetch pending requests");
//       setPending([]);
//     } finally {
//       setLoadingPending(false);
//     }
//   }

//   async function fetchStats() {
//     setLoadingStats(true);
//     try {
//       const mReq = fetch("/api/monasteries").then(r => r.json()).catch(() => []);
//       const uReq = fetch("/api/users").then(r => r.json()).catch(() => ({ total: 0 }));
//       const tReq = fetch("/api/tickets").then(r => r.json()).catch(() => []);
//       const [mData, uData, tData] = await Promise.all([mReq, uReq, tReq]);

//       const monasteriesCount = Array.isArray(mData) ? mData.length : (mData.total || 0);
//       const usersCount = (typeof uData === "object" && uData !== null) ? (uData.total ?? (Array.isArray(uData) ? uData.length : 0)) : 0;
//       const ticketsCount = Array.isArray(tData) ? tData.length : (tData.total ?? 0);

//       let pendingReviews = 0;
//       if (Array.isArray(tData)) pendingReviews = tData.filter(t => t.paymentStatus === "pending").length;

//       setStats({
//         monasteries: monasteriesCount,
//         users: usersCount,
//         images: 0,
//         pendingReviews: pendingReviews || 0,
//       });
//     } catch (err) {
//       console.error("fetchStats error:", err);
//     } finally {
//       setLoadingStats(false);
//     }
//   }

//   function setBusy(id, val) {
//     setBusyMap(prev => ({ ...prev, [id]: val }));
//   }

//   async function approve(id, email) {
//     setMsg("");
//     if (!confirm(`Approve checker request for ${email}?`)) return;
//     try {
//       setBusy(id, "approve");
//       const res = await fetch(`/api/users/${encodeURIComponent(id)}/approve`, { method: "PUT" });
//       const data = await res.json().catch(() => ({}));
//       if (!res.ok) {
//         throw new Error(data?.error || data?.detail || "Approve failed");
//       }
//       setMsg(`✅ ${email} approved`);
//       setPending(prev => prev.filter(u => (u._id || u.id) !== id));
//     } catch (err) {
//       console.error("approve error:", err);
//       setMsg(`❌ Approve failed: ${err.message || err}`);
//     } finally {
//       setBusy(id, false);
//     }
//   }

//   async function rejectRequest(id, email) {
//     setMsg("");
//     if (!confirm(`Reject checker request for ${email}? This cannot be undone.`)) return;
//     try {
//       setBusy(id, "reject");
//       const res = await fetch(`/api/users/${encodeURIComponent(id)}/reject`, { method: "PUT" });
//       const data = await res.json().catch(() => ({}));
//       if (!res.ok) {
//         throw new Error(data?.error || data?.detail || "Reject failed");
//       }
//       setMsg(`Rejected ${email}`);
//       setPending(prev => prev.filter(u => (u._1d || u._id || u.id) !== id));
//     } catch (err) {
//       console.error("reject error:", err);
//       setMsg(`❌ Reject failed: ${err.message || err}`);
//     } finally {
//       setBusy(id, false);
//     }
//   }

//   return (
//     <div className="p-8">
//       <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

//       {/* Stats */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
//         <div className="bg-white p-4 rounded shadow">
//           <div className="text-sm text-gray-500">Total Monasteries</div>
//           <div className="text-2xl font-bold">{loadingStats ? "…" : stats.monasteries}</div>
//         </div>
//         <div className="bg-white p-4 rounded shadow">
//           <div className="text-sm text-gray-500">Registered Users</div>
//           <div className="text-2xl font-bold">{loadingStats ? "…" : stats.users}</div>
//         </div>
//         <div className="bg-white p-4 rounded shadow">
//           <div className="text-sm text-gray-500">Images Uploaded</div>
//           <div className="text-2xl font-bold">{loadingStats ? "…" : stats.images}</div>
//         </div>
//         <div className="bg-white p-4 rounded shadow">
//           <div className="text-sm text-gray-500">Pending Reviews</div>
//           <div className="text-2xl font-bold">{loadingStats ? "…" : stats.pendingReviews}</div>
//         </div>
//       </div>

//       {/* Approve Checker Requests */}
//       <section className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//         <h3 className="text-lg font-semibold text-gray-800 mb-4">Approve Checker Requests</h3>

//         {loadingPending ? (
//           <p>Loading pending requests…</p>
//         ) : pending.length === 0 ? (
//           <p>No pending checker requests</p>
//         ) : (
//           <div className="grid gap-3">
//             {pending.map((u) => {
//               const id = u._id || u.id;
//               const name = u.name || u.fullname || "Unknown";
//               const email = u.email || "—";
//               const busy = busyMap[id];

//               return (
//                 <div key={id} className="p-4 bg-gray-100 rounded flex justify-between items-center">
//                   <div className="min-w-0">
//                     <div className="font-semibold truncate">{name}</div>
//                     <div className="text-sm text-gray-600 truncate">{email}</div>
//                     {u.note && <div className="text-xs text-gray-500 mt-1">Note: {u.note}</div>}
//                   </div>

//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => approve(id, email)}
//                       disabled={!!busy}
//                       className={`px-3 py-1 rounded text-white ${busy === "approve" ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}
//                     >
//                       {busy === "approve" ? "Approving..." : "Approve"}
//                     </button>

//                     <button
//                       onClick={() => rejectRequest(id, email)}
//                       disabled={!!busy}
//                       className={`px-3 py-1 rounded text-white ${busy === "reject" ? "bg-red-400" : "bg-red-600 hover:bg-red-700"}`}
//                     >
//                       {busy === "reject" ? "Rejecting..." : "Reject"}
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </section>

//       <div className="mt-6">
//         <button
//           onClick={() => router.push("/add-monastery")}
//           className="bg-green-600 text-white px-3 py-1 rounded"
//         >
//           + Add Monastery
//         </button>
//       </div>

//       {msg && (
//         <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded shadow">
//           {msg}
//         </div>
//       )}
//     </div>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState({ monasteries: 0, users: 0, ticketsPending: 0 });
  const [pending, setPending] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [message, setMessage] = useState("");
  const [busyMap, setBusyMap] = useState({});

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "admin") {
      router.push("/login");
      return;
    }
    fetchStats();
    fetchPending();
  }, [session, status]);

  async function fetchStats() {
    setLoadingStats(true);

    try {
      const [mRes, uRes, tRes] = await Promise.all([
        fetch("/api/monasteries").then(r => r.json()),
        fetch("/api/users").then(r => r.json()),
        fetch("/api/tickets").then(r => r.json()),
      ]);

      const monasteries = Array.isArray(mRes) ? mRes.length : 0;
      const users = Array.isArray(uRes) ? uRes.length : (uRes.total || 0);
      const ticketsPending = Array.isArray(tRes)
        ? tRes.filter(t => t.paymentStatus === "pending").length
        : 0;

      setStats({ monasteries, users, ticketsPending });
    } catch {
      console.log("Stats error");
    }
    setLoadingStats(false);
  }

  async function fetchPending() {
    setLoadingPending(true);
    try {
      const res = await fetch("/api/admin/pending-checkers");
      const json = await res.json();

      const list =
        Array.isArray(json)
          ? json
          : Array.isArray(json?.pending)
          ? json.pending
          : [];

      setPending(list);
    } catch {
      setPending([]);
    }
    setLoadingPending(false);
  }

  function setBusy(id, val) {
    setBusyMap(prev => ({ ...prev, [id]: val }));
  }

  async function approve(id, email) {
    if (!confirm(`Approve ${email}?`)) return;

    try {
      setBusy(id, "approve");
      const res = await fetch(`/api/users/${id}/approve`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage(`Approved ${email}`);
      setPending(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      setMessage(err.message);
    }
    setBusy(id, false);
  }

  async function rejectRequest(id, email) {
    if (!confirm(`Reject ${email}?`)) return;

    try {
      setBusy(id, "reject");
      const res = await fetch(`/api/users/${id}/reject`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage(`Rejected ${email}`);
      setPending(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      setMessage(err.message);
    }
    setBusy(id, false);
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">

      {/* ✅ FORCED BACKGROUND FIX */}
      <div className="absolute inset-0 z-[-2] bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px]" />

      {/* Light fallback overlay */}
      <div className="absolute inset-0 z-[-1] bg-black/40 backdrop-blur-sm" />

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="p-5 rounded-xl bg-white/10 shadow-lg border border-white/10">
            <p className="text-gray-300 text-sm">Monasteries</p>
            <h2 className="mt-2 text-3xl font-bold">{stats.monasteries}</h2>
          </div>

          <div className="p-5 rounded-xl bg-white/10 shadow-lg border border-white/10">
            <p className="text-gray-300 text-sm">Users</p>
            <h2 className="mt-2 text-3xl font-bold">{stats.users}</h2>
          </div>

          <div className="p-5 rounded-xl bg-white/10 shadow-lg border border-white/10">
            <p className="text-gray-300 text-sm">Pending Tickets</p>
            <h2 className="mt-2 text-3xl font-bold">{stats.ticketsPending}</h2>
          </div>
        </div>

        {/* Pending Checker Section */}
        <div className="bg-white/10 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-xl font-semibold mb-4">Pending Checker Requests</h3>

          {pending.length === 0 ? (
            <p className="text-gray-300">No pending requests.</p>
          ) : (
            <div className="space-y-4">
              {pending.map((u) => {
                const id = u._id;
                const busy = busyMap[id];

                return (
                  <div
                    key={id}
                    className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-gray-300 text-sm">{u.email}</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => approve(id, u.email)}
                        disabled={busy}
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {busy === "approve" ? "..." : "Approve"}
                      </button>

                      <button
                        onClick={() => rejectRequest(id, u.email)}
                        disabled={busy}
                        className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
                      >
                        {busy === "reject" ? "..." : "Reject"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Popup */}
        {message && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-lg shadow">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
