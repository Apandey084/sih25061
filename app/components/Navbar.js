// // app/components/Navbar.jsx
// "use client";

// import { useState } from "react";
// import { signIn, signOut, useSession } from "next-auth/react";

// export default function Navbar() {
//   const { data: session } = useSession();
//   const [open, setOpen] = useState(false);
//   const [checkerEmail, setCheckerEmail] = useState("");
//   const [checkerPassword, setCheckerPassword] = useState("");
//   const [msg, setMsg] = useState("");
//   const [loading, setLoading] = useState(false);

//   async function handleCheckerSignIn(e) {
//     e.preventDefault();
//     setMsg("");
//     setLoading(true);
//     try {
//       const res = await signIn("credentials", {
//         redirect: false,
//         email: checkerEmail,
//         password: checkerPassword,
//         callbackUrl: "/checker/dashboard",
//       });

//       // signIn returns an object when redirect: false
//       if (res?.error) {
//         setMsg(res.error || "Login failed");
//         setLoading(false);
//         return;
//       }

//       // success -> redirect to callbackUrl or default
//       const dest = res?.url || "/checker/dashboard";
//       window.location.href = dest;
//     } catch (err) {
//       setMsg("Login failed");
//       setLoading(false);
//     }
//   }

//   return (
//     <nav className="w-full bg-white shadow-sm">
//       <div className="max-w-6xl mx-auto px-4">
//         <div className="flex items-center justify-between h-16">
//           <div className="flex items-center gap-4">
//             <a href="/" className="text-xl font-semibold">Monastery360</a>
//           </div>

//           <div className="flex items-center gap-4">
//             {session?.user ? (
//               <div className="flex items-center gap-3">
//                 <span className="text-sm text-gray-700">Hi, {session.user.name || session.user.email}</span>
//                 <button
//                   onClick={() => signOut({ callbackUrl: "/" })}
//                   className="px-3 py-1 bg-red-500 text-white rounded text-sm"
//                 >
//                   Sign out
//                 </button>
//               </div>
//             ) : (
//               <div className="relative">
//                 <button
//                   onClick={() => setOpen((v) => !v)}
//                   className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                 >
//                   Login / Signup
//                 </button>

//                 {open && (
//                   <div className="absolute right-0 mt-2 w-96 bg-white rounded shadow-lg border p-4 z-50">
//                     {/* User OAuth */}
//                     <div className="mb-4">
//                       <h4 className="text-sm font-semibold mb-2">User — Sign in with</h4>
//                       <div className="flex gap-2">
//                         <button
//                           onClick={() => signIn("google")}
//                           className="flex-1 px-3 py-2 border rounded shadow-sm hover:bg-gray-50"
//                         >
//                           Sign in with Google
//                         </button>
//                         <button
//                           onClick={() => signIn("github")}
//                           className="flex-1 px-3 py-2 border rounded shadow-sm hover:bg-gray-50"
//                         >
//                           Sign in with GitHub
//                         </button>
//                       </div>
//                       <p className="text-xs text-gray-500 mt-2">Users use OAuth (Google / GitHub) — no password needed.</p>
//                     </div>

//                     <hr className="my-3" />

//                     {/* Checker credentials */}
//                     <div className="mb-4">
//                       <h4 className="text-sm font-semibold mb-2">Checker — Email & Password</h4>
//                       <form onSubmit={handleCheckerSignIn} className="flex flex-col gap-2">
//                         <input
//                           value={checkerEmail}
//                           onChange={(e) => setCheckerEmail(e.target.value)}
//                           type="email"
//                           placeholder="checker@example.com"
//                           required
//                           className="px-3 py-2 border rounded"
//                         />
//                         <input
//                           value={checkerPassword}
//                           onChange={(e) => setCheckerPassword(e.target.value)}
//                           type="password"
//                           placeholder="Password"
//                           required
//                           className="px-3 py-2 border rounded"
//                         />
//                         <div className="flex items-center justify-between gap-2">
//                           <button
//                             type="submit"
//                             disabled={loading}
//                             className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-60"
//                           >
//                             {loading ? "Signing in..." : "Sign in as Checker"}
//                           </button>
//                           <a
//                             href="/checker/request"
//                             className="text-sm text-blue-600 hover:underline"
//                           >
//                             Request checker access
//                           </a>
//                         </div>
//                         {msg && <p className="text-sm text-red-600 mt-1">{msg}</p>}
//                         <p className="text-xs text-gray-500 mt-2">Only approved checkers can access the checker dashboard.</p>
//                       </form>
//                     </div>

//                     <hr className="my-3" />

//                     {/* Admin */}
//                     <div>
//                       <h4 className="text-sm font-semibold mb-2">Admin</h4>
//                       <div className="flex items-center gap-2">
//                         <a
//                           href="/admin/signin"
//                           className="px-3 py-2 bg-indigo-600 text-white rounded"
//                         >
//                           Admin sign in
//                         </a>
//                       </div>
//                     </div>

//                     {/* Close */}
//                     <div className="mt-3 text-right">
//                       <button
//                         onClick={() => setOpen(false)}
//                         className="text-sm text-gray-600 hover:underline"
//                       >
//                         Close
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }
// app/components/Navbar.jsx
"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkerEmail, setCheckerEmail] = useState("");
  const [checkerPassword, setCheckerPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCheckerSignIn(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: checkerEmail,
        password: checkerPassword,
        callbackUrl: "/checker/dashboard",
      });

      if (res?.error) {
        setMsg(res.error);
        setLoading(false);
        return;
      }

      window.location.href = res?.url || "/checker/dashboard";
    } catch {
      setMsg("Login failed");
      setLoading(false);
    }
  }

  return (
    <nav className="w-full bg-gray-50/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 font-jakarta">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* LOGO + DESKTOP NAV */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-md bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-lg font-semibold text-slate-800 group-hover:text-purple-600 transition-colors">
                  Monastery360
                </span>
                <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                  Sacred Heritage
                </span>
              </div>
            </Link>

            {/* Desktop Navigation — Now with spacing + hover */}
            <div className="hidden md:flex items-center gap-4 ml-4">
              <Link href="/" className="nav-link">Home</Link>
              <Link href="/viewer" className="nav-link">Monasteries</Link>
              <Link href="/viewer" className="nav-link">VR Tours</Link>
              <Link href="/map" className="nav-link">Map</Link>
              <Link href="/book-ticket" className="nav-link">Bookings</Link>
            </div>
          </div>

          {/* RIGHT SIDE ACTIONS */}
          <div className="flex items-center gap-3">

            {/* Mobile Menu Button */}
            <button
              className="md:hidden px-3 py-2 rounded-md text-slate-700 hover:bg-gray-200 transition"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>

            {/* Signed-in user */}
            {session?.user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-700 hidden sm:block">
                  Hello, <span className="font-medium">{session.user.name || session.user.email}</span>
                </span>

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm shadow hover:bg-red-700 hover:scale-105 transition"
                >
                  Sign out
                </button>
              </div>
            ) : (
              /* LOGIN DROPDOWN BUTTON */
              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-pink-500 text-white rounded-md shadow hover:scale-105 transition-transform"
                >
                  Login / Signup
                </button>

                {/* LOGIN PANEL */}
                {open && (
                  <div className="absolute right-0 mt-2 w-[360px] bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 animate-fadeIn">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-800">Sign In</h4>
                      <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700">✕</button>
                    </div>

                    {/* OAuth */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">User — sign in via</p>
                      <div className="flex gap-2">
                        <button onClick={() => signIn("google")} className="oauth-btn">Google</button>
                        <button onClick={() => signIn("github")} className="oauth-btn">GitHub</button>
                      </div>
                    </div>

                    <div className="border-t my-3" />

                    {/* Checker Login */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-700 font-semibold mb-2">Checker Login</p>
                      <form onSubmit={handleCheckerSignIn} className="flex flex-col gap-2">
                        <input
                          type="email"
                          placeholder="checker@example.com"
                          required
                          className="input-field"
                          value={checkerEmail}
                          onChange={(e) => setCheckerEmail(e.target.value)}
                        />

                        <input
                          type="password"
                          placeholder="Password"
                          required
                          className="input-field"
                          value={checkerPassword}
                          onChange={(e) => setCheckerPassword(e.target.value)}
                        />

                        <button
                          type="submit"
                          disabled={loading}
                          className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {loading ? "Signing in..." : "Sign in as Checker"}
                        </button>

                        {msg && <p className="text-sm text-red-600">{msg}</p>}
                      </form>

                      <Link href="/checker/request" className="text-xs text-indigo-600 hover:underline mt-1 block">
                        Request checker access
                      </Link>
                    </div>

                    <div className="border-t my-3" />

                    {/* Admin Login */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Admin</p>
                      <Link
                        href="/admin/signin"
                        className="inline-block px-3 py-2 bg-indigo-600 text-white rounded-md text-sm shadow hover:bg-indigo-700 hover:scale-105 transition"
                      >
                        Admin sign in
                      </Link>
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-gray-50 animate-fadeIn">
          <div className="px-4 py-3 space-y-2">
            <Link href="/" className="mobile-link">Home</Link>
            <Link href="/viewer" className="mobile-link">Monasteries</Link>
            <Link href="/viewer" className="mobile-link">VR Tours</Link>
            <Link href="/map" className="mobile-link">Map</Link>
            <Link href="/book-ticket" className="mobile-link">Bookings</Link>

            {!session?.user && (
              <button
                onClick={() => setOpen(true)}
                className="w-full text-left px-3 py-2 rounded-md bg-gradient-to-r from-indigo-600 to-pink-500 text-white"
              >
                Login / Signup
              </button>
            )}

            {session?.user && (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left px-3 py-2 rounded-md bg-red-600 text-white"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
