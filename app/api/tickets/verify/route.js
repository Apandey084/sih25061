// app/api/tickets/verify/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Ticket from "@/lib/models/Ticket";
import Monastery from "@/lib/models/Monastery";
import connectDB from "@/lib/mongodb";
import { getToken } from "next-auth/jwt";


/** Minimal VerificationLog model (created on-demand) */
const VerificationLogSchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: false },
    qrData: { type: String, required: true },
    checkerId: { type: mongoose.Schema.Types.ObjectId, ref: "CheckerUser", required: false },
    action: { type: String, enum: ["verified", "already_used", "not_found", "denied", "error"], required: true },
    message: String,
    meta: Object,
  },
  { timestamps: true }
);
const VerificationLog = mongoose.models.VerificationLog || mongoose.model("VerificationLog", VerificationLogSchema);

/** Ensure DB connection works with common export shapes */
async function ensureDB() {
  if (mongoose.connection.readyState !== 0) return;
  if (typeof connectDB === "function") {
    await connectDB();
    return;
  }
  if (connectDB && typeof connectDB.connect === "function") {
    await connectDB.connect();
    return;
  }
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.mongo_uri ||
    process.env.MONGO_DB_URI;
  if (!uri) throw new Error("No MongoDB URI set (MONGO_URI / MONGODB_URI / mongo_uri).");
  await mongoose.connect(uri);
}

async function safeJson(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const body = await safeJson(req);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    let { qrData } = body;
    if (!qrData) return NextResponse.json({ error: "Missing qrData" }, { status: 400 });
    qrData = String(qrData).trim();

    await ensureDB();

    // enforce checker auth
    let checkerId = null;
    let checkerToken = null;
    try {
      checkerToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    } catch (e) {
      // token parse error
    }
    if (!checkerToken || checkerToken.role !== "checker") {
      // log denied attempt
      try {
        await VerificationLog.create({
          qrData,
          checkerId: checkerToken?.sub || checkerToken?.checkerId || null,
          action: "denied",
          message: "Missing or invalid checker token",
        });
      } catch (e) {}
      return NextResponse.json({ error: "Unauthorized — checker login required" }, { status: 401 });
    }

    // extract checker id (handle token shapes)
    checkerId = checkerToken.checkerId || checkerToken.sub || checkerToken.id || null;

    // atomic update: only mark used if currently not used
    const update = {
      isUsed: true,
      verifiedAt: new Date(),
    };
    if (checkerId && mongoose.Types.ObjectId.isValid(checkerId)) {
      update.verifiedBy = checkerId;
    }

    const updated = await Ticket.findOneAndUpdate(
      { qrCodeData: qrData, isUsed: false },
      { $set: update },
      { new: true }
    )
      .populate("monastery")
      .lean();

    if (updated) {
      // success — record log and return
      try {
        await VerificationLog.create({
          ticket: updated._id,
          qrData,
          checkerId: checkerId && mongoose.Types.ObjectId.isValid(checkerId) ? checkerId : null,
          action: "verified",
          message: "Ticket verified and marked used",
          meta: { verifiedAt: updated.verifiedAt },
        });
      } catch (e) {
        console.error("VerificationLog create error:", e);
      }

      return NextResponse.json({
        valid: true,
        message: "Ticket verified and marked used",
        ticket: updated,
        monastery: updated?.monastery ?? null,
      });
    }

    // not updated → either ticket not found or already used
    const existing = await Ticket.findOne({ qrCodeData: qrData }).populate("monastery").lean();

    if (!existing) {
      // log not found
      try {
        await VerificationLog.create({
          qrData,
          checkerId: checkerId && mongoose.Types.ObjectId.isValid(checkerId) ? checkerId : null,
          action: "not_found",
          message: "Ticket not found for qrData",
        });
      } catch (e) {}
      return NextResponse.json({ valid: false, message: "Ticket not found", ticket: null }, { status: 404 });
    }

    if (existing.isUsed) {
      // already used — log and return existing info
      try {
        await VerificationLog.create({
          ticket: existing._id,
          qrData,
          checkerId: checkerId && mongoose.Types.ObjectId.isValid(checkerId) ? checkerId : null,
          action: "already_used",
          message: `Ticket already used at ${existing.verifiedAt}`,
          meta: { verifiedAt: existing.verifiedAt },
        });
      } catch (e) {}

      return NextResponse.json({
        valid: false,
        message: "Ticket already used",
        ticket: existing,
        monastery: existing?.monastery ?? null,
      }, { status: 200 });
    }

    // fallback (shouldn't happen)
    try {
      await VerificationLog.create({
        qrData,
        checkerId: checkerId && mongoose.Types.ObjectId.isValid(checkerId) ? checkerId : null,
        action: "error",
        message: "Could not verify - unknown state",
      });
    } catch (e) {}

    return NextResponse.json({ valid: false, message: "Could not verify ticket (unknown)" }, { status: 500 });
  } catch (err) {
    console.error("Ticket verify error:", err);
    try {
      await ensureDB();
      await VerificationLog.create({
        qrData: (err && err.qrData) || null,
        action: "error",
        message: err?.message || String(err),
      });
    } catch (e) {}
    return NextResponse.json({ error: "Server error", detail: err?.message || String(err) }, { status: 500 });
  }
}
