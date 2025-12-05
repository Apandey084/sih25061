// app/components/EventsList.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";

export default function EventsList({ initialPage = 1, initialLimit = 6 }) {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const rowRef = useRef(null);

  const fetchPage = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?page=${p}&limit=${limit}`, { cache: "no-store" });
      const data = await res.json();
      const list = Array.isArray(data?.events) ? data.events : [];
      setEvents(list);
      setTotal(data?.total ?? list.length);
      setPage(data?.page ?? p);
    } catch (e) {
      console.error(e);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollByWidth = (dir = 1) => {
    const el = rowRef.current;
    if (!el) return;
    const w = el.clientWidth * 0.8; // scroll by 80% of visible width
    el.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  return (
    <div className="py-6 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Upcoming Events</h2>
        <div className="flex gap-2 items-center">
          <button onClick={() => fetchPage(Math.max(1, page - 1))} className="px-3 py-1 border rounded">Prev</button>
          <div className="text-sm text-gray-600">Page {page} — {total} total</div>
          <button onClick={() => fetchPage(page + 1)} className="px-3 py-1 border rounded">Next</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading events…</div>
      ) : events.length === 0 ? (
        <div className="text-center text-gray-500">No upcoming events</div>
      ) : (
        <div className="relative">
          {/* arrow controls */}
          <button aria-label="scroll left" onClick={() => scrollByWidth(-1)} className="hidden md:inline-flex absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/80 text-black p-2 rounded-full shadow">
            ‹
          </button>
          <button aria-label="scroll right" onClick={() => scrollByWidth(1)} className="hidden md:inline-flex absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/80 text-black p-2 rounded-full shadow">
            ›
          </button>

          {/* row */}
          <div
            ref={rowRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-2 px-2 scrollbar-hide"
            style={{ scrollBehavior: "smooth" }}
          >
            {events.map((ev) => (
              <article
                key={ev._id ?? ev.id}
                className="flex-shrink-0 w-[320px] md:w-[360px] lg:w-[420px] bg-white rounded-lg shadow p-4 snap-start"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{ev.title}</h3>
                  <div className="text-xs text-gray-500">{new Date(ev.date).toLocaleDateString()}</div>
                </div>

                <div className="text-sm text-gray-700 mt-2 line-clamp-3">{ev.description}</div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">{new Date(ev.date).toLocaleString()}</div>
                  <a href={`/events/${ev._id ?? ev.id}`} className="text-sm text-indigo-600 hover:underline">Details →</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
