// "use client";

// import { useState } from "react";
// import { uploadToCloudinary } from "@/lib/uploadClient";

// export default function MonasteryForm({ existing, onSuccess }) {
//   const [form, setForm] = useState(
//     existing || { name: "", location: "", description: "", image: "" }
//   );
//   const [preview, setPreview] = useState(existing?.image || "");
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleFileChange = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setPreview(URL.createObjectURL(file)); // show temporary preview
//     try {
//       setLoading(true);
//       const imageUrl = await uploadToCloudinary(file);
//       setForm((prev) => ({ ...prev, image: imageUrl }));
//     } catch (err) {
//       console.error("Upload error:", err);
//       alert("Image upload failed!");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!form.name || !form.location || !form.image) {
//       alert("Please fill all fields and upload an image");
//       return;
//     }

//     const method = form._id ? "PUT" : "POST";

//     const res = await fetch("/api/monasteries", {
//       method,
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(form),
//     });

//     if (res.ok) {
//       alert(form._id ? "Monastery updated" : "Monastery added");
//       onSuccess && onSuccess();
//       setForm({ name: "", location: "", description: "", image: "" });
//       setPreview("");
//     } else {
//       console.error("Error saving:", await res.text());
//       alert("Failed to save monastery");
//     }
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="flex flex-col gap-4 max-w-md bg-white p-6 rounded-2xl shadow"
//     >
//       <input
//         name="name"
//         placeholder="Name"
//         value={form.name}
//         onChange={handleChange}
//         className="border p-2 rounded"
//       />
//       <input
//         name="location"
//         placeholder="Location"
//         value={form.location}
//         onChange={handleChange}
//         className="border p-2 rounded"
//       />
//       <textarea
//         name="description"
//         placeholder="Description"
//         value={form.description}
//         onChange={handleChange}
//         className="border p-2 rounded"
//       />
//       <input
//         type="file"
//         accept="image/*"
//         onChange={handleFileChange}
//         className="border p-2 rounded"
//       />

//       {preview && (
//         <img
//           src={preview}
//           alt="Preview"
//           className="w-full h-48 object-cover rounded-lg"
//         />
//       )}

//       <button
//         type="submit"
//         disabled={loading}
//         className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
//       >
//         {loading
//           ? "Uploading..."
//           : form._id
//           ? "Update Monastery"
//           : "Add Monastery"}
//       </button>
//     </form>
//   );
// }


// app/admin/monasteries/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminMonasteriesPage() {
  const router = useRouter();
  const [monasteries, setMonasteries] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch monasteries from API
  async function fetchMonasteries() {
    try {
      const res = await fetch("/api/monasteries", { cache: "no-store" });
      const data = await res.json();
      setMonasteries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to fetch monasteries");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMonasteries();
  }, []);

  // ✅ Delete monastery
  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this monastery?")) return;
    try {
      const res = await fetch("/api/monasteries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      alert("Monastery deleted successfully");
      fetchMonasteries(); // refresh list
    } catch (err) {
      console.error("Delete error:", err);
      alert("Delete failed: " + err.message);
    }
  }

  if (loading)
    return <div className="p-6 text-center text-gray-600">Loading monasteries...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Monasteries Management</h1>
        <button
          onClick={() => router.push("/admin/monasteries/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add New
        </button>
      </div>

      {monasteries.length === 0 ? (
        <p className="text-gray-500">No monasteries found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {monasteries.map((m) => (
            <div
              key={m._id}
              className="border rounded-lg p-4 bg-white shadow-sm flex flex-col"
            >
              {/* ✅ Image Preview */}
              {m.image ? (
                <img
                  src={m.image}
                  alt={m.name}
                  className="w-full h-40 object-cover rounded-md mb-3"
                />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded mb-3">
                  No Image
                </div>
              )}

              {/* ✅ Content */}
              <h2 className="text-lg font-semibold">{m.name}</h2>
              <p className="text-gray-500 text-sm mb-1">{m.location}</p>
              <p className="text-gray-600 text-sm line-clamp-2">
                {m.description || "No description"}
              </p>

              {/* ✅ Actions */}
              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => router.push(`/admin/monasteries/${m._id}`)}
                  className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(m._id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
