// app/api/users/[id]/reject/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";

async function ensureDB() {
  if (mongoose.connection?.readyState === 1) return;
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.mongo_uri;
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

export async function PUT(req, context) {
  const params = await context.params;
  const id = params.id;

  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    await ensureDB();
    const CheckerRequest = getCheckerRequest();

    const doc = await CheckerRequest.findById(id);
    if (!doc)
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );

    doc.status = "rejected";
    await doc.save();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("reject error:", e);
    return NextResponse.json(
      { error: "Server error", detail: e.message },
      { status: 500 }
    );
  }
}
