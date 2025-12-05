// app/api/tickets/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import qrcode from "qrcode";
import nodemailer from "nodemailer";
import cloudinary from "cloudinary";
import streamifier from "streamifier";

// DB connector (ESM/CJS safe)
import connectDBModule from "@/lib/mongodb";
const connectDB = typeof connectDBModule === "function" ? connectDBModule : (connectDBModule && connectDBModule.default) || null;

// Models (ESM/CJS safe)
import TicketModel from "@/lib/models/Ticket";
import MonasteryModel from "@/lib/models/Monastery";
const Ticket = TicketModel.default || TicketModel;
const Monastery = MonasteryModel.default || MonasteryModel;

async function ensureDB() {
  if (connectDB) {
    try {
      await connectDB();
      return;
    } catch (e) {
      console.warn("connectDB() failed; falling back to mongoose.connect()", e?.message || e);
    }
  }
  const uri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGO;
  if (!uri) throw new Error("Missing MONGO_URI / MONGO_URL env var");
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  try {
    const crypto = require("crypto");
    const secret = process.env.RAZORPAY_KEY_SECRET || process.env.RZ_SECRET;
    if (!secret) return true; // skip verification in dev when secret missing
    const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
    return expected === signature;
  } catch (err) {
    return false;
  }
}

async function generateTicketPDFBuffer(ticket, monastery) {
  // Ensure font exists
  const fontPath = path.join(process.cwd(), "public", "fonts", "Aboreto-Regular.ttf");
  if (!fs.existsSync(fontPath)) {
    throw new Error(`Font file missing at ${fontPath}. Place your TTF there.`);
  }
  const fontBytes = fs.readFileSync(fontPath);

  // Create PDF and register fontkit
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const embeddedFont = await pdfDoc.embedFont(fontBytes);

  const page = pdfDoc.addPage([595, 842]); // A4 approx
  const { width, height } = page.getSize();
  const margin = 40;
  let cursorY = height - margin;

  const draw = (text, size = 12, opts = {}) => {
    const lines = String(text).split("\n");
    for (const line of lines) {
      const textWidth = embeddedFont.widthOfTextAtSize(line, size);
      let x = margin;
      if (opts.align === "center") x = (width - textWidth) / 2;
      page.drawText(line, {
        x,
        y: cursorY,
        size,
        font: embeddedFont,
        color: rgb(0, 0, 0),
        maxWidth: width - margin * 2,
      });
      cursorY -= size * 1.4;
    }
  };

  draw("Monastery360 — Visit Ticket", 18, { align: "center" });
  cursorY -= 6;

  draw(`Ticket ID: ${ticket._id.toString()}`, 11);
  draw(`Monastery: ${monastery?.name || ticket.monastery?.toString() || "-"}`, 11);
  draw(`Name: ${ticket.purchaserName || "-"}`, 11);
  draw(`Email: ${ticket.purchaserEmail || "-"}`, 11);
  draw(`Visit Date: ${ticket.visitDate ? new Date(ticket.visitDate).toLocaleDateString() : "-"}`, 11);
  draw(`Visitors: ${ticket.numVisitors ?? "-"}`, 11);
  draw(`Total: ₹${ticket.totalPrice ?? "-"}`, 11);

  cursorY -= 8;

  // QR generation & embedding
  const qrData = ticket.qrCodeData || `ticket:${ticket._id.toString()}`;
  const qrDataUrl = await qrcode.toDataURL(qrData, { margin: 1, scale: 6 });
  const base64 = qrDataUrl.split(",")[1];
  const qrBytes = Buffer.from(base64, "base64");
  const pngImage = await pdfDoc.embedPng(qrBytes);
  const qrSize = 140;
  const qrX = margin;
  const qrY = cursorY - qrSize;
  page.drawImage(pngImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  // Right-side notes
  const noteX = qrX + qrSize + 12;
  let noteY = qrY + qrSize;
  const noteLines = [
    "Present this QR at entry.",
    "Valid only for the booked date.",
    "Thank you for booking with Monastery360.",
  ];
  for (const l of noteLines) {
    page.drawText(l, { x: noteX, y: noteY - 14, size: 10, font: embeddedFont });
    noteY -= 14;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function uploadBufferToCloudinary(buffer, publicId) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary env vars not configured");
  }
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream({ resource_type: "auto", folder: "tickets", public_id: publicId }, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

async function sendEmailWithAttachment(toEmail, subject, text, pdfBuffer, filename = "ticket.pdf") {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.info("SMTP not configured; skipping send.");
    return null;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from,
    to: toEmail,
    subject,
    text,
    attachments: [{ filename, content: pdfBuffer, contentType: "application/pdf" }],
  });
  return info;
}

// GET: fetch tickets (optional)
export async function GET(req) {
  try {
    await ensureDB();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
      const t = await Ticket.findById(id).populate("monastery").lean();
      if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(t);
    }
    const list = await Ticket.find().sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json(list);
  } catch (err) {
    console.error("GET /api/tickets error:", err);
    return NextResponse.json({ error: "Server error", detail: err?.message || String(err) }, { status: 500 });
  }
}

// POST: create ticket after payment
export async function POST(req) {
  try {
    await ensureDB();

    const body = await req.json();
    const {
      monastery: monasteryId,
      purchaserName,
      purchaserEmail,
      visitDate,
      numVisitors,
      totalPrice,
      razorpay,
      visitors,
    } = body || {};

    if (!monasteryId || !purchaserName || !purchaserEmail || !visitDate || !numVisitors || !totalPrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // verify signature if provided
    if (razorpay?.signature) {
      const ok = verifyRazorpaySignature({
        orderId: razorpay.orderId || razorpay.order_id,
        paymentId: razorpay.paymentId || razorpay.payment_id,
        signature: razorpay.signature,
      });
      if (!ok) return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // create ticket doc
    const ticketDoc = await Ticket.create({
      monastery: mongoose.Types.ObjectId.isValid(monasteryId) ? monasteryId : monasteryId,
      purchaserName,
      purchaserEmail: String(purchaserEmail).toLowerCase(),
      visitDate: new Date(visitDate),
      numVisitors,
      totalPrice,
      paymentStatus: "paid",
      razorpay: razorpay || null,
      visitors: Array.isArray(visitors) ? visitors : undefined,
    });

    // create qr code token if not present
    if (!ticketDoc.qrCodeData) {
      ticketDoc.qrCodeData = `ticket:${ticketDoc._id.toString()}`;
      await ticketDoc.save();
    }

    // fetch monastery for PDF
    let monastery = null;
    try {
      monastery = await Monastery.findById(ticketDoc.monastery).lean();
    } catch (e) {
      monastery = null;
    }

    // generate pdf
    const pdfBuffer = await generateTicketPDFBuffer(ticketDoc.toObject ? ticketDoc.toObject() : ticketDoc, monastery);

    // optionally upload to cloudinary
    let cloudUrl = null;
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        const publicId = `ticket-${ticketDoc._id.toString()}`;
        const res = await uploadBufferToCloudinary(pdfBuffer, publicId);
        cloudUrl = res.secure_url || res.url;
        await Ticket.findByIdAndUpdate(ticketDoc._id, { pdfUrl: cloudUrl, pdfSentAt: new Date() });
      }
    } catch (err) {
      console.error("Cloudinary upload failed:", err?.message || err);
    }

    // optionally send email
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const subject = `Your Monastery360 Ticket — ${monastery?.name || "Visit"}`;
        const text = `Hello ${purchaserName},\n\nAttached is your ticket for ${monastery?.name || "your visit"} on ${new Date(visitDate).toLocaleDateString()}.\n\nThanks,\nMonastery360`;
        const info = await sendEmailWithAttachment(ticketDoc.purchaserEmail, subject, text, pdfBuffer, `ticket-${ticketDoc._id}.pdf`);
        if (info) await Ticket.findByIdAndUpdate(ticketDoc._id, { emailSentAt: new Date() });
      } else {
        // Save locally for debugging if SMTP not configured
        const outPath = path.join(process.cwd(), `ticket-${ticketDoc._id}.pdf`);
        fs.writeFileSync(outPath, pdfBuffer);
        console.info("SMTP not configured — saved local PDF:", outPath);
      }
    } catch (err) {
      console.error("Email send failed:", err?.message || err);
    }

    const final = await Ticket.findById(ticketDoc._id).lean();
    return NextResponse.json({ ok: true, ticket: final }, { status: 201 });
  } catch (err) {
    console.error("POST /api/tickets error:", err);
    return NextResponse.json({ error: "Server error", detail: err?.message || String(err) }, { status: 500 });
  }
}
