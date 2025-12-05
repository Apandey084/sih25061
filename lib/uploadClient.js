// // lib/uploadClient.js

// export async function uploadToCloudinary(file) {
//   const formData = new FormData();
//   formData.append("file", file);

//   const res = await fetch("/api/upload", {
//     method: "POST",
//     body: formData,
//   });

//   if (!res.ok) throw new Error("Upload failed");
//   const data = await res.json();
//   return data.url; // ✅ Return Cloudinary secure URL
// }

// lib/uploadClient.js
export async function uploadToCloudinary(file) {
  if (!file) throw new Error("No file provided");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error("Upload failed: " + txt);
  }

  const data = await res.json();
  // adapt depending on your upload route response (data.url or data.secure_url)
  return data.url || data.secure_url || data;
}

