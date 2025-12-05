// app/components/MonasteryForm.jsx
"use client";

import React, { useEffect, useState } from "react";

export default function MonasteryForm({ existing = null, onSaved = null }) {
  // existing may be null or a plain object { _id, name, location, description, image, images: [], lat, lng }
  const [name, setName] = useState(existing?.name || "");
  const [location, setLocation] = useState(existing?.location || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [primaryFile, setPrimaryFile] = useState(null); // File for primary image
  const [imagesFiles, setImagesFiles] = useState([]); // additional File[]
  const [previewPrimary, setPreviewPrimary] = useState(existing?.image || null);
  const [previewImages, setPreviewImages] = useState(existing?.images || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // cleanup object URLs on unmount
    return () => {
      previewImages.forEach((p) => {
        if (p && p.startsWith("blob:")) URL.revokeObjectURL(p);
      });
      if (previewPrimary && previewPrimary.startsWith("blob:")) URL.revokeObjectURL(previewPrimary);
    };
  }, []);

  const handlePrimaryChange = (e) => {
    const f = e.target.files?.[0] || null;
    setPrimaryFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewPrimary(url);
    } else {
      setPreviewPrimary(existing?.image || null);
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setImagesFiles(files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewImages(urls);
  };

  const removePreviewImage = (idx) => {
    const newFiles = imagesFiles.slice();
    newFiles.splice(idx, 1);
    setImagesFiles(newFiles);

    const newPreviews = previewImages.slice();
    const removed = newPreviews.splice(idx, 1);
    // revoke object url if needed
    removed.forEach((p) => p && p.startsWith("blob:") && URL.revokeObjectURL(p));
    setPreviewImages(newPreviews);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !location.trim()) {
      setError("Please provide name and location.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("location", location.trim());
      fd.append("description", description || "");

      // If editing, include id so server PUT can accept either id in payload or query param
      if (existing?. _id) fd.append("id", existing._id);

      // Primary file (optional); field name "image"
      if (primaryFile) fd.append("image", primaryFile);

      // Add additional images as "images" (multiple). If you want "images[]" naming, server handles both.
      imagesFiles.forEach((f) => fd.append("images", f));

      // Decide endpoint + method: if editing (existing._id) use PUT and include ?id= or include id in body
      const url = existing? `/api/monasteries?id=${existing._id}` : "/api/monasteries";
      const method = existing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: fd,
        // IMPORTANT: do NOT set Content-Type header — the browser will set the multipart boundary
      });

      const data = await res.json().catch(() => ({ ok: false, error: "Invalid JSON response" }));
      if (!res.ok || !data.ok) {
        const errMsg = data?.error || data?.detail || `Request failed (${res.status})`;
        throw new Error(errMsg);
      }

      // success
      alert(existing ? "Monastery updated ✅" : "Monastery created ✅");
      // optional: call back to parent to refresh list/page
      if (typeof onSaved === "function") onSaved(data.monastery || data);
      // reset fields if it was a create
      if (!existing) {
        setName("");
        setLocation("");
        setDescription("");
        setPrimaryFile(null);
        setImagesFiles([]);
        setPreviewPrimary(null);
        setPreviewImages([]);
      }
    } catch (err) {
      console.error("MonasteryForm error:", err);
      setError(err.message || "Failed to save monastery");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submitForm} className="space-y-4 max-w-2xl">
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div>
        <label className="block font-medium">Name *</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded mt-1"
          placeholder="Monastery name"
        />
      </div>

      <div>
        <label className="block font-medium">Location (address) *</label>
        <input
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full border p-2 rounded mt-1"
          placeholder="City, state, country or full address"
        />
      </div>

      <div>
        <label className="block font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full border p-2 rounded mt-1"
          placeholder="Optional description"
        />
      </div>

      <div>
        <label className="block font-medium">Primary Image (optional)</label>
        <input type="file" accept="image/*" onChange={handlePrimaryChange} />
        {previewPrimary && (
          <div className="mt-2">
            <img src={previewPrimary} alt="preview" className="h-28 rounded object-cover" />
          </div>
        )}
      </div>

      <div>
        <label className="block font-medium">Additional Images (optional)</label>
        <input type="file" accept="image/*" multiple onChange={handleImagesChange} />
        {previewImages && previewImages.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {previewImages.map((p, i) => (
              <div key={i} className="relative">
                <img src={p} alt={`preview ${i}`} className="h-20 w-28 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => removePreviewImage(i)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Saving..." : existing ? "Save changes" : "Create monastery"}
        </button>
      </div>
    </form>
  );
}
