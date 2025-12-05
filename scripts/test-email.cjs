// scripts/test-email.cjs
require("dotenv").config({ path: ".env.local" });
const nodemailer = require("nodemailer");

async function run() {
  if (!process.env.SMTP_HOST) {
    console.error("Missing SMTP_HOST in .env.local");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    // verify connection
    await transporter.verify();
    console.log("SMTP verified OK");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // send to self for test
      subject: "Test email from Monastery360",
      text: "This is a test email. If you receive it, SMTP is working.",
    });
    console.log("Sent:", info.messageId || info);
  } catch (err) {
    console.error("SMTP test failed:", err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();
