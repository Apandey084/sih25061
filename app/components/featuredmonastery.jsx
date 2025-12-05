"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Featuredmonastery() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const res = await fetch("/api/vr-tours", { cache: "no-store" });
        const data = await res.json();

        let parsed = [];

        // 🔥 Robustly detect return shape:
        if (Array.isArray(data)) {
          parsed = data;
        } else if (Array.isArray(data?.tours)) {
          parsed = data.tours;
        } else if (data?.ok && Array.isArray(data?.tours)) {
          parsed = data.tours;
        } else {
          console.warn("Unexpected API format:", data);
        }

        setTours(parsed);
      } catch (e) {
        console.error("Failed to fetch tours:", e);
        setErr("Failed to load tours");
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-xl">
        Loading tours…
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400 text-lg">
        {err}
      </div>
    );
  }

  return (
    <div className="min-h-screen  text-white p-10">
      <h1 className="text-4xl font-bold mb-8 text-center">
        🎧 Featured Monasteries
      </h1>

      {tours.length === 0 ? (
        <div className="text-center text-gray-400">No tours available</div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tours.map((tour, index) => {
            const img =
              tour?.monastery?.image ||
              tour?.rooms?.[0]?.imageUrl ||
              "/placeholder.jpg";

            return (
              <motion.div
                key={tour._id ?? tour.id ?? index}
                className="cursor-pointer bg-gray-800 p-4 rounded-2xl shadow hover:shadow-lg hover:bg-gray-700 transition"
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  if (!tour?._id) return;
                  router.push(`/viewer/${tour._id}`);
                }}
              >
                <img
                  src={img}
                  alt={tour?.title || "Monastery Tour"}
                  onError={(e) => (e.target.src = "/placeholder.jpg")}
                  className="rounded-xl w-full h-48 object-cover mb-3"
                />

                <h2 className="text-xl font-semibold">
                  {tour?.title || "Untitled Tour"}
                </h2>

                <p className="text-sm text-gray-400 line-clamp-2">
                  {tour?.description || "Explore this monastery tour"}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
