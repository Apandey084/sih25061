"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/monasteries", label: "Monasteries" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/events", label: "Events" },
        { href: "/admin/vr-tours/new", label: "VR-Tour" },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white h-screen flex flex-col">
      <div className="text-2xl font-bold p-4 border-b border-gray-700">
        Monastery360
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`block px-4 py-2 rounded-md ${
              pathname === href
                ? "bg-gray-700 font-semibold"
                : "hover:bg-gray-700"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
