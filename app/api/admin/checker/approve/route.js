// app/api/admin/checker/approve/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcryptjs";

/* ---------- DB helper (same approach) ---------- */
async function ensureDB() {
  if (mongoose.connection && mongoose.connection.readyState && mongoose.connection.readyState !== 0) return;
  try {
    const dbMod = await import("@/lib/mongodb").catch(() => null);
    const db = dbMod?.default ?? dbMod;
    if (typeof db === "function") {
      await db();
      return;
    }
    if (db && typeof db.connect === "function") {
      await db.connect();
      return;
    }
  } catch (_) {}
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.mongo_uri;
  if (!uri) throw new Error("Missing MongoDB URI (MONGO_URI / MONGODB_URI / mongo_uri).");
  await mongoose.connect(uri);
}

/* ---------- load or fallback models ---------- */
function getCheckerRequestModel() {
  try {
    const mod = require("@/lib/models/CheckerRequest");
    return mod?.default ?? mod;
  } catch (e) {
    const schema = new mongoose.Schema({
      name: String,
      email: String,
      passwordHash: String,
      note: String,
      status: { type: String, default: "pending" },
      adminId: String,
      approvedAt: Date,
    }, { timestamps: true });
    return mongoose.models.CheckerRequest || mongoose.model("CheckerRequest", schema);
  }
}

function getCheckerUserModel() {
  try {
    const mod = require("@/lib/models/CheckerUser");
    return mod?.default ?? mod;
  } catch (e) {
    // basic CheckerUser fallback schema
    const schema = new mongoose.Schema({
      name: String,
      email: { type: String, index: true, unique: true },
      passwordHash: String,
      role: { type: String, default: "checker" },
      approved: { type: Boolean, default: true },
      active: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }, { timestamps: true });
    return mongoose.models.CheckerUser || mongoose.model("CheckerUser", schema);
  }
}

/* ---------- admin guard ---------- */
async function requireAdmin(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized - admin required" }, { status: 401 });
  }
  return null;
}

/* ---------- POST handler — approve or reject ---------- */
export async function POST(req) {
  try {
    // only admin
    const denied = await requireAdmin(req);
    if (denied) return denied;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { requestId, action } = body || {}; // action: "approve" | "reject"
    if (!requestId || !action) return NextResponse.json({ error: "requestId and action required" }, { status: 400 });

    if (!mongoose.Types.ObjectId.isValid(requestId)) return NextResponse.json({ error: "Invalid requestId" }, { status: 400 });

    await ensureDB();
    const CheckerRequest = getCheckerRequestModel();
    const CheckerUser = getCheckerUserModel();

    const reqDoc = await CheckerRequest.findById(requestId);
    if (!reqDoc) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (reqDoc.status !== "pending") return NextResponse.json({ error: "Request already processed" }, { status: 400 });

    const adminToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (action === "reject") {
      reqDoc.status = "rejected";
      reqDoc.adminId = adminToken?.email || adminToken?.sub || null;
      reqDoc.approvedAt = new Date();
      await reqDoc.save();
      return NextResponse.json({ ok: true, status: "rejected" });
    }

    if (action === "approve") {
      // ensure no existing checker with same email
      const existingChecker = await CheckerUser.findOne({ email: reqDoc.email });
      if (existingChecker) {
        // update existing record with new fields (but don't overwrite passwordHash if none)
        existingChecker.name = reqDoc.name || existingChecker.name;
        if (reqDoc.passwordHash) existingChecker.passwordHash = reqDoc.passwordHash;
        existingChecker.approved = true;
        existingChecker.active = true;
        await existingChecker.save();
        reqDoc.status = "approved";
        reqDoc.adminId = adminToken?.email || adminToken?.sub || null;
        reqDoc.approvedAt = new Date();
        await reqDoc.save();
        const safe = existingChecker.toObject();
        delete safe.passwordHash;
        return NextResponse.json({ ok: true, user: safe });
      }

      // create a new CheckerUser using the passwordHash from request
      const newUser = await CheckerUser.create({
        name: reqDoc.name,
        email: reqDoc.email,
        passwordHash: reqDoc.passwordHash,
        role: "checker",
        approved: true,
        active: true,
      });

      reqDoc.status = "approved";
      reqDoc.adminId = adminToken?.email || adminToken?.sub || null;
      reqDoc.approvedAt = new Date();
      await reqDoc.save();

      const safe = newUser.toObject();
      delete safe.passwordHash;

      return NextResponse.json({ ok: true, user: safe }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/admin/checker/approve error:", err);
    return NextResponse.json({ error: "Server error", detail: err?.message || String(err) }, { status: 500 });
  }
}
