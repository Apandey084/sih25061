// app/api/admin/pending-checkers/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";

/** DB connect helper (tries project lib, falls back to MONGO_URI) */
async function ensureDB() {
  if (mongoose.connection && mongoose.connection.readyState && mongoose.connection.readyState !== 0) return;
  try {
    const dbMod = await import("@/lib/mongodb").catch(() => null);
    const db = dbMod?.default ?? dbMod;
    if (typeof db === "function") { await db(); return; }
    if (db && typeof db.connect === "function") { await db.connect(); return; }
  } catch (e) { /* ignore and fallback */ }

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.mongo_uri;
  if (!uri) throw new Error("Missing MongoDB URI (MONGO_URI / MONGODB_URI / mongo_uri).");
  await mongoose.connect(uri);
}

/** Load CheckerRequest model (prefer project model, fallback local) */
function getCheckerRequestModel() {
  try {
    const mod = require("@/lib/models/CheckerRequest");
    return mod?.default ?? mod;
  } catch (e) {
    const schema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, index: true },
      passwordHash: { type: String, required: true },
      note: { type: String, default: "" },
      status: { type: String, enum: ["pending","approved","rejected"], default: "pending" },
      adminId: { type: String, default: null },
      approvedAt: Date,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }, { timestamps: true });
    return mongoose.models.CheckerRequest || mongoose.model("CheckerRequest", schema);
  }
}

/** Require admin token — optional: remove if this endpoint should be public to admins only */
async function requireAdmin(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized - admin required" }, { status: 401 });
  }
  return null;
}

/** GET — return pending checker requests */
export async function GET(req) {
  try {
    // admin guard; if you want this publicly accessible to admins only keep it.
    const denied = await requireAdmin(req);
    if (denied) return denied;

    await ensureDB();
    const CheckerRequest = getCheckerRequestModel();

    // Only pending
    const pending = await CheckerRequest.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .select("name email note status createdAt")
      .lean();

    // Normalize shape for the client (array)
    return NextResponse.json({ ok: true, pending }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/pending-checkers error:", err);
    return NextResponse.json({ error: "Server error", detail: err?.message || String(err) }, { status: 500 });
  }
}
