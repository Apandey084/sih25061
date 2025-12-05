// app/admin/vr-tours/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminVRToursPage() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchTours() {
      try {
        const res = await fetch("/api/vr-tours");
        const data = await res.json();
        setTours(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching VR tours:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTours();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this VR tour?")) return;
    try {
      const res = await fetch(`/api/vr-tours?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setTours((prev) => prev.filter((t) => t._id !== id));
      alert("✅ VR tour deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("❌ Failed to delete tour");
    }
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-600">Loading tours...</p>;

  if (!tours.length)
    return <p className="text-center mt-10 text-gray-600">No VR tours found.</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">VR Tours Management</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour) => (
          <div
            key={tour._id}
            className="bg-white shadow-md rounded-xl p-5 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold">{tour.title}</h2>
              <p className="text-sm text-gray-500">
                Monastery: {tour.monastery?.name || "—"}
              </p>
              <p className="text-sm text-gray-500">
                Rooms: {tour.rooms?.length || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(tour.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => router.push(`/viewer/${tour._id}`)}
                className="flex-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
              >
                View
              </button>
              <button
                onClick={() => router.push(`/admin/vr-tours/${tour._id}/edit`)}
                className="flex-1 bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(tour._id)}
                className="flex-1 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
