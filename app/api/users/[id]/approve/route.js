// app/api/users/[id]/approve/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";

async function ensureDB() {
  if (mongoose.connection?.readyState === 1) return;
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.mongo_uri;
  if (!uri) throw new Error("Missing MongoDB URI");
  await mongoose.connect(uri);
}

function getCheckerRequest() {
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
        status: String,
      },
      { timestamps: true }
    );
    return (
      mongoose.models.CheckerRequest ||
      mongoose.model("CheckerRequest", schema)
    );
  }
}

function getUser() {
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

async function requireAdmin(req) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== "admin")
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  return null;
}

// APPROVE
export async function PUT(req, context) {
  const params = await context.params;
  const id = params.id;

  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid id" },
        { status: 400 }
      );
    }

    await ensureDB();
    const CheckerRequest = getCheckerRequest();
    const User = getUser();

    const reqDoc = await CheckerRequest.findById(id);
    if (!reqDoc)
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );

    if (reqDoc.status === "approved")
      return NextResponse.json(
        { error: "Already approved" },
        { status: 400 }
      );

    // create checker user
    const user = await User.create({
      name: reqDoc.name,
      email: reqDoc.email,
      role: "checker",
      approved: true,
      active: true,
      passwordHash: reqDoc.passwordHash,
    });

    reqDoc.status = "approved";
    await reqDoc.save();

    const safe = user.toObject();
    delete safe.passwordHash;

    return NextResponse.json({ ok: true, user: safe });
  } catch (err) {
    console.error("approve error:", err);
    return NextResponse.json(
      { error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
