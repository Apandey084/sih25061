// app/api/events/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";

/** ----------------- DB helpers (unchanged) ----------------- */
async function ensureDB() {
  if (mongoose?.connection?.readyState === 1) return;
  try {
    const dbMod = await import("@/lib/mongodb").catch(() => null);
    const db = dbMod?.default ?? dbMod;
    if (typeof db === "function") {
      await db();
      return;
    }
    if (db?.clientPromise) {
      await db.clientPromise;
      return;
    }
  } catch (e) {
    // ignore and fallback
  }

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.mongo_uri;
  if (!uri) {
    // leave disconnected if no URI
    return;
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
}

async function getEventModel() {
  try {
    const mod = await import("@/lib/models/Event").catch(() => null);
    const model = mod?.default ?? mod;
    if (model) return model;
  } catch (e) {
    // ignore
  }

  const schema = new mongoose.Schema(
    {
      title: { type: String, required: true, trim: true },
      date: { type: Date, required: true },
      description: { type: String, default: "" },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      published: { type: Boolean, default: true },
      meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
  );

  return mongoose.models.Event || mongoose.model("Event", schema);
}

const SAMPLE = [
  { _id: "sample-1", title: "Monastery Prayer Meet", date: new Date(Date.now() + 86400e3).toISOString(), description: "Join us for a ceremonial prayer." },
  { _id: "sample-2", title: "Meditation Workshop", date: new Date(Date.now() + 3 * 86400e3).toISOString(), description: "Guided meditation for beginners." },
];

/** ----------------- Admin guard ----------------- */
/**
 * Returns NextResponse (401) when unauthorized.
 * Returns null when authorized.
 */
async function requireAdmin(req) {
  try {
    // getToken reads cookies from the Request (App Router)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }).catch(() => null);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized - no token" }, { status: 401 });
    }
    // token.role should be set when user signed in (custom callback)
    if (token.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized - admin required" }, { status: 401 });
    }
    return null;
  } catch (e) {
    console.error("requireAdmin error:", e);
    return NextResponse.json({ ok: false, error: "Unauthorized - token error" }, { status: 401 });
  }
}

/* ---------------------- GET ---------------------- */
/**
 * GET /api/events?page=&limit=&q=
 * returns { ok, total, page, limit, events }
 */
export async function GET(req) {
  try {
    await ensureDB();
    const Event = await getEventModel();

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10)));
    const q = (url.searchParams.get("q") || "").trim();

    const filter = {};
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    if (!Event || !Event.find) {
      const events = SAMPLE.slice((page - 1) * limit, page * limit).map((e) => ({ ...e }));
      return NextResponse.json({ ok: true, total: SAMPLE.length, page, limit, events });
    }

    const total = await Event.countDocuments(filter);
    const items = await Event.find(filter).sort({ date: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();

    return NextResponse.json({ ok: true, total, page, limit, events: items });
  } catch (err) {
    console.error("GET /api/events error:", err);
    return NextResponse.json({ ok: false, error: "Server error", detail: err?.message || String(err) }, { status: 500 });
  }
}

/* ---------------------- POST ---------------------- */
/**
 * POST /api/events
 * body: { title, date, description }
 * admin only
 */
export async function POST(req) {
  try {
    // admin guard
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    const title = (body?.title || "").toString().trim();
    const description = (body?.description || "").toString();
    const dateRaw = body?.date;

    if (!title) return NextResponse.json({ ok: false, error: "Missing title" }, { status: 400 });
    if (!dateRaw) return NextResponse.json({ ok: false, error: "Missing date" }, { status: 400 });

    const date = new Date(dateRaw);
    if (isNaN(date.getTime())) return NextResponse.json({ ok: false, error: "Invalid date" }, { status: 400 });

    await ensureDB();
    const Event = await getEventModel();
    if (!Event || !Event.create) {
      const tmp = { _id: `local-${Date.now()}`, title, description, date: date.toISOString(), createdAt: new Date().toISOString() };
      return NextResponse.json({ ok: true, event: tmp }, { status: 201 });
    }

    const doc = await Event.create({ title, date, description });
    return NextResponse.json({ ok: true, event: doc }, { status: 201 });
  } catch (err) {
    console.error("POST /api/events error:", err);
    return NextResponse.json({ ok: false, error: "Server error", detail: err?.message || String(err) }, { status: 500 });
  }
}

/* ---------------------- PUT ---------------------- */
/**
 * PUT /api/events
 * body: { id, title?, date?, description? }
 * admin only
 */
export async function PUT(req) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    const id = body?.id;
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    await ensureDB();
    const Event = await getEventModel();
    if (!Event || !Event.findByIdAndUpdate) return NextResponse.json({ ok: false, error: "DB not available" }, { status: 503 });

    const update = {};
    if (body.title !== undefined) update.title = body.title.toString();
    if (body.description !== undefined) update.description = body.description.toString();
    if (body.date !== undefined) {
      const d = new Date(body.date);
      if (isNaN(d.getTime())) return NextResponse.json({ ok: false, error: "Invalid date" }, { status: 400 });
      update.date = d;
    }
    update.updatedAt = new Date();

    const updated = await Event.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, event: updated });
  } catch (err) {
    console.error("PUT /api/events error:", err);
    return NextResponse.json({ ok: false, error: "Server error", detail: err?.message || String(err) }, { status: 500 });
  }
}

/* ---------------------- DELETE ---------------------- */
/**
 * DELETE /api/events
 * body: { id }
 * admin only
 */
export async function DELETE(req) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    const id = body?.id;
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    await ensureDB();
    const Event = await getEventModel();
    if (!Event || !Event.findByIdAndDelete) return NextResponse.json({ ok: false, error: "DB not available" }, { status: 503 });

    const deleted = await Event.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error("DELETE /api/events error:", err);
    return NextResponse.json({ ok: false, error: "Server error", detail: err?.message || String(err) }, { status: 500 });
  }
}
