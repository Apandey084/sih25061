// // app/admin/dashboard/page.jsx
// import AdminSidebar from "@/app/components/AdminSidebar";
// import AdminNavbar from "@/app/components/AdminNavbar";
// import { Card, CardContent } from "@/app/components/ui/card";


// // server-side DB imports (use your existing models)
// import connectDB from "@/lib/mongodb";
// import Monastery from "@/lib/models/Monastery";
// import User from "@/lib/models/User";
// import Ticket from "@/lib/models/Ticket";

// export default async function AdminDashboardPage() {
//   // ensure DB connected
//   try {
//     await connectDB();
//   } catch (err) {
//     console.error("DB connect failed in admin dashboard:", err);
//   }

//   // Gather real stats (server-side)
//   const [
//     totalMonasteries,
//     totalUsers,
//     totalTickets,
//     pendingCheckersCount,
//   ] = await Promise.all([
//     Monastery.countDocuments().catch(() => 0),
//     User.countDocuments({ role: { $in: ["user", "checker", "admin"] } }).catch(
//       () => 0
//     ),
//     Ticket.countDocuments().catch(() => 0),
//     User.countDocuments({ role: "checker", approved: false }).catch(() => 0),
//   ]);

//   const stats = [
//     { label: "Total Monasteries", value: totalMonasteries ?? 0 },
//     { label: "Registered Users", value: totalUsers ?? 0 },
//     { label: "Tickets Booked", value: totalTickets ?? 0 },
//     { label: "Pending Checker Requests", value: pendingCheckersCount ?? 0 },
//   ];

//   return (
//     <div className="flex h-screen bg-gray-50">
//       <AdminSidebar />

//       <div className="flex-1 flex flex-col">
//         <AdminNavbar />

//         <main className="flex-1 p-6 space-y-6 overflow-y-auto">
//           <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>

//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//             {stats.map((stat) => (
//               <Card
//                 key={stat.label}
//                 className="shadow-sm border border-gray-200 bg-white hover:shadow-md transition"
//               >
//                 <CardContent className="p-5">
//                   <h3 className="text-sm text-gray-500">{stat.label}</h3>
//                   <p className="text-2xl font-bold text-gray-800 mt-2">
//                     {stat.value}
//                   </p>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>


//           {/* Activity / Other summaries */}
//           <section className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//             <h3 className="text-lg font-semibold text-gray-800 mb-3">
//               Activity Summary
//             </h3>
//             <p className="text-gray-500 text-sm">
//               Quick overview of recent activity. Charts and detailed analytics can
//               be plugged in here in a later phase.
//             </p>
//           </section>
//         </main>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/app/components/AdminSidebar";
import AdminNavbar from "@/app/components/AdminNavbar";

/**
 * Admin Dashboard (client-side)
 *
 * - Fetches stats from: /api/monasteries, /api/users, /api/tickets
 * - Fetches recent lists from the same endpoints (last few items)
 * - Renders a bar chart (tickets by month) and a donut chart for quick breakdown
 * - Uses your requested background and is responsive
 */

/* ----------------------------- helpers & SVG charts ---------------------------- */

function formatNumber(n) {
  if (n == null) return "0";
  return n.toLocaleString?.() ?? String(n);
}

/* Simple BarChart component (responsive) */
function BarChart({ labels = [], values = [], height = 160 }) {
  const max = Math.max(...values, 1);
  const pad = 12;
  const barGap = 8;
  const bars = values.length;
  const barWidth = bars ? Math.max(12, Math.floor((600 - pad * 2 - barGap * (bars - 1)) / bars)) : 12;
  const svgWidth = Math.min(900, bars * (barWidth + barGap) + pad * 2);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${height}`} width="100%" height={height} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="barGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      {values.map((v, i) => {
        const x = pad + i * (barWidth + barGap);
        const h = Math.round((v / max) * (height - 40));
        const y = height - h - 20;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={h} rx="6" fill="url(#barGrad)" />
            <text x={x + barWidth / 2} y={height - 4} fontSize="10" fill="#94a3b8" textAnchor="middle">
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* Simple Donut Chart */
function Donut({ parts = [], size = 120 }) {
  const total = parts.reduce((s, p) => s + (p.value || 0), 0) || 1;
  const center = size / 2;
  const radius = size / 2 - 6;

  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {parts.map((p, idx) => {
        const start = (acc / total) * Math.PI * 2;
        acc += p.value || 0;
        const end = (acc / total) * Math.PI * 2;
        const large = end - start > Math.PI ? 1 : 0;
        const x1 = center + radius * Math.cos(start - Math.PI / 2);
        const y1 = center + radius * Math.sin(start - Math.PI / 2);
        const x2 = center + radius * Math.cos(end - Math.PI / 2);
        const y2 = center + radius * Math.sin(end - Math.PI / 2);
        const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
        return <path key={idx} d={d} fill={p.color || "#7c3aed"} />;
      })}
      <circle cx={center} cy={center} r={radius - 16} fill="#0b1220" />
    </svg>
  );
}

/* ----------------------------- Main component ---------------------------- */

export default function AdminDashboardPage() {
  const router = useRouter();

  // stats
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    monasteries: 0,
    users: 0,
    tickets: 0,
  });

  // recent lists
  const [recentMonasteries, setRecentMonasteries] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);

  // charts data
  const [ticketMonthsLabels, setTicketMonthsLabels] = useState([]);
  const [ticketMonthsValues, setTicketMonthsValues] = useState([]);
  const [ticketStatusParts, setTicketStatusParts] = useState([]);

  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // parallel requests
      const [mRes, uRes, tRes] = await Promise.all([
        fetch("/api/monasteries?limit=5").then((r) => r.json()).catch(() => []),
        fetch("/api/users?limit=5").then((r) => r.json()).catch(() => []),
        fetch("/api/tickets?limit=6").then((r) => r.json()).catch(() => []),
      ]);

      const monasteries = Array.isArray(mRes) ? mRes : mRes.items ?? [];
      const users = Array.isArray(uRes) ? uRes : uRes.items ?? [];
      const tickets = Array.isArray(tRes) ? tRes : tRes.items ?? [];

      setRecentMonasteries(monasteries.slice(0, 5));
      setRecentUsers(users.slice(0, 5));
      setRecentTickets(tickets.slice(0, 6));

      // counts (APIs returning arrays or { total } shape supported)
      const totalMon = Array.isArray(mRes) ? mRes.length : mRes.total ?? 0;
      const totalUsers = Array.isArray(uRes) ? uRes.length : uRes.total ?? 0;
      const totalTickets = Array.isArray(tRes) ? tRes.length : tRes.total ?? 0;
      setStats({ monasteries: totalMon, users: totalUsers, tickets: totalTickets });

      // Prepare a simple month timeseries: call endpoint /api/tickets?agg=months (if you have).
      // Fallback: client-side group of recent tickets by month
      if (tickets.length) {
        const map = {};
        tickets.forEach((t) => {
          const d = new Date(t.createdAt || t.visitDate || Date.now());
          const key = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
          map[key] = (map[key] || 0) + 1;
        });
        const keys = Object.keys(map).sort();
        setTicketMonthsLabels(keys.map((k) => k.replace("/", "/")));
        setTicketMonthsValues(keys.map((k) => map[k]));
      } else {
        setTicketMonthsLabels([]);
        setTicketMonthsValues([]);
      }

      // status parts (simple breakdown)
      const statusCounts = {};
      tickets.forEach((t) => {
        const s = t.status || t.paymentStatus || "booked";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const colors = ["#06b6d4", "#7c3aed", "#ef4444", "#f59e0b", "#10b981"];
      const parts = Object.keys(statusCounts).map((k, i) => ({ label: k, value: statusCounts[k], color: colors[i % colors.length] }));
      setTicketStatusParts(parts);
    } catch (err) {
      console.error("fetchData error", err);
      setMessage("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  const donutTotal = useMemo(() => ticketStatusParts.reduce((s, p) => s + (p.value || 0), 0), [ticketStatusParts]);

  return (
    <div className="relative min-h-screen w-full text-white">
      {/* Requested background (behind everything) */}
      <div className="absolute inset-0 z-[-2] bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px]" />
      <div className="absolute inset-0 z-[-1] bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      <div className="flex h-screen">
        {/* Sidebar & main column */}
        <AdminSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminNavbar />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {/* header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
                  <p className="text-sm text-gray-300 mt-1">Essential metrics & recent activity</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => router.push("/admin/monasteries/new")} className="px-4 py-2 rounded bg-emerald-600 text-white">+ Add Monastery</button>
                  <button onClick={fetchData} className="px-4 py-2 rounded bg-white/6 text-white">Refresh</button>
                </div>
              </div>

              {/* stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/6">
                  <div className="text-sm text-gray-300">Monasteries</div>
                  <div className="mt-2 text-2xl font-bold text-white">{loading ? "…" : formatNumber(stats.monasteries)}</div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/6">
                  <div className="text-sm text-gray-300">Users</div>
                  <div className="mt-2 text-2xl font-bold text-white">{loading ? "…" : formatNumber(stats.users)}</div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/6">
                  <div className="text-sm text-gray-300">Tickets</div>
                  <div className="mt-2 text-2xl font-bold text-white">{loading ? "…" : formatNumber(stats.tickets)}</div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/6">
                  <div className="text-sm text-gray-300">Recent activity</div>
                  <div className="mt-2 text-2xl font-bold text-white">{loading ? "…" : (recentMonasteries.length + recentUsers.length + recentTickets.length)}</div>
                </div>
              </div>

              {/* charts + lists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Tickets timeseries + breakdown */}
                <section className="lg:col-span-2 bg-white/6 p-4 rounded-xl border border-white/8">
                  <h3 className="text-white font-semibold mb-3">Tickets (recent)</h3>

                  <div className="w-full">
                    {ticketMonthsValues.length ? (
                      <BarChart labels={ticketMonthsLabels} values={ticketMonthsValues} height={160} />
                    ) : (
                      <div className="text-gray-300">No ticket timeseries data</div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {ticketStatusParts.length ? ticketStatusParts.map((p) => (
                      <div key={p.label} className="p-3 bg-white/8 rounded flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                        <div className="flex-1">
                          <div className="text-xs text-gray-300">{p.label}</div>
                          <div className="text-sm font-semibold text-white">{p.value} ({((p.value / (donutTotal || 1)) * 100).toFixed(0)}%)</div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-gray-300">No status breakdown</div>
                    )}
                  </div>
                </section>

                {/* Recent lists */}
                <aside className="bg-white/6 p-4 rounded-xl border border-white/8">
                  <h3 className="text-white font-semibold mb-3">Recent Activity</h3>

                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-2">Recent Monasteries</div>
                      <ul className="space-y-2">
                        {recentMonasteries.length ? recentMonasteries.map((m) => (
                          <li key={m._id} className="text-sm text-gray-200">{m.name} <span className="text-xs text-gray-400">— {new Date(m.createdAt).toLocaleDateString()}</span></li>
                        )) : <li className="text-sm text-gray-400">No recent monasteries</li>}
                      </ul>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400 mb-2">New Users</div>
                      <ul className="space-y-2">
                        {recentUsers.length ? recentUsers.map((u) => (
                          <li key={u._id} className="text-sm text-gray-200">{u.name || u.email} <span className="text-xs text-gray-400">— {new Date(u.createdAt).toLocaleDateString()}</span></li>
                        )) : <li className="text-sm text-gray-400">No recent users</li>}
                      </ul>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400 mb-2">Recent Tickets</div>
                      <ul className="space-y-2">
                        {recentTickets.length ? recentTickets.map((t) => (
                          <li key={t._id} className="text-sm text-gray-200">{t.purchaserName || t.purchaserEmail} <span className="text-xs text-gray-400">— {new Date(t.createdAt).toLocaleDateString()}</span></li>
                        )) : <li className="text-sm text-gray-400">No recent tickets</li>}
                      </ul>
                    </div>
                  </div>
                </aside>
              </div>

              {/* footer summary */}
              <section className="bg-white/6 p-4 rounded-xl border border-white/8">
                <h3 className="text-white font-semibold mb-2">Activity Summary</h3>
                <p className="text-gray-300 text-sm">This dashboard shows quick, important metrics and the latest items. For deeper analysis add server-side aggregations and interactive charts.</p>
              </section>
            </div>
          </main>
        </div>
      </div>

      {/* small toast message */}
      {message && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded">{message}</div>}
    </div>
  );
}
