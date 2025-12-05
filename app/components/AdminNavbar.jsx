"use client";

import Link from "next/link";

export default function AdminNavbar() {
  return (
    <header className="flex justify-between items-center px-6 py-3 bg-white shadow">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      <nav className="space-x-4">
        <Link href="/admin/monasteries" className="hover:underline">
          Monasteries
        </Link>
        <Link href="/admin/users" className="hover:underline">
          Users
        </Link>
            <Link href="/admin/events" className="hover:underline">
          Events
        </Link>
         <Link href="/admin/vr-tours/new" className="hover:underline">
          Events
        </Link>
        <Link href="/" className="hover:underline text-red-500">
          Logout
        </Link>
      </nav>
    </header>
  );
}
