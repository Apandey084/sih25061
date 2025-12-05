"use client";
import { useState } from "react";
import { uploadToCloudinary } from "@/lib/uploadClient";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus("Please select a file first");
      return;
    }

    setStatus("Uploading...");
    try {
      const res = await uploadToCloudinary(file);
      setUploadedUrl(res.secure_url);
      setStatus("✅ Upload successful");
    } catch (err) {
      setStatus("❌ " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Test Cloudinary Upload</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Upload
        </button>
      </form>

      <p>{status}</p>

      {uploadedUrl && (
        <div className="mt-4">
          <p>Uploaded file:</p>
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            {uploadedUrl}
          </a>
          {uploadedUrl.match(/\.(jpg|jpeg|png|gif)$/i) && (
            <img src={uploadedUrl} alt="Uploaded" className="mt-2 w-64 h-auto rounded shadow" />
          )}
        </div>
      )}
    </div>
  );
}
