import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { resetPasswordEmailTemplate } from "@/lib/mailTemplates";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: "Email required" }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) return Response.json({ error: "No user found" }, { status: 404 });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetURL = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "🔑 Reset your password - Monastery Portal",
      html: resetPasswordEmailTemplate(user.name, resetURL),
    });

    return Response.json({ success: true, message: "Password reset email sent!" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

