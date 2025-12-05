"use client";

import { useState, useEffect } from "react";

export default function NewVRTourPage() {
  const [monasteries, setMonasteries] = useState([]);
  const [selectedMonastery, setSelectedMonastery] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rooms, setRooms] = useState([{ title: "", imageFile: null, audioFile: null }]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch monasteries
  useEffect(() => {
    async function fetchMonasteries() {
      try {
        const res = await fetch("/api/monasteries");
        const data = await res.json();
        setMonasteries(data || []);
      } catch (err) {
        console.error("Error fetching monasteries:", err);
      }
    }
    fetchMonasteries();
  }, []);

  const handleRoomChange = (index, field, value) => {
    const updated = [...rooms];
    updated[index][field] = value;
    setRooms(updated);
  };

  const addRoom = () => {
    setRooms([...rooms, { title: "", imageFile: null, audioFile: null }]);
  };

  // ✅ NEW: Delete room handler
  const deleteRoom = (index) => {
    const updated = rooms.filter((_, i) => i !== index);
    setRooms(updated.length ? updated : [{ title: "", imageFile: null, audioFile: null }]);
  };

  const uploadToCloudinary = async (file, resourceType = "image") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) throw new Error("❌ Cloudinary cloud name missing in .env");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Cloudinary upload failed");
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMonastery || !title.trim()) {
      alert("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      const uploadedRooms = await Promise.all(
        rooms.map(async (room) => {
          if (!room.imageFile || !room.audioFile) throw new Error("Each room needs image & audio");
          const imageUrl = await uploadToCloudinary(room.imageFile, "image");
          const audioUrl = await uploadToCloudinary(room.audioFile, "video");
          return { title: room.title, imageUrl, audioUrl };
        })
      );

      const res = await fetch("/api/vr-tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monastery: selectedMonastery,
          title,
          description,
          rooms: uploadedRooms,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create VR Tour");

      alert("✅ VR Tour created successfully!");

      // ✅ Reset all fields after successful creation
      setSelectedMonastery("");
      setTitle("");
      setDescription("");
      setRooms([{ title: "", imageFile: null, audioFile: null }]);
    } catch (error) {
      console.error("❌", error);
      alert(error.message || "Error creating VR tour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New VR Tour</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Monastery dropdown */}
        <div>
          <label className="block text-gray-700">Select Monastery</label>
          <select
            value={selectedMonastery}
            onChange={(e) => setSelectedMonastery(e.target.value)}
            className="w-full border p-2 rounded mt-1"
            required
          >
            <option value="">-- Choose Monastery --</option>
            {monasteries.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tour Title */}
        <div>
          <label className="block text-gray-700">Tour Title</label>
          <input
            type="text"
            placeholder="Enter tour title"
            className="w-full border p-2 rounded mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-700">Description</label>
          <textarea
            placeholder="Enter tour description"
            className="w-full border p-2 rounded mt-1"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        {/* Rooms */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Rooms</h2>
          {rooms.map((room, index) => (
            <div key={index} className="border p-4 rounded mb-4  relative">
              <h3 className="font-medium mb-2">Room {index + 1}</h3>

              {/* ✅ Delete Room Button */}
              <button
                type="button"
                onClick={() => deleteRoom(index)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm font-semibold"
              >
                ✕ Delete
              </button>

              <input
                type="text"
                placeholder="Room title"
                className="w-full border p-2 rounded mb-2"
                value={room.title}
                onChange={(e) => handleRoomChange(index, "title", e.target.value)}
                required
              />

              <label className="block text-sm text-gray-700 mb-1">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleRoomChange(index, "imageFile", e.target.files[0])}
                required
              />

              <label className="block text-sm text-gray-700 mt-2 mb-1">Audio</label>
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={(e) => handleRoomChange(index, "audioFile", e.target.files[0])}
                required
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addRoom}
            className="bg-amber-300 text-black hover:bg-gray-300 text-sm px-3 py-1 rounded"
          >
            + Add Room
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Uploading..." : "Create Tour"}
        </button>
      </form>
    </div>
  );
}
