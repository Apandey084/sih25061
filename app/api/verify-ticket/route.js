// app/api/verify-ticket/route.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";
import Ticket from "@/lib/models/Ticket";
import CheckerUser from "@/lib/models/CheckerUser";
import crypto from "crypto";
import mongoose from "mongoose";

/* same helper functions as before */
function tryDecodeBase64Payload(qrBase64) {
  try {
    const decoded = Buffer.from(qrBase64, "base64").toString("utf8");
    const parts = decoded.split("|");
    if (parts.length !== 3) return null;
    const [ticketId, tsStr, sig] = parts;
    const ts = parseInt(tsStr, 10);
    if (!ticketId || Number.isNaN(ts) || !sig) return null;
    return { ticketId, ts, sig };
  } catch {
    return null;
  }
}
function extractObjectIdFromString(s) {
  if (!s) return null;
  const m = String(s).match(/[a-fA-F0-9]{24}/);
  return m ? m[0] : null;
}
function isPossibleObjectId(id) {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}
function verifySignature(ticketId, ts, sig) {
  const key = process.env.TICKET_SIGNING_KEY || "";
  if (!key) return false;
  const expected = crypto.createHmac("sha256", key).update(`${ticketId}|${ts}`).digest("hex");
  return expected === sig;
}
async function requireChecker(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token && token.role === "checker") return { ok: true, checkerId: token.sub || token?.id || token?.user?.id, token };
  if (process.env.DEV_CHECKER_ID) return { ok: true, checkerId: process.env.DEV_CHECKER_ID, token: { dev: true } };
  return { ok: false, resp: NextResponse.json({ error: "Unauthorized - checker required" }, { status: 401 }) };
}

export async function POST(req) {
  try {
    await connectDB();

    const auth = await requireChecker(req);
    if (!auth.ok) return auth.resp;
    const checkerId = auth.checkerId;

    // ensure checker exists & active
    const checker = await CheckerUser.findById(checkerId).lean();
    if (!checker) return NextResponse.json({ error: "Checker account not found" }, { status: 404 });
    if (!checker.approved || checker.active === false) {
      return NextResponse.json({ error: "Checker not active/approved" }, { status: 403 });
    }

    // parse body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { qrData, ticketId: rawTicketId } = body || {};
    let ticketId = rawTicketId || null;
    let signatureChecked = false;
    let rawReceived = null;

    if (qrData) {
      rawReceived = String(qrData).trim();
      const decoded = tryDecodeBase64Payload(rawReceived);
      if (decoded) {
        const { ticketId: tid, ts, sig } = decoded;
        if (!verifySignature(tid, ts, sig)) {
          return NextResponse.json({ error: "Invalid QR signature" }, { status: 400 });
        }
        ticketId = tid;
        signatureChecked = true;
      } else {
        // plain id or embedded id
        if (isPossibleObjectId(rawReceived)) {
          ticketId = rawReceived;
        } else {
          const extracted = extractObjectIdFromString(rawReceived);
          if (extracted) ticketId = extracted;
          else return NextResponse.json({ error: "Invalid QR payload or ticketId", rawReceived }, { status: 400 });
        }
      }
    }

    if (!ticketId) return NextResponse.json({ error: "Missing ticketId or qrData" }, { status: 400 });
    if (!isPossibleObjectId(ticketId)) return NextResponse.json({ error: "Invalid ticketId format" }, { status: 400 });

    // Fetch ticket (no populate to avoid missing-model crash)
    const ticket = await Ticket.findById(ticketId).lean();
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    // Try to load monastery and verifiedBy separately if models are registered
    let monastery = null;
    try {
      if (ticket.monastery && mongoose.models.Monastery) {
        const Monastery = mongoose.models.Monastery;
        monastery = await Monastery.findById(ticket.monastery).lean().catch(() => null);
      }
    } catch (e) {
      monastery = null;
    }

    let verifiedBy = null;
    try {
      if (ticket.verifiedBy && mongoose.models.CheckerUser) {
        const Checker = mongoose.models.CheckerUser;
        const vb = await Checker.findById(ticket.verifiedBy).lean().catch(() => null);
        if (vb) verifiedBy = { id: vb._id, name: vb.name, email: vb.email };
      }
    } catch (e) {
      verifiedBy = null;
    }

    // Normalize isUsed
    const alreadyUsed = Boolean(
      ticket.isUsed === true ||
      ticket.isUsed === "true" ||
      ticket.isUsed === 1 ||
      ticket.isUsed === "1"
    );

    if (alreadyUsed) {
      return NextResponse.json({
        ok: false,
        valid: false,
        message: "Ticket already used",
        ticket: {
          id: ticket._id,
          purchaserName: ticket.purchaserName,
          purchaserEmail: ticket.purchaserEmail,
          visitDate: ticket.visitDate,
          numVisitors: ticket.numVisitors,
          isUsed: true,
          verifiedAt: ticket.verifiedAt || null,
          verifiedBy,
        },
        monastery,
      }, { status: 200 });
    }

    // Mark used & audit using native model to update fields
    const ticketDoc = await Ticket.findById(ticketId);
    ticketDoc.isUsed = true;
    ticketDoc.verifiedAt = new Date();
    ticketDoc.verifiedBy = checker._id;
    await ticketDoc.save();

    const responseChecker = { id: checker._id.toString(), name: checker.name || "", email: checker.email || "" };

    return NextResponse.json({
      ok: true,
      valid: true,
      message: "Ticket verified and marked used",
      ticket: {
        id: ticketDoc._id,
        purchaserName: ticketDoc.purchaserName,
        purchaserEmail: ticketDoc.purchaserEmail,
        visitDate: ticketDoc.visitDate,
        numVisitors: ticketDoc.numVisitors,
        isUsed: ticketDoc.isUsed,
        verifiedAt: ticketDoc.verifiedAt,
        verifiedBy: responseChecker,
      },
      monastery,
      checker: responseChecker,
      signatureChecked,
      rawReceived,
    }, { status: 200 });

  } catch (err) {
    console.error("POST verify-ticket error:", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}
