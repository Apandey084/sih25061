// // app/checker/dashboard/page.jsx
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/authOptions";
// import connectDB from "@/lib/mongodb";
// import CheckerUser from "@/lib/models/CheckerUser";

// export default async function CheckerDashboard() {
//   // ensure session (server-side)
//   const session = await getServerSession(authOptions);
//   if (!session || session.user?.role !== "checker") {
//     // server component: return JSX
//     return <div className="p-6">Unauthorized. Please sign in as a checker.</div>;
//   }

//   // make sure DB is connected
//   try {
//     if (typeof connectDB === "function") await connectDB();
//   } catch (err) {
//     console.error("DB connect error in CheckerDashboard:", err);
//     return <div className="p-6">Server error connecting to database.</div>;
//   }

//   // session.user.id should hold the user/ checker id (see authOptions callbacks)
//   const checkerId = session.user?.id || session.user?.sub;
//   if (!checkerId) {
//     return <div className="p-6">Invalid session (no user id).</div>;
//   }

//   const checker = await CheckerUser.findById(checkerId).lean();
//   if (!checker || !checker.approved || checker.active === false) {
//     return <div className="p-6">Your checker account is not active or approved.</div>;
//   }

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-semibold">Checker Dashboard</h1>
//       <p className="mt-2">Welcome, {checker.name}</p>
//       <p className="mt-4">Use your tools here to verify items.</p>
//     </div>
//   );
// }
// app/checker/dashboard/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function CheckerDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const checkerId = session?.user?.id ?? session?.user?.sub ?? null;

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState(null);

  // Try to fetch checker profile and stats from your API endpoints if they exist.
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);

      // attempt to use session data as fallback
      const fallback = {
        name: session?.user?.name ?? session?.user?.email ?? "Checker",
        email: session?.user?.email ?? "—",
        role: session?.user?.role ?? "checker",
        approved: true,
        active: true,
      };

      try {
        // 1) Fetch profile (optional endpoint: /api/checker/:id)
        if (checkerId) {
          try {
            const res = await fetch(`/api/checker/${checkerId}`);
            if (res.ok) {
              const json = await res.json();
              if (mounted) setProfile(json.checker ?? json);
            } else {
              // keep fallback profile
              if (mounted && !profile) setProfile(fallback);
            }
          } catch {
            if (mounted && !profile) setProfile(fallback);
          }

          // 2) Fetch stats (optional endpoint: /api/checker/:id/stats)
          setLoadingStats(true);
          try {
            const sres = await fetch(`/api/checker/${checkerId}/stats`);
            if (sres.ok) {
              const sjson = await sres.json();
              if (mounted) setStats({
                today: sjson.today ?? sjson.ticketsToday ?? 0,
                total: sjson.total ?? sjson.totalVerified ?? 0,
              });
            } else {
              if (mounted) setStats({ today: 0, total: 0 });
            }
          } catch {
            if (mounted) setStats({ today: 0, total: 0 });
          } finally {
            if (mounted) setLoadingStats(false);
          }

          // 3) Fetch recent verifications (optional endpoint: /api/checker/:id/recent)
          try {
            const rres = await fetch(`/api/checker/${checkerId}/recent`);
            if (rres.ok) {
              const rjson = await rres.json();
              if (mounted) setRecent(Array.isArray(rjson) ? rjson : (rjson.recent ?? []));
            } else {
              if (mounted) setRecent([]);
            }
          } catch {
            if (mounted) setRecent([]);
          }
        } else {
          // no checkerId in session -> use fallback
          if (mounted) setProfile(fallback);
          setStats({ today: 0, total: 0 });
          setRecent([]);
        }
      } catch (err) {
        console.error("load checker dashboard:", err);
        if (mounted) setError("Failed to load checker details.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [checkerId]);

  function goVerify() {
    // navigate to the verify page (you asked for checker/dashboard/verify-ticket)
    router.push("/checker/dashboard/verify-ticket");
  }

  return (
    <div className="min-h-screen relative text-gray-100">
      {/* Background radial grid (exact as requested) */}
      <div className="absolute top-0 z-[-2] h-screen w-screen bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px]" />

      {/* subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 z-[-1]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          {/* LEFT: Profile card */}
          <aside className="w-full lg:w-1/3">
            <div className="bg-gradient-to-br from-white/6 to-white/3 border border-white/6 rounded-2xl p-6 shadow-lg backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-purple-500 to-pink-400 flex items-center justify-center text-xl font-bold text-white">
                  {profile?.name ? profile.name.split(" ").map(n => n[0]).slice(0,2).join("") : (session?.user?.email ? session.user.email[0].toUpperCase() : "C")}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{profile?.name ?? "Loading…"}</h2>
                  <p className="text-sm text-gray-300">{profile?.email ?? session?.user?.email ?? "—"}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-md bg-white/3">
                  <div className="text-xs text-gray-300">Role</div>
                  <div className="font-medium">{profile?.role ?? "checker"}</div>
                </div>
                <div className="p-3 rounded-md bg-white/3">
                  <div className="text-xs text-gray-300">Status</div>
                  <div className="font-medium flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${profile?.approved && profile?.active ? "bg-green-400" : "bg-yellow-400"}`}></span>
                    {profile?.approved && profile?.active ? "Active" : "Pending"}
                  </div>
                </div>

                <div className="p-3 rounded-md bg-white/3">
                  <div className="text-xs text-gray-300">Member since</div>
                  <div className="font-medium">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}</div>
                </div>

                <div className="p-3 rounded-md bg-white/3">
                  <div className="text-xs text-gray-300">Verified as</div>
                  <div className="font-medium">{profile?.name ? profile.name : session?.user?.email ?? "—"}</div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={goVerify}
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow hover:scale-[1.01] transition"
                >
                  Verify Tickets
                </button>

                <button
                  onClick={() => navigator.clipboard?.writeText(checkerId ?? "")}
                  className="w-full px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-200 hover:bg-white/2 transition"
                >
                  Copy my Checker ID
                </button>

                <button
                  onClick={() => signIn()}
                  className="w-full px-4 py-2 rounded-lg text-sm bg-transparent border border-white/10 text-gray-200 hover:bg-white/3 transition"
                >
                  Re-sign / Switch Account
                </button>
              </div>
            </div>
          </aside>

          {/* RIGHT: Stats & recent verifications */}
          <main className="w-full lg:w-2/3">
            <div className="flex flex-col gap-6">
              {/* header and stats */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold">Checker Dashboard</h1>
                  <p className="text-sm text-gray-300 mt-1">Welcome back{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}. Manage verifications and review recent activity.</p>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="bg-white/5 p-3 rounded-lg text-center min-w-[110px]">
                    <div className="text-xs text-gray-300">Today</div>
                    <div className="text-xl font-bold">{loadingStats ? "…" : stats.today}</div>
                    <div className="text-xs text-gray-400">tickets</div>
                  </div>

                  <div className="bg-white/5 p-3 rounded-lg text-center min-w-[110px]">
                    <div className="text-xs text-gray-300">Total Verified</div>
                    <div className="text-xl font-bold">{loadingStats ? "…" : stats.total}</div>
                    <div className="text-xs text-gray-400">all time</div>
                  </div>
                </div>
              </div>

              {/* Recent verifications */}
              <section className="bg-white/4 border border-white/6 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Recent verifications</h3>
                  <button
                    onClick={() => {
                      // refresh recent
                      if (checkerId) {
                        setLoadingStats(true);
                        fetch(`/api/checker/${checkerId}/recent`).then(r => r.json()).then(j => setRecent(j.recent ?? j ?? [])).catch(() => setRecent([])).finally(()=>setLoadingStats(false));
                      }
                    }}
                    className="text-sm text-gray-300 hover:underline"
                  >
                    Refresh
                  </button>
                </div>

                {loading && !recent.length ? (
                  <div className="text-sm text-gray-400">Loading recent verifications…</div>
                ) : recent.length === 0 ? (
                  <div className="text-sm text-gray-400">
                    No verifications yet. Click <span className="font-semibold">Verify Tickets</span> to begin scanning.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {recent.map((r, idx) => (
                      <li key={r.id ?? idx} className="flex items-center justify-between bg-white/6 p-3 rounded-md">
                        <div>
                          <div className="text-sm font-medium">{r.purchaserName ?? r.name ?? "Visitor"}</div>
                          <div className="text-xs text-gray-300">{r.purchaserEmail ?? r.email ?? "—"}</div>
                          <div className="text-xs text-gray-400 mt-1">Monastery: {r.monastery?.name ?? r.monasteryName ?? "—"}</div>
                        </div>
                        <div className="text-right text-xs">
                          <div className="font-semibold">{r.numVisitors ?? r.visitors ?? 1} visitor(s)</div>
                          <div className="text-gray-400">{r.verifiedAt ? new Date(r.verifiedAt).toLocaleString() : "—"}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* activity / logs */}
              <section className="bg-white/4 border border-white/6 rounded-2xl p-4">
                <h3 className="text-lg font-semibold mb-2">Recent activity</h3>
                <div className="text-sm text-gray-300">
                  {error ? (
                    <div className="text-red-400">Error: {error}</div>
                  ) : (
                    <div>
                      <div className="text-xs text-gray-400">Middleware: </div>
                      <div className="mt-2 text-xs text-gray-300">Checker token present — your routes should be protected. If you need a dev bypass, add <code className="bg-white/6 px-1 rounded text-xs">DEV_CHECKER_ID</code> to your .env (local only).</div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
