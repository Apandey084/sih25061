// app/api/debug/echo/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const ct = req.headers.get("content-type") || "";
    const out = { ok: true, contentType: ct, formFields: {}, files: [], jsonBody: null };

    // Try FormData
    if (ct.toLowerCase().includes("multipart/form-data")) {
      const form = await req.formData();
      for (const [k, v] of form.entries()) {
        if (typeof v === "string") {
          out.formFields[k] = v;
        } else {
          // it's a file-like object
          out.files.push({ key: k, name: v.name, type: v.type, size: (await v.arrayBuffer()).byteLength });
        }
      }
      return NextResponse.json(out);
    }

    // Try JSON
    try {
      const j = await req.json();
      out.jsonBody = j;
      return NextResponse.json(out);
    } catch (e) {
      out.jsonBody = null;
    }

    return NextResponse.json(out);
  } catch (err) {
    console.error("DEBUG/echo error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
