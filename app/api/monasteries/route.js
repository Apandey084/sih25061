// app/api/monasteries/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Monastery from "@/lib/models/Monastery";
import mongoose from "mongoose";
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
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
}

async function uploadBufferToCloudinary(buffer, folder = "monastery360", resource_type = "image") {
  if (!cloudinaryConfigured()) throw new Error("Cloudinary not configured");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type, quality: "auto", fetch_format: "auto" },
      (err, res) => {
        if (err) return reject(err);
        resolve(res);
      }
    );
    const rs = bufferToStream(buffer);
    rs.pipe(stream);
  });
}

async function geocodeLocation(address) {
  if (!address) return null;
  try {
    // Nominatim public API — keep polite User-Agent and small rate.
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, { headers: { "User-Agent": "Monastery360/1.0 (+https://yourdomain.example)" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data[0]) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  } catch (err) {
    console.warn("Geocode failed:", err);
    return null;
  }
}

async function parseRequest(req) {
  const contentType = (req.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    // gather string fields
    const fields = {};
    for (const [k, v] of form.entries()) {
      if (typeof v === "string") fields[k] = v;
    }
    return { type: "form", fields, form };
  } else {
    try {
      const json = await req.json();
      return { type: "json", json };
    } catch {
      return { type: "none" };
    }
  }
}

function isValidId(id) {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

/* ----------------- POST (create) ----------------- */
export async function POST(req) {
  try {
    await connectDB();
    const parsed = await parseRequest(req);
    let payload = {};
    let uploadedImages = [];

    if (parsed.type === "json") {
      payload = parsed.json;
      // if payload.images is provided, keep it
      if (!payload.images && payload.image) payload.images = [payload.image];
    } else if (parsed.type === "form") {
      payload = parsed.fields || {};
      const form = parsed.form;

      // Support multiple files named "images" or "images[]"
      const imageFiles = form.getAll("images").concat(form.getAll("images[]"));
      // Also accept single file field "image" or "file"
      const single = form.get("image") || form.get("file");
      if (single && typeof single !== "string") imageFiles.push(single);

      // Clean up falsy values, and upload each file
      if (imageFiles.length) {
        if (!cloudinaryConfigured()) {
          return NextResponse.json({ ok: false, error: "Cloudinary not configured - cannot accept files" }, { status: 500 });
        }
        for (const f of imageFiles) {
          if (!f || typeof f === "string") continue;
          const ab = await f.arrayBuffer();
          const buffer = Buffer.from(ab);
          const uploaded = await uploadBufferToCloudinary(buffer, process.env.CLOUDINARY_UPLOAD_FOLDER || "monastery360", "image");
          if (uploaded && (uploaded.secure_url || uploaded.url)) {
            uploadedImages.push(uploaded.secure_url || uploaded.url);
          }
        }
      }

      // If client provided a textual "images" field (e.g. JSON string), keep it
      if (payload.images && typeof payload.images === "string") {
        try {
          const parsedArr = JSON.parse(payload.images);
          if (Array.isArray(parsedArr)) payload.images = parsedArr;
        } catch {
          // keep string as is
        }
      }
    } else {
      return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
    }

    // Merge uploadedImages into payload.images
    payload.images = Array.isArray(payload.images) ? payload.images.concat(uploadedImages) : uploadedImages.slice();

    // Prefer explicit image field (first image) — normalize
    if (!payload.image && Array.isArray(payload.images) && payload.images.length) {
      payload.image = payload.images[0];
    }

    // Required fields
    if (!payload.name || !payload.location) {
      return NextResponse.json({ ok: false, error: "Missing required fields: name and location" }, { status: 400 });
    }

    // Geocode server-side (best-effort)
    const geo = await geocodeLocation(payload.location).catch(() => null);
    const toCreate = {
      name: String(payload.name).trim(),
      location: String(payload.location).trim(),
      description: payload.description ? String(payload.description) : "",
      image: payload.image ? String(payload.image) : undefined,
      images: Array.isArray(payload.images) && payload.images.length ? payload.images.map(String) : undefined,
      lat: geo ? Number(geo.lat) : undefined,
      lng: geo ? Number(geo.lng) : undefined,
    };

    // Remove undefined keys to let mongoose fill defaults
    Object.keys(toCreate).forEach((k) => toCreate[k] === undefined && delete toCreate[k]);

    console.log("[MONASTERY POST] creating:", toCreate);
    const monastery = await Monastery.create(toCreate);
    return NextResponse.json({ ok: true, monastery: monastery.toObject(), geocode: geo || null }, { status: 201 });
  } catch (err) {
    console.error("POST /api/monasteries error:", err);
    return NextResponse.json({ ok: false, error: "Failed to create monastery", detail: String(err) }, { status: 500 });
  }
}

/* ----------------- PUT (update) ----------------- */
export async function PUT(req) {
  try {
    await connectDB();
    const parsed = await parseRequest(req);
    let payload = {};
    let uploadedImages = [];

    if (parsed.type === "json") {
      payload = parsed.json;
    } else if (parsed.type === "form") {
      payload = parsed.fields || {};
      const form = parsed.form;

      // upload any new image files
      const imageFiles = form.getAll("images").concat(form.getAll("images[]"));
      const single = form.get("image") || form.get("file");
      if (single && typeof single !== "string") imageFiles.push(single);

      if (imageFiles.length) {
        if (!cloudinaryConfigured()) {
          return NextResponse.json({ ok: false, error: "Cloudinary not configured - cannot accept files" }, { status: 500 });
        }
        for (const f of imageFiles) {
          if (!f || typeof f === "string") continue;
          const ab = await f.arrayBuffer();
          const buffer = Buffer.from(ab);
          const uploaded = await uploadBufferToCloudinary(buffer, process.env.CLOUDINARY_UPLOAD_FOLDER || "monastery360", "image");
          if (uploaded && (uploaded.secure_url || uploaded.url)) uploadedImages.push(uploaded.secure_url || uploaded.url);
        }
      }
      // If textual images field present (JSON string)
      if (payload.images && typeof payload.images === "string") {
        try {
          const parsedArr = JSON.parse(payload.images);
          if (Array.isArray(parsedArr)) payload.images = parsedArr;
        } catch {
          // ignore
        }
      }
    } else {
      return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
    }

    // Determine ID (payload.id or ?id=)
    const url = new URL(req.url);
    const qid = url.searchParams.get("id");
    const id = (payload && payload.id) || qid;
    if (!id || !isValidId(String(id))) return NextResponse.json({ ok: false, error: "Missing or invalid id" }, { status: 400 });

    // Get existing doc (so we can merge images array)
    const existing = await Monastery.findById(id).lean();
    if (!existing) return NextResponse.json({ ok: false, error: "Monastery not found" }, { status: 404 });

    const update = {};
    if (payload.name) update.name = String(payload.name).trim();
    if (payload.location) update.location = String(payload.location).trim();
    if (payload.description !== undefined) update.description = String(payload.description);
    // Merge images arrays: existing.images + payload.images + uploadedImages
    const newImages = [
      ...(Array.isArray(existing.images) ? existing.images.map(String) : existing.image ? [String(existing.image)] : []),
      ...(Array.isArray(payload.images) ? payload.images.map(String) : payload.image ? [String(payload.image)] : []),
      ...uploadedImages,
    ];
    if (newImages.length) {
      update.images = Array.from(new Set(newImages)); // dedupe
      update.image = update.images[0]; // primary image
    } else if (payload.image) {
      update.image = String(payload.image);
      update.images = [update.image];
    }

    if (payload.location) {
      const geo = await geocodeLocation(payload.location).catch(() => null);
      if (geo) {
        update.lat = geo.lat;
        update.lng = geo.lng;
      }
    }

    update.updatedAt = new Date();

    const updated = await Monastery.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return NextResponse.json({ ok: false, error: "Monastery not found" }, { status: 404 });

    return NextResponse.json({ ok: true, monastery: updated.toObject() });
  } catch (err) {
    console.error("PUT /api/monasteries error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update monastery", detail: String(err) }, { status: 500 });
  }
}

/* ----------------- GET (list or single) ----------------- */
export async function GET(req) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (id) {
      if (!isValidId(id)) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
      const doc = await Monastery.findById(id).lean();
      if (!doc) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
      return NextResponse.json(doc);
    }
    const docs = await Monastery.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(docs);
  } catch (err) {
    console.error("GET /api/monasteries error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch monasteries", detail: String(err) }, { status: 500 });
  }
}

/* ----------------- DELETE ----------------- */
export async function DELETE(req) {
  try {
    await connectDB();
    let body;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const url = new URL(req.url);
    const qid = url.searchParams.get("id");
    const id = (body && body.id) || qid;
    if (!id || !isValidId(id)) return NextResponse.json({ ok: false, error: "Missing or invalid id" }, { status: 400 });
    const deleted = await Monastery.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/monasteries error:", err);
    return NextResponse.json({ ok: false, error: "Delete failed", detail: String(err) }, { status: 500 });
  }
}
