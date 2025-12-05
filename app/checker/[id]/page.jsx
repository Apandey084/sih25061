// app/checker/[id]/page.jsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import CheckerUser from "@/lib/models/CheckerUser";
import mongoose from "mongoose";

export default async function CheckerPage({ params }) {
  // params is available directly in server components
  const id = params?.id;

  // 1) session check
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error("getServerSession error:", err);
  }

  // not signed in
  if (!session) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Unauthorized.</h2>
        <p className="mt-2">Please sign in as a checker to view this page.</p>
        <p className="mt-3">
          <Link href="/checker/signin" className="text-blue-600 hover:underline">
            Sign in as Checker
          </Link>
        </p>
      </div>
    );
  }

  // must be a checker
  const meRole = session.user?.role || "user";
  const meId = session.user?.id || session.user?.sub || null;

  if (meRole !== "checker" && meRole !== "admin") {
    // admins may still view (optional); adjust as needed
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Unauthorized.</h2>
        <p className="mt-2">You must be a checker to view this page.</p>
      </div>
    );
  }

  // If the logged-in user is a checker, they can only view their own page
  if (meRole === "checker" && meId !== id) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Unauthorized for this checker page.</h2>
        <p className="mt-2">You can only view your own checker page.</p>
      </div>
    );
  }

  // 2) load checker details from DB
  try {
    // ensure DB connection
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    const checker = await CheckerUser.findById(id).lean();
    if (!checker) {
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold">Checker not found</h2>
        </div>
      );
    }

    return (
      <div className="p-6 max-w-3xl">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Checker — {checker.name}</h1>
            <p className="text-sm text-gray-600">{checker.email}</p>
            <p className="text-sm mt-2">
              Status:{" "}
              {checker.approved ? (
                <span className="text-green-600 font-semibold">Approved</span>
              ) : (
                <span className="text-yellow-600 font-semibold">Pending</span>
              )}
            </p>
          </div>

          <div className="flex gap-3">
            {/* Button to checker dashboard (if you have a dashboard route) */}
            <Link
              href={`/checker/dashboard`}
              className="inline-block bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
            >
              Dashboard
            </Link>

            {/* Verify Ticket button -> goes to /verify-ticket */}
            <Link
              href="/verify-ticket"
              className="inline-block bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Verify Ticket
            </Link>
          </div>
        </header>

        <section className="mt-6 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Profile</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-gray-500">Name</dt>
              <dd className="font-medium">{checker.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Email</dt>
              <dd className="font-medium">{checker.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Role</dt>
              <dd className="font-medium">{checker.role}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Approved</dt>
              <dd className="font-medium">{checker.approved ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Created At</dt>
              <dd className="font-medium">{new Date(checker.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </section>

        {/* Optionally add more checker tools here */}
      </div>
    );
  } catch (err) {
    console.error("Checker page error:", err);
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Server error</h2>
        <pre className="mt-3 text-sm text-red-600">{String(err?.message || err)}</pre>
      </div>
    );
  }
}
