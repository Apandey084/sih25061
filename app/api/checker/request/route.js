// app/api/checker/request/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/* -------------------- DB CONNECT -------------------- */
async function ensureDB() {
  if (mongoose.connection?.readyState === 1) return;
  try {
    const mod = await import("@/lib/mongodb").catch(() => null);
    const db = mod?.default ?? mod;
    if (typeof db === "function") return db();
    if (db?.connect) return db.connect();
  } catch (_) {}

  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.mongo_uri;
  if (!uri) throw new Error("No MongoDB URI found");
  await mongoose.connect(uri);
}

/* -------------------- MODELS -------------------- */
function getCheckerRequestModel() {
  try {
    const m = require("@/lib/models/CheckerRequest");
    return m.default ?? m;
  } catch (_) {
    const schema = new mongoose.Schema(
      {
        name: String,
        email: String,
        passwordHash: String,
        note: String,
        status: { type: String, default: "pending" },
      },
      { timestamps: true }
    );
    return mongoose.models.CheckerRequest ||
      mongoose.model("CheckerRequest", schema);
  }
}

function getUserModel() {
  try {
    const m = require("@/lib/models/User");
    return m.default ?? m;
  } catch (_) {
    const schema = new mongoose.Schema(
      {
        name: String,
        email: { type: String, unique: true },
        passwordHash: String,
        role: String,
        approved: Boolean,
        active: Boolean,
      },
      { timestamps: true }
    );
    return mongoose.models.User || mongoose.model("User", schema);
  }
}

/* -------------------- POST HANDLER -------------------- */
export async function POST(req) {
  try {
    const { name, email, password, note } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "name, email, password required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await ensureDB();
    const CheckerRequest = getCheckerRequestModel();
    const User = getUserModel();

    // prevent duplicate in user collection
    if (await User.findOne({ email: normalizedEmail })) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // prevent duplicate pending request
    if (
      await CheckerRequest.findOne({
        email: normalizedEmail,
        status: "pending",
      })
    ) {
      return NextResponse.json(
        { error: "Checker request already pending" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const doc = await CheckerRequest.create({
      name,
      email: normalizedEmail,
      passwordHash,
      note,
      status: "pending",
    });

    return NextResponse.json({ ok: true, id: doc._id }, { status: 201 });
  } catch (err) {
    console.error("checker request error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
