"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditVRTourPage() {
  const { id } = useParams();
  const router = useRouter();

  const [tour, setTour] = useState(null);
  const [monasteries, setMonasteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // ✅ Fixed: use ?id=${id} instead of /${id}
        const [tourRes, monRes] = await Promise.all([
          fetch(`/api/vr-tours?id=${id}`),
          fetch("/api/monasteries"),
        ]);

        if (!tourRes.ok) {
          throw new Error(`Tour fetch failed (${tourRes.status})`);
        }
        if (!monRes.ok) {
          throw new Error(`Monastery fetch failed (${monRes.status})`);
        }

        const tourData = await tourRes.json();
        const monData = await monRes.json();

        setTour(tourData);
        setMonasteries(monData);
      } catch (error) {
        console.error("❌ Failed to load data:", error);
        alert("Failed to load VR tour data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleRoomChange = (idx, field, value) => {
    const updated = [...tour.rooms];
    updated[idx][field] = value;
    setTour({ ...tour, rooms: updated });
  };

  const deleteRoom = (idx) => {
    setTour({ ...tour, rooms: tour.rooms.filter((_, i) => i !== idx) });
  };

  const addRoom = () => {
    setTour({
      ...tour,
      rooms: [...tour.rooms, { title: "", imageUrl: "", audioUrl: "" }],
    });
  };

  const uploadToCloudinary = async (file, type = "image") => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${type}/upload`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message);
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedRooms = await Promise.all(
        tour.rooms.map(async (room) => {
          let imageUrl = room.imageUrl;
          let audioUrl = room.audioUrl;
          if (room.imageFile) imageUrl = await uploadToCloudinary(room.imageFile, "image");
          if (room.audioFile) audioUrl = await uploadToCloudinary(room.audioFile, "video");
          return { title: room.title, imageUrl, audioUrl };
        })
      );

      const res = await fetch(`/api/vr-tours?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tour.title,
          description: tour.description,
          monastery: tour.monastery?._id || tour.monastery,
          rooms: updatedRooms,
        }),
      });

      if (!res.ok) throw new Error("Failed to update tour");
      alert("✅ VR Tour updated successfully!");
      router.push("/admin/vr-tours");
    } catch (err) {
      console.error("❌ Error saving tour:", err);
      alert("Error updating tour: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!tour) return <p className="p-6">Tour not found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit VR Tour</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Monastery Dropdown */}
        <div>
          <label className="block font-medium">Select Monastery</label>
          <select
            value={tour.monastery?._id || tour.monastery || ""}
            onChange={(e) => setTour({ ...tour, monastery: e.target.value })}
            className="w-full border p-2 rounded mt-1"
          >
            <option value="">-- None --</option>
            {monasteries.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block font-medium">Tour Title</label>
          <input
            type="text"
            value={tour.title}
            onChange={(e) => setTour({ ...tour, title: e.target.value })}
            className="w-full border p-2 rounded mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium">Description</label>
          <textarea
            value={tour.description}
            onChange={(e) => setTour({ ...tour, description: e.target.value })}
            className="w-full border p-2 rounded mt-1"
            rows={3}
          />
        </div>

        {/* Rooms */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Rooms</h2>
          {tour.rooms.map((room, i) => (
            <div key={i} className="border p-4 rounded mb-4 bg-gray-50 space-y-2">
              <input
                type="text"
                value={room.title}
                placeholder="Room title"
                onChange={(e) => handleRoomChange(i, "title", e.target.value)}
                className="w-full border p-2 rounded"
              />
              <div>
                <label className="block text-sm font-medium">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleRoomChange(i, "imageFile", e.target.files[0])}
                />
                {room.imageUrl && (
                  <img
                    src={room.imageUrl}
                    alt=""
                    className="mt-2 h-24 rounded object-cover"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium">Audio</label>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => handleRoomChange(i, "audioFile", e.target.files[0])}
                />
                {room.audioUrl && (
                  <audio controls className="mt-2 w-full">
                    <source src={room.audioUrl} />
                  </audio>
                )}
              </div>

              <button
                type="button"
                onClick={() => deleteRoom(i)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
              >
                Delete Room
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addRoom}
            className="bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded"
          >
            + Add Room
          </button>
        </div>

        {/* Save */}
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
