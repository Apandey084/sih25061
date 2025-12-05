// app/components/  .jsx
"use client";

import React, { useEffect, useState } from "react";

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [form, setForm] = useState({ id: null, title: "", date: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchPage = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?page=${p}&limit=${limit}`);
      const data = await res.json();
      const list = Array.isArray(data?.events) ? data.events : [];
      setEvents(list);
      setTotal(data?.total ?? list.length);
      setPage(data?.page ?? p);
    } catch (e) {
      console.error(e);
      setErr("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const resetForm = () => setForm({ id: null, title: "", date: "", description: "" });

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErr(null);
    if (!form.title || !form.date) return setErr("Title and date are required");
    setSaving(true);

    try {
      const payload = { title: form.title, date: form.date, description: form.description };
      let res;
      if (form.id) {
        res = await fetch("/api/events", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: form.id, ...payload }) });
      } else {
        res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || "Save failed");

      // refresh list
      await fetchPage(page);
      resetForm();
    } catch (err) {
      console.error(err);
      setErr(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ev) => {
    setForm({ id: ev._id ?? ev.id, title: ev.title || "", date: ev.date ? new Date(ev.date).toISOString().slice(0, 16) : "", description: ev.description || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this event?")) return;
    try {
      const res = await fetch("/api/events", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      // reload current page
      fetchPage(page);
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Manage Upcoming Events</h2>

      <form onSubmit={handleSubmit} className=" p-4 rounded shadow space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title *</label>
          <input value={form.title} onChange={(e) => handleChange("title", e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date & time *</label>
          <input type="datetime-local" value={form.date} onChange={(e) => handleChange("date", e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" rows={4} />
        </div>

        <div className="flex gap-2">
          <button disabled={saving} type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">
            {saving ? "Saving…" : form.id ? "Update Event" : "Create Event"}
          </button>
          <button type="button" onClick={resetForm} className="px-4 py-2 border rounded">Reset</button>
        </div>

        {err && <div className="text-sm text-red-500 mt-2">{err}</div>}
      </form>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Events</h3>

        {loading ? (
          <div>Loading…</div>
        ) : events.length === 0 ? (
          <div className="text-gray-500">No events</div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => (
              <div key={ev._id ?? ev.id} className="p-3 bg-violet-50 text-black rounded shadow flex justify-between items-start">
                <div>
                  <div className="font-semibold">{ev.title}</div>
                  <div className="text-sm text-gray-600">{new Date(ev.date).toLocaleString()}</div>
                  <div className="text-sm mt-1 text-gray-700">{ev.description}</div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button onClick={() => handleEdit(ev)} className="text-sm px-3 py-1 text-black border rounded">Edit</button>
                  <button onClick={() => handleDelete(ev._id ?? ev.id)} className="text-sm px-3 py-1 bg-red-500 text-white rounded">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => fetchPage(page - 1)} className="px-3 py-1 border rounded">Prev</button>
          <div className="text-sm">Page {page} — {total} total</div>
          <button onClick={() => fetchPage(page + 1)} className="px-3 py-1 border rounded">Next</button>
        </div>
      </div>
    </div>
  );
}
