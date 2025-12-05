// app/api/razorpay/order/route.js
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectDB from "@/lib/mongodb";

/**
 * Expected POST body:
 * { amount: 1000 }   // amount in INR (number)
 *
 * Response (success):
 * { ok: true, order: { id, amount, currency, receipt, ... } }
 *
 * In dev, if RAZORPAY keys missing, returns a safe stub order for local testing.
 */

async function safeParseJSON(req) {
  try {
    return await req.json();
  } catch (err) {
    throw new Error("Invalid JSON body");
  }
}

export async function POST(req) {
  try {
    // parse body
    const body = await safeParseJSON(req);
    const amountINR = body?.amount;

    if (typeof amountINR !== "number" || Number.isNaN(amountINR) || amountINR <= 0) {
      return NextResponse.json({ error: "Invalid amount (number in INR) required" }, { status: 400 });
    }

    // optional: connect DB if you want to log orders or use user session
    try {
      await connectDB();
    } catch (e) {
      // non-fatal: continue even if DB connect fails (but log)
      console.warn("connectDB failed in razorpay order route:", e?.message || e);
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    // If keys missing in dev, return stub order so front-end can proceed for UI testing
    if (!key_id || !key_secret) {
      console.warn("Razorpay keys missing — returning dev stub order");
      const stub = {
        id: `stub_order_${Date.now()}`,
        amount: Math.round(amountINR * 100),
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        status: "created",
      };
      return NextResponse.json({ ok: true, order: stub });
    }

    // Create Razorpay client
    const rz = new Razorpay({
      key_id,
      key_secret,
    });

    // Razorpay expects amount in paise
    const amountPaise = Math.round(amountINR * 100);

    // You can set a receipt id or use a generated one
    const receipt = `rcpt_${Date.now()}`;

    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt,
      payment_capture: 1, // auto-capture
      // optionally add notes: { monasteryId: "...", userId: "..." }
    };

    const order = await rz.orders.create(options);

    // return order object to client
    return NextResponse.json({ ok: true, order });
  } catch (err) {
    console.error("Razorpay order error:", err);
    const message = err?.message || "Failed to create Razorpay order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
