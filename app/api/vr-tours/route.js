// // app/api/vr-tours/route.js
// import { NextResponse } from "next/server";
// import mongoose from "mongoose";
// import { getToken } from "next-auth/jwt";

// /**
//  * Robust DB connect helper — prefers project's lib/mongodb, falls back to mongoose.connect
//  */
// async function ensureDB() {
//   if (mongoose.connection && mongoose.connection.readyState && mongoose.connection.readyState !== 0) return;
//   try {
//     const dbMod = await import("@/lib/mongodb").catch(() => null);
//     const db = dbMod?.default ?? dbMod;
//     if (typeof db === "function") {
//       await db();
//       return;
//     }
//     if (db && typeof db.connect === "function") {
//       await db.connect();
//       return;
//     }
//     if (db?.clientPromise) {
//       // if project exports clientPromise (mongodb-next)
//       await db.clientPromise;
//       return;
//     }
//   } catch (e) {
//     // ignore and fallback
//   }

//   const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.mongo_uri;
//   if (!uri) throw new Error("Missing MongoDB URI (MONGO_URI / MONGODB_URI / mongo_uri).");
//   await mongoose.connect(uri, { });
// }

// /**
//  * VRTour model (fallback if project doesn't provide one)
//  */
// function getVRTourModel() {
//   try {
//     const mod = require("@/lib/models/VRTour");
//     return mod?.default ?? mod;
//   } catch (e) {
//     const roomSchema = new mongoose.Schema({
//       name: String,
//       title: String,
//       imageUrl: String,
//       audioUrl: String,
//       order: { type: Number, default: 0 },
//       meta: { type: mongoose.Schema.Types.Mixed, default: {} },
//     }, { _id: false });

//     const schema = new mongoose.Schema({
//       title: { type: String, required: true },
//       slug: { type: String, index: true },
//       description: String,
//       rooms: { type: [roomSchema], default: [] },
//       createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
//       published: { type: Boolean, default: true },
//     }, { timestamps: true });

//     return mongoose.models.VRTour || mongoose.model("VRTour", schema);
//   }
// }

// /**
//  * admin guard using next-auth token role
//  */
// async function requireAdmin(req) {
//   const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
//   if (!token || token.role !== "admin") {
//     return NextResponse.json({ error: "Unauthorized - admin required" }, { status: 401 });
//   }
//   return null;
// }

// /**
//  * Normalize rooms array (safety)
//  */
// function normalizeRooms(rooms) {
//   if (!Array.isArray(rooms)) return [];
//   return rooms.map((r, i) => ({
//     name: r.name || r.title || `Room ${i + 1}`,
//     title: r.title || r.name || `Room ${i + 1}`,
//     imageUrl: r.imageUrl || r.image || "",
//     audioUrl: r.audioUrl || r.audio || "",
//     order: typeof r.order === "number" ? r.order : i,
//     meta: r.meta || {},
//   }));
// }

// /* ---------------------- GET ---------------------- */
// /**
//  * GET /api/vr-tours
//  * - ?id=<id> returns single tour
//  * - otherwise returns list (simple pagination: ?page=&limit=)
//  */
// export async function GET(req) {
//   try {
//     await ensureDB();
//     const VRTour = getVRTourModel();

//     const url = new URL(req.url);
//     const id = url.searchParams.get("id");
//     if (id) {
//       if (!mongoose.Types.ObjectId.isValid(id)) {
//         return NextResponse.json({ error: "Invalid id" }, { status: 400 });
//       }
//       const one = await VRTour.findById(id).lean();
//       if (!one) return NextResponse.json({ error: "Not found" }, { status: 404 });
//       return NextResponse.json(one);
//     }

//     // list with pagination & optional q (search)
//     const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
//     const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "25", 10)));
//     const q = (url.searchParams.get("q") || "").trim();

//     const filter = {};
//     if (q) {
//       filter.$or = [
//         { title: { $regex: q, $options: "i" } },
//         { description: { $regex: q, $options: "i" } },
//         { "rooms.name": { $regex: q, $options: "i" } },
//       ];
//     }

//     const total = await VRTour.countDocuments(filter);
//     const items = await VRTour.find(filter)
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .lean();

//     return NextResponse.json({ ok: true, total, page, limit, tours: items });
//   } catch (err) {
//     console.error("GET /api/vr-tours error:", err);
//     return NextResponse.json({ error: "Server error", detail: err?.message || String(err) }, { status: 500 });
//   }
// }

// /* ---------------------- POST ---------------------- */
// /**
//  * POST /api/vr-tours
//  * body: { title, description?, rooms: [{name,title,imageUrl,audioUrl,order}] }
//  * admin only
//  */
// export async function POST(req) {
//   try {
//     // admin guard
//     const denied = await requireAdmin(req);
//     if (denied) return denied;

//     await ensureDB();
//     const VRTour = getVRTourModel();

//     let body;
//     try {
//       body = await req.json();
//     } catch {
//       return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
//     }

//     const { title, description = "", rooms = [] } = body || {};
//     if (!title || typeof title !== "string") return NextResponse.json({ error: "Missing title" }, { status: 400 });

//     const normalizedRooms = normalizeRooms(rooms);

//     const doc = await VRTour.create({
//       title: title.trim(),
//       slug: (title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
//       description: description || "",
//       rooms: normalizedRooms,
//       createdBy: null,
//       published: true,
//     });

//     return NextResponse.json({ ok: true, tour: doc }, { status: 201 });
//   } catch (err) {
//     console.error("POST /api/vr-tours error:", err);
//     return NextResponse.json({ error: "Server error", detail: err?.message || String(err) }, { status: 500 });
//   }
// }

// /* ---------------------- PUT ---------------------- */
// /**
//  * PUT /api/vr-tours
//  * body: { id, title?, description?, rooms? }
//  * admin only
//  */
// export async function PUT(req) {
//   try {
//     const denied = await requireAdmin(req);
//     if (denied) return denied;

//     await ensureDB();
//     const VRTour = getVRTourModel();

//     let body;
//     try {
//       body = await req.json();
//     } catch {
//       return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
//     }

//     const { id, title, description, rooms, published } = body || {};
//     if (!id || !mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });

//     const update = {};
//     if (title) update.title = title;
//     if (description !== undefined) update.description = description;
//     if (typeof published === "boolean") update.published = published;
//     if (rooms) update.rooms = normalizeRooms(rooms);
//     update.updatedAt = new Date();

//     const updated = await VRTour.findByIdAndUpdate(id, update, { new: true }).lean();
//     if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

//     return NextResponse.json({ ok: true, tour: updated });
//   } catch (err) {
//     console.error("PUT /api/vr-tours error:", err);
//     return NextResponse.json({ error: "Server error", detail: err?.message || String(err) }, { status: 500 });
//   }
// }

// /* ---------------------- DELETE ---------------------- */
// /**
//  * DELETE /api/vr-tours
//  * body: { id }
//  * admin only
//  */
// export async function DELETE(req) {
//   try {
//     const denied = await requireAdmin(req);
//     if (denied) return denied;

//     await ensureDB();
//     const VRTour = getVRTourModel();

//     let body;
//     try {
//       body = await req.json();
//     } catch {
//       return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
//     }

//     const { id } = body || {};
//     if (!id || !mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });

//     const deleted = await VRTour.findByIdAndDelete(id).lean();
//     if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

//     return NextResponse.json({ ok: true, deletedId: id });
//   } catch (err) {
//     console.error("DELETE /api/vr-tours error:", err);
//     return NextResponse.json({ error: "Server error", detail: err?.message || String(err) }, { status: 500 });
//   }
// }


// // app/api/vr-tours/route.js
// import { NextResponse } from "next/server";
// import mongoose from "mongoose";
// import { getToken } from "next-auth/jwt";

// /**
//  * Robust DB connect helper — prefers project's lib/mongodb, falls back to mongoose.connect
//  */
// async function ensureDB() {
//   // if already connected (1 = connected)
//   if (mongoose?.connection?.readyState === 1) return;

//   // try project's exported helper (supports a default function or object with connect/clientPromise)
//   try {
//     const dbMod = await import("@/lib/mongodb").catch(() => null);
//     const db = dbMod?.default ?? dbMod;
//     if (typeof db === "function") {
//       await db();
//       return;
//     }
//     if (db && typeof db.connect === "function") {
//       await db.connect();
//       return;
//     }
//     if (db?.clientPromise) {
//       await db.clientPromise;
//       return;
//     }
//   } catch (e) {
//     // ignore and fallback to mongoose.connect
//   }

//   const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.mongo_uri;
//   if (!uri) throw new Error("Missing MongoDB URI (MONGO_URI / MONGODB_URI / mongo_uri).");

//   // use standard mongoose options
//   await mongoose.connect(uri, {
//     // Mongoose 6+ has sensible defaults, but keep common opts for clarity
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   });
// }

// /**
//  * VRTour model (fallback if project doesn't provide one)
//  * NOTE: this is async because we attempt dynamic import for ESM compatibility
//  */
// async function getVRTourModel() {
//   try {
//     // try dynamic import first (ESM)
//     const mod = await import("@/lib/models/VRTour").catch(() => null);
//     const model = mod?.default ?? mod;
//     if (model) return model;
//   } catch (e) {
//     // fall through to fallback schema
//   }

//   // fallback schema (same as your original)
//   const roomSchema = new mongoose.Schema(
//     {
//       name: String,
//       title: String,
//       imageUrl: String,
//       audioUrl: String,
//       order: { type: Number, default: 0 },
//       meta: { type: mongoose.Schema.Types.Mixed, default: {} },
//     },
//     { _id: false }
//   );

//   const schema = new mongoose.Schema(
//     {
//       title: { type: String, required: true },
//       slug: { type: String, index: true },
//       description: String,
//       rooms: { type: [roomSchema], default: [] },
//       createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
//       published: { type: Boolean, default: true },
//     },
//     { timestamps: true }
//   );

//   return mongoose.models.VRTour || mongoose.model("VRTour", schema);
// }

// /**
//  * admin guard using next-auth token role
//  * Returns NextResponse on denial, null on success.
//  */
// async function requireAdmin(req) {
//   // getToken works with the Request object in App Router
//   const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }).catch(() => null);
//   if (!token || token.role !== "admin") {
//     return NextResponse.json({ error: "Unauthorized - admin required" }, { status: 401 });
//   }
//   return null;
// }

// /**
//  * Normalize rooms array (safety)
//  */
// function normalizeRooms(rooms) {
//   if (!Array.isArray(rooms)) return [];
//   return rooms.map((r, i) => ({
//     name: r?.name || r?.title || `Room ${i + 1}`,
//     title: r?.title || r?.name || `Room ${i + 1}`,
//     imageUrl: r?.imageUrl || r?.image || "",
//     audioUrl: r?.audioUrl || r?.audio || "",
//     order: typeof r?.order === "number" ? r.order : i,
//     meta: r?.meta || {},
//   }));
// }

// /* ---------------------- GET ---------------------- */
// /**
//  * GET /api/vr-tours
//  * - ?id=<id> returns single tour
//  * - otherwise returns list (simple pagination: ?page=&limit=)
//  */
// export async function GET(req) {
//   try {
//     await ensureDB();
//     const VRTour = await getVRTourModel();

//     const url = new URL(req.url);
//     const id = url.searchParams.get("id");
//     if (id) {
//       if (!mongoose.Types.ObjectId.isValid(id)) {
//         return NextResponse.json({ error: "Invalid id" }, { status: 400 });
//       }
//       const one = await VRTour.findById(id).lean();
//       if (!one) return NextResponse.json({ error: "Not found" }, { status: 404 });
//       return NextResponse.json(one);
//     }

//     // list with pagination & optional q (search)
//     const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
//     const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "25", 10)));
//     const q = (url.searchParams.get("q") || "").trim();

//     const filter = {};
//     if (q) {
//       filter.$or = [
//         { title: { $regex: q, $options: "i" } },
//         { description: { $regex: q, $options: "i" } },
//         { "rooms.name": { $regex: q, $options: "i" } },
//       ];
//     }

//     const total = await VRTour.countDocuments(filter);
//     const items = await VRTour.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();

//     return NextResponse.json({ ok: true, total, page, limit, tours: items });
//   } catch (err) {
//     console.error("GET /api/vr-tours error:", err);
//     return NextResponse.json({ error: "Server error", detail: err?.message || String(err) }, { status: 500 });
//   }
// }

// /* ---------------------- POST ---------------------- */
// /**
//  * POST /api/vr-tours
//  * body: { title, description?, rooms: [...] }
//  * admin only
//  */
// export async function POST(req) {
//   try {
//     const denied = await requireAdmin(req);
//     if (denied) return denied;

//     await ensureDB();
//     const VRTour = await getVRTourModel();

//     let body;
//     try {
//       body = await req.json();
//     } catch {
//       return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
//     }

//     const { title, description = "", rooms = [] } = body || {};
//     if (!title || typeof title !== "string") return NextResponse.json({ error: "Missing title" }, { status: 400 });

//     const normalizedRooms = normalizeRooms(rooms);

//     const doc = await VRTour.create({
//       title: title.trim(),
//       slug: (title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
//       description: description || "",
//       rooms: normalizedRooms,
//       createdBy: null,
//       published: true,
//     });

//     return NextResponse.json({ ok: true, tour: doc }, { status: 201 });
//   } catch (err) {
//     console.error("POST /api/vr-tours error:", err);
//     return NextResponse.json({ error: "Server error", detail: err?.message || String(err) }, { status: 500 });
//   }
// }

// /* ---------------------- PUT ---------------------- */
// /**
//  * PUT /api/vr-tours
//  * body: { id, title?, description?, rooms? }
//  * admin only
//  */
// export async function PUT(req) {
//   try {
//     const denied = await requireAdmin(req);
//     if (denied) return denied;

//     await ensureDB();
//     const VRTour = await getVRTourModel();

//     let body;
//     try {
//       body = await req.json();
//     } catch {
//       return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
//     }

//     const { id, title, description, rooms, published } = body || {};
//     if (!id || !mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });

//     const update = {};
//     if (title) update.title = title;
//     if (description !== undefined) update.description = description;
//     if (typeof published === "boolean") update.published = published;
//     if (rooms) update.rooms = normalizeRooms(rooms);
//     update.updatedAt = new Date();

//     const updated = await VRTour.findByIdAndUpdate(id, update, { new: true }).lean();
//     if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

//     return NextResponse.json({ ok: true, tour: updated });
//   } catch (err) {
//     console.error("PUT /api/vr-tours error:", err);
//     return NextResponse.json({ error: "Server error", detail: err?.message || String(err) }, { status: 500 });
//   }
// }

// /* ---------------------- DELETE ---------------------- */
// /**
//  * DELETE /api/vr-tours
//  * body: { id }
//  * admin only
//  */
// export async function DELETE(req) {
//   try {
//     const denied = await requireAdmin(req);
//     if (denied) return denied;

//     await ensureDB();
//     const VRTour = await getVRTourModel();

//     let body;
//     try {
//       body = await req.json();
//     } catch {
//       return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
//     }

//     const { id } = body || {};
//     if (!id || !mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });

//     const deleted = await VRTour.findByIdAndDelete(id).lean();
//     if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

//     return NextResponse.json({ ok: true, deletedId: id });
//   } catch (err) {
//     console.error("DELETE /api/vr-tours error:", err);
//     return NextResponse.json({ error: "Server error", detail: err?.message || String(err) }, { status: 500 });
//   }
// }
// // app/api/vr-tours/route.js
// import { NextResponse } from "next/server";
// import connectDB from "@/lib/mongodb";
// import mongoose from "mongoose";

// /**
//  * VRTour model fallback:
//  * If you already have lib/models/VRTour.js, it will be used instead (same model name).
//  * Otherwise we register a simple schema here.
//  */
// function ensureVRTourModel() {
//   if (mongoose.models.VRTour) return mongoose.models.VRTour;

//   const RoomSchema = new mongoose.Schema({
//     title: String,
//     description: String,
//     panoUrl: String, // panorama image URL
//     audioUrl: String, // narration audio (optional)
//     order: Number,
//   }, { _id: false });

//   const VRTourSchema = new mongoose.Schema({
//     title: { type: String, required: true },
//     description: { type: String, default: "" },
//     monastery: { type: mongoose.Schema.Types.ObjectId, ref: "Monastery", default: null },
//     rooms: { type: [RoomSchema], default: [] },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now },
//     // any extra metadata can be added here
//   });

//   VRTourSchema.pre("save", function (next) {
//     this.updatedAt = new Date();
//     next();
//   });

//   return mongoose.models.VRTour || mongoose.model("VRTour", VRTourSchema);
// }

// const VRTour = ensureVRTourModel();

// // helper to safely populate monastery if model is registered
// async function maybePopulateMonastery(docOrDocs) {
//   try {
//     if (!mongoose.models.Monastery) return docOrDocs;
//     // If array
//     if (Array.isArray(docOrDocs)) {
//       return await VRTour.populate(docOrDocs, { path: "monastery", select: "name location image" });
//     } else {
//       return await VRTour.populate(docOrDocs, { path: "monastery", select: "name location image" });
//     }
//   } catch (e) {
//     console.warn("populate failed:", e);
//     return docOrDocs;
//   }
// }

// // validate ObjectId
// function isValidId(id) {
//   return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
// }

// /* ---------- GET: list or single ---------- */
// export async function GET(req) {
//   try {
//     await connectDB();

//     const url = new URL(req.url);
//     const id = url.searchParams.get("id");

//     if (id) {
//       if (!isValidId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
//       let doc = await VRTour.findById(id).lean();
//       if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
//       doc = await maybePopulateMonastery(doc);
//       return NextResponse.json(doc);
//     }

//     // list all (recent first). You can add pagination later with ?page=...&limit=...
//     const docs = await VRTour.find().sort({ createdAt: -1 }).lean();
//     const populated = await maybePopulateMonastery(docs);
//     return NextResponse.json(Array.isArray(populated) ? populated : docs);
//   } catch (err) {
//     console.error("GET /api/vr-tours error:", err);
//     return NextResponse.json({ error: "Failed to fetch VR tours", detail: String(err) }, { status: 500 });
//   }
// }

// /* ---------- POST: create ---------- */
// /**
//  * Expected JSON body:
//  * {
//  *   title: "Tour title",
//  *   description: "optional",
//  *   monastery: "<monasteryId>" (optional),
//  *   rooms: [{ title, description, panoUrl, audioUrl, order }, ...] (optional)
//  * }
//  */
// export async function POST(req) {
//   try {
//     await connectDB();

//     let body;
//     try {
//       body = await req.json();
//     } catch {
//       return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
//     }

//     const { title, description = "", monastery = null, rooms = [] } = body || {};

//     if (!title || typeof title !== "string") {
//       return NextResponse.json({ error: "Missing required field: title" }, { status: 400 });
//     }

//     if (monastery && !isValidId(monastery)) {
//       return NextResponse.json({ error: "Invalid monastery id" }, { status: 400 });
//     }

//     const doc = await VRTour.create({ title, description, monastery: monastery || null, rooms: Array.isArray(rooms) ? rooms : [] });
//     const populated = await maybePopulateMonastery(doc.toObject());
//     return NextResponse.json(populated, { status: 201 });
//   } catch (err) {
//     console.error("POST /api/vr-tours error:", err);
//     return NextResponse.json({ error: "Failed to create VR tour", detail: String(err) }, { status: 500 });
//   }
// }

// /* ---------- PUT: update ---------- */
// /**
//  * Accepts:
//  * - JSON body with { id, ...fields }
//  * - or query ?id=...
//  */
// export async function PUT(req) {
//   try {
//     await connectDB();

//     const url = new URL(req.url);
//     const queryId = url.searchParams.get("id");

//     let body;
//     try {
//       body = await req.json();
//     } catch {
//       body = null;
//     }

//     const id = (body && body.id) || queryId;
//     if (!id) return NextResponse.json({ error: "Missing id (provide id in body or ?id=)" }, { status: 400 });
//     if (!isValidId(id)) return NextResponse.json({ error: "Invalid id format" }, { status: 400 });

//     const update = { ...body };
//     delete update.id;

//     if (update.monastery && !isValidId(update.monastery)) {
//       return NextResponse.json({ error: "Invalid monastery id" }, { status: 400 });
//     }

//     // ensure rooms is array if provided
//     if (update.rooms && !Array.isArray(update.rooms)) {
//       update.rooms = [];
//     }

//     update.updatedAt = new Date();

//     const updated = await VRTour.findByIdAndUpdate(id, update, { new: true });
//     if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

//     const populated = await maybePopulateMonastery(updated.toObject());
//     return NextResponse.json(populated);
//   } catch (err) {
//     console.error("PUT /api/vr-tours error:", err);
//     return NextResponse.json({ error: "Failed to update VR tour", detail: String(err) }, { status: 500 });
//   }
// }

// /* ---------- DELETE: delete ---------- */
// export async function DELETE(req) {
//   try {
//     await connectDB();

//     const url = new URL(req.url);
//     const qid = url.searchParams.get("id");

//     let body;
//     try {
//       body = await req.json();
//     } catch {
//       body = null;
//     }

//     const id = (body && body.id) || qid;
//     if (!id) return NextResponse.json({ error: "Missing id (provide id in JSON body or ?id=...)" }, { status: 400 });
//     if (!isValidId(id)) return NextResponse.json({ error: "Invalid id format" }, { status: 400 });

//     const deleted = await VRTour.findByIdAndDelete(id);
//     if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

//     return NextResponse.json({ message: "Deleted" });
//   } catch (err) {
//     console.error("DELETE /api/vr-tours error:", err);
//     return NextResponse.json({ error: "Failed to delete", detail: String(err) }, { status: 500 });
//   }
// }
// app/api/vr-tours/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

/**
 * Provide a fallback VRTour model if project doesn't define one at lib/models/VRTour.
 * Schema:
 *  - title (required)
 *  - description
 *  - monastery (ObjectId -> Monastery)
 *  - rooms: [{ title, imageUrl, audioUrl, order }]
 */
function getVRTourModel() {
  try {
    // prefer project's model if present
    // works with both CJS require or ESM dynamic import (try require first)
    // (we purposely don't throw if it doesn't exist)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require?.("@/lib/models/VRTour");
    const m = mod?.default ?? mod;
    if (m) return m;
  } catch (e) {
    // ignore
  }

  const RoomSchema = new mongoose.Schema(
    {
      title: { type: String, default: "" },
      imageUrl: { type: String, default: "" },
      audioUrl: { type: String, default: "" },
      order: { type: Number, default: 0 },
    },
    { _id: false }
  );

  const VRTourSchema = new mongoose.Schema(
    {
      title: { type: String, required: true },
      slug: { type: String, index: true },
      description: { type: String, default: "" },
      monastery: { type: mongoose.Schema.Types.ObjectId, ref: "Monastery", default: null },
      rooms: { type: [RoomSchema], default: [] },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      published: { type: Boolean, default: true },
    },
    { timestamps: true }
  );

  return mongoose.models.VRTour || mongoose.model("VRTour", VRTourSchema);
}

const VRTour = getVRTourModel();

function isValidId(id) {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

function normalizeRooms(rooms) {
  if (!Array.isArray(rooms)) return [];
  return rooms.map((r, i) => ({
    title: (r && (r.title || r.name)) ? String(r.title || r.name) : `Room ${i + 1}`,
    imageUrl: r?.imageUrl || r?.image || "",
    audioUrl: r?.audioUrl || r?.audio || "",
    order: typeof r?.order === "number" ? r.order : i,
  }));
}

/* ---------------- GET: list or single ---------------- */
export async function GET(req) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (id) {
      if (!isValidId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      const one = await VRTour.findById(id).lean();
      if (!one) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(one);
    }

    // pagination-friendly list
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "25", 10)));
    const q = (url.searchParams.get("q") || "").trim();

    const filter = {};
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { "rooms.title": { $regex: q, $options: "i" } },
      ];
    }

    const total = await VRTour.countDocuments(filter);
    const items = await VRTour.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({ ok: true, total, page, limit, tours: items });
  } catch (err) {
    console.error("GET /api/vr-tours error:", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}

/* ---------------- POST: create ---------------- */
/**
 * Body expected (JSON):
 * {
 *   title: "string",               // required
 *   description?: "string",
 *   monastery?: "<monasteryId>" or null,
 *   rooms?: [{ title,imageUrl,audioUrl,order }, ...]
 * }
 */
export async function POST(req) {
  try {
    await connectDB();

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { title, description = "", monastery = null, rooms = [] } = body || {};

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    if (monastery && !isValidId(monastery)) {
      return NextResponse.json({ error: "Invalid monastery id" }, { status: 400 });
    }

    const normalizedRooms = normalizeRooms(rooms);

    const doc = await VRTour.create({
      title: String(title).trim(),
      slug: (title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: description || "",
      monastery: monastery || null,
      rooms: normalizedRooms,
      published: true,
    });

    return NextResponse.json({ ok: true, tour: doc }, { status: 201 });
  } catch (err) {
    console.error("POST /api/vr-tours error:", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}

/* ---------------- PUT: update ---------------- */
/**
 * Accepts:
 * - query param ?id=...  OR body.id
 * Body fields allowed: title, description, monastery, rooms, published
 */
export async function PUT(req) {
  try {
    await connectDB();

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const url = new URL(req.url);
    const qid = url.searchParams.get("id");
    const id = (body && body.id) || qid;
    if (!id || !isValidId(id)) {
      return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });
    }

    const update = {};
    if (body.title) update.title = String(body.title).trim();
    if (body.description !== undefined) update.description = String(body.description);
    if (body.published !== undefined) update.published = !!body.published;
    if (body.monastery !== undefined) {
      if (body.monastery && !isValidId(body.monastery)) {
        return NextResponse.json({ error: "Invalid monastery id" }, { status: 400 });
      }
      update.monastery = body.monastery || null;
    }
    if (body.rooms) update.rooms = normalizeRooms(body.rooms);

    update.updatedAt = new Date();

    const updated = await VRTour.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, tour: updated });
  } catch (err) {
    console.error("PUT /api/vr-tours error:", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}

/* ---------------- DELETE: delete by id ---------------- */
export async function DELETE(req) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const qid = url.searchParams.get("id");
    let body = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const id = (body && body.id) || qid;
    if (!id || !isValidId(id)) return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });

    const deleted = await VRTour.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error("DELETE /api/vr-tours error:", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}
