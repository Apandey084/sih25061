// app/api/users/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import UserModel from "@/lib/models/User";
import connectDB from "@/lib/mongodb"; // your existing connect helper

// Ensure DB connection
async function ensureDB() {
  // prefer an exported connectDB if available
  try {
    if (connectDB && typeof connectDB === "function") {
      await connectDB();
      return;
    }
  } catch (e) {
    // fallback to mongoose connect if connectDB isn't present or failed
  }

  if (mongoose.connection && mongoose.connection.readyState !== 0) return;
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.mongo_uri ||
    process.env.MONGO_DB_URI;
  if (!uri) throw new Error("No MongoDB URI found (MONGO_URI / MONGODB_URI).");
  await mongoose.connect(uri, { autoIndex: false });
}

// Admin guard helper: returns NextResponse if unauthorized, else null.
async function requireAdmin(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized - admin required" }, { status: 401 });
  }
  return null;
}

// Parse JSON safely for App Router Request
async function safeJson(req) {
  try {
    return await req.json();
  } catch (e) {
    return null;
  }
}

export async function GET(req) {
  try {
    await ensureDB();

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const role = url.searchParams.get("role") || null;
    const pending = url.searchParams.get("pending") === "true";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));

    const filter = {};
    if (pending) {
      filter.role = "checker";
      filter.approved = false;
    } else if (role) {
      filter.role = role;
    }

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const total = await UserModel.countDocuments(filter);
    const users = await UserModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-password -passwordHash")
      .lean();

    return NextResponse.json({ ok: true, total, page, limit, users });
  } catch (err) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    // create a user (admin only)
    const denied = await requireAdmin(req);
    if (denied) return denied;

    await ensureDB();
    const body = await safeJson(req);
    const { name, email, role = "user", password } = body || {};
    if (!name || !email) return NextResponse.json({ error: "Missing name or email" }, { status: 400 });

    const existing = await UserModel.findOne({ email: String(email).toLowerCase() });
    if (existing) return NextResponse.json({ error: "User already exists" }, { status: 400 });

    const doc = {
      name,
      email: String(email).toLowerCase(),
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (password) doc.password = await bcrypt.hash(String(password), 10);

    const created = await UserModel.create(doc);
    const safe = created.toObject();
    delete safe.password;
    delete safe.passwordHash;
    return NextResponse.json({ ok: true, user: safe }, { status: 201 });
  } catch (err) {
    console.error("POST /api/users error:", err);
    if (err?.code === 11000) return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}

/**
 * PUT semantics:
 * - Approve checker request: body = { id, approve: true, password?: "..." }
 *    -> sets approved=true, active=true, sets passwordHash (generate if not provided), returns tempPassword
 * - Reject checker request: body = { id, reject: true, reason?: "..." }
 *    -> sets requestStatus = 'rejected' (keeps record), approved=false, active=false
 * - Generic update: body = { id, name?, email?, role?, active?, approved? }
 */
export async function PUT(req) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    await ensureDB();
    const body = await safeJson(req);
    if (!body || !body.id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

    const { id } = body;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const user = await UserModel.findById(id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Approve flow
    if (body.approve === true) {
      if (user.role !== "checker") return NextResponse.json({ error: "User is not a checker request" }, { status: 400 });

      // Generate temp password if not supplied
      const tempPassword = body.password ? String(body.password) : (Math.random().toString(36).slice(2, 10) + "A1!");
      user.passwordHash = await bcrypt.hash(String(tempPassword), 10);
      user.approved = true;
      user.active = true;
      user.requestStatus = "approved";
      user.approvedAt = new Date();
      user.updatedAt = new Date();
      await user.save();

      const safe = user.toObject();
      delete safe.passwordHash;
      return NextResponse.json({ ok: true, user: safe, tempPassword }, { status: 200 });
    }

    // Reject flow
    if (body.reject === true) {
      if (user.role !== "checker") return NextResponse.json({ error: "User is not a checker request" }, { status: 400 });

      user.approved = false;
      user.active = false;
      user.requestStatus = "rejected";
      user.rejectionReason = body.reason ? String(body.reason) : null;
      user.updatedAt = new Date();
      await user.save();

      const safe = user.toObject();
      delete safe.passwordHash;
      return NextResponse.json({ ok: true, user: safe }, { status: 200 });
    }

    // Generic update
    const update = {};
    if (body.name) update.name = body.name;
    if (body.email) update.email = String(body.email).toLowerCase();
    if (body.role) update.role = body.role;
    if (typeof body.active === "boolean") update.active = body.active;
    if (typeof body.approved === "boolean") update.approved = body.approved;
    if (Object.keys(update).length === 0) return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });

    update.updatedAt = new Date();
    const updated = await UserModel.findByIdAndUpdate(id, update, { new: true }).select("-password -passwordHash").lean();
    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ ok: true, user: updated }, { status: 200 });
  } catch (err) {
    console.error("PUT /api/users error:", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    await ensureDB();
    const body = await safeJson(req);
    const id = body?.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const deleted = await UserModel.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ ok: true, message: "User deleted" }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/users error:", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}
