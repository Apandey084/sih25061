// app/api/upload/route.js
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

export const runtime = "nodejs";

function cloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

if (cloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function bufferToStream(buffer) {
  const readable = new Readable();
  // _read is required for older node stream consumers
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
}

async function uploadBufferToCloudinary(buffer, opts = {}) {
  if (!cloudinaryConfigured()) throw new Error("Cloudinary not configured.");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(opts, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
    const rs = bufferToStream(buffer);
    rs.pipe(stream);
  });
}

export async function POST(req) {
  try {
    if (!cloudinaryConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Cloudinary not configured. Set CLOUDINARY_* env vars." },
        { status: 500 }
      );
    }

    const contentType = (req.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ ok: false, error: "Expected multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    // Accept file field "file" or "image"
    const file = form.get("file") || form.get("image");
    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    const ab = await file.arrayBuffer();
    const buffer = Buffer.from(ab);
    console.log("[UPLOAD] size", buffer.length);

    const uploaded = await uploadBufferToCloudinary(buffer, {
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "monastery360",
      resource_type: "image",
      quality: "auto",
      fetch_format: "auto",
    });

    if (!uploaded || !(uploaded.secure_url || uploaded.url)) {
      throw new Error("Cloudinary returned no URL");
    }

    const url = uploaded.secure_url || uploaded.url;
    return NextResponse.json({ ok: true, url, raw: uploaded });
  } catch (err) {
    console.error("POST /api/upload error:", err);
    return NextResponse.json({ ok: false, error: "Upload failed", detail: String(err) }, { status: 500 });
  }
}
