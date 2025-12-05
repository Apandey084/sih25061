// // scripts/resendTicketFlexible.cjs
// // Usage:
// //  node scripts/resendTicketFlexible.cjs --id <TICKET_ID>
// //  node scripts/resendTicketFlexible.cjs --email user@example.com --date 2025-11-22

// require("dotenv").config({ path: ".env.local" });
// const mongoose = require("mongoose");
// const fs = require("fs");
// const path = require("path");
// const PDFDocument = require("pdfkit");
// const qrcode = require("qrcode");
// const nodemailer = require("nodemailer");
// const cloudinary = require("cloudinary").v2;
// const streamifier = require("streamifier");

// // Load models (CJS-safe)
// let Ticket = require("../lib/models/Ticket");
// Ticket = Ticket.default || Ticket;
// let Monastery = require("../lib/models/Monastery");
// Monastery = Monastery.default || Monastery;

// function parseArgs() {
//   const args = process.argv.slice(2);
//   const out = {};
//   for (let i = 0; i < args.length; i++) {
//     const a = args[i];
//     if (a === "--id" && args[i + 1]) { out.id = args[++i]; continue; }
//     if (a === "--email" && args[i + 1]) { out.email = args[++i]; continue; }
//     if (a === "--date" && args[i + 1]) { out.date = args[++i]; continue; }
//   }
//   return out;
// }

// async function connectDB() {
//   const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;
//   if (!MONGO_URI) {
//     console.error("MONGO_URI missing in .env.local");
//     process.exit(1);
//   }
//   await mongoose.connect(MONGO_URI);
//   console.log("✅ Connected to MongoDB");
// }

// function generateTicketPDFBuffer(ticket, monastery) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ size: "A4", margin: 50 });
//       const buffers = [];
//       doc.on("data", (d) => buffers.push(d));
//       doc.on("end", () => resolve(Buffer.concat(buffers)));

//       // Header
//       doc.fontSize(20).text("Monastery360 — Ticket", { align: "center" });
//       doc.moveDown();

//       // Ticket details
//       doc.fontSize(12).text(`Ticket ID: ${ticket._id}`);
//       doc.text(`Monastery: ${monastery?.name || ticket.monastery}`);
//       doc.text(`Name: ${ticket.purchaserName}`);
//       doc.text(`Email: ${ticket.purchaserEmail}`);
//       doc.text(`Visit Date: ${ticket.visitDate ? new Date(ticket.visitDate).toLocaleDateString() : "—"}`);
//       doc.text(`Visitors: ${ticket.numVisitors}`);
//       doc.text(`Total Price: ₹${ticket.totalPrice}`);
//       doc.text(`Payment status: ${ticket.paymentStatus || "pending"}`);
//       doc.moveDown();

//       // QR code
//       const qrData = ticket.qrCodeData || `ticket:${ticket._id}`;
//       const qrDataUrl = await qrcode.toDataURL(qrData, { margin: 1, scale: 6 });
//       const base64 = qrDataUrl.split(",")[1];
//       const imgBuffer = Buffer.from(base64, "base64");
//       doc.image(imgBuffer, { fit: [150, 150], align: "left" });
//       doc.moveDown(2);

//       doc.fontSize(10).text(
//         "Present this ticket QR to checker at entry. This ticket is valid only for the selected date.",
//         { width: 450 }
//       );

//       doc.end();
//     } catch (err) {
//       reject(err);
//     }
//   });
// }

// function uploadBufferToCloudinary(buffer, publicId) {
//   return new Promise((resolve, reject) => {
//     if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
//       return reject(new Error("Cloudinary env missing"));
//     }

//     cloudinary.config({
//       cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//       api_key: process.env.CLOUDINARY_API_KEY,
//       api_secret: process.env.CLOUDINARY_API_SECRET,
//       secure: true,
//     });

//     const uploadStream = cloudinary.uploader.upload_stream(
//       { resource_type: "auto", public_id: publicId, folder: "tickets" },
//       (error, result) => {
//         if (error) return reject(error);
//         resolve(result);
//       }
//     );
//     streamifier.createReadStream(buffer).pipe(uploadStream);
//   });
// }

// async function sendEmailWithAttachment(toEmail, subject, text, pdfBuffer, filename = "ticket.pdf") {
//   if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
//     console.warn("SMTP config missing — skipping email send");
//     return null;
//   }

//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT || 587),
//     secure: (process.env.SMTP_SECURE === "true") || false,
//     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
//   });

//   const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

//   const info = await transporter.sendMail({
//     from,
//     to: toEmail,
//     subject,
//     text,
//     attachments: [{ filename, content: pdfBuffer, contentType: "application/pdf" }],
//   });

//   return info;
// }

// (async function main() {
//   try {
//     const { id, email, date } = parseArgs();
//     if (!id && !(email && date)) {
//       console.error("Usage:");
//       console.error("  node scripts/resendTicketFlexible.cjs --id <TICKET_ID>");
//       console.error('  node scripts/resendTicketFlexible.cjs --email user@example.com --date 2025-11-22');
//       process.exit(1);
//     }

//     await connectDB();

//     // find ticket(s)
//     let tickets = [];
//     if (id) {
//       const t = await Ticket.findById(id).lean();
//       if (!t) { console.error("Ticket not found:", id); process.exit(1); }
//       tickets = [t];
//     } else {
//       // parse date into start/end UTC
//       const dt = new Date(date);
//       if (isNaN(dt.getTime())) {
//         console.error("Invalid date format. Use YYYY-MM-DD or full ISO date.");
//         process.exit(1);
//       }
//       const start = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 0, 0, 0));
//       const end = new Date(start.getTime() + 24 * 3600 * 1000);
//       tickets = await Ticket.find({
//         purchaserEmail: String(email).toLowerCase(),
//         visitDate: { $gte: start, $lt: end },
//       }).lean();
//       if (!tickets.length) {
//         console.error("No tickets found for that email + date.");
//         process.exit(1);
//       }
//     }

//     for (const ticket of tickets) {
//       console.log("Processing ticket:", ticket._id);

//       // load monastery doc if possible
//       let monastery = null;
//       try { monastery = await Monastery.findById(ticket.monastery).lean(); } catch (e) {}

//       // generate PDF
//       const pdfBuffer = await generateTicketPDFBuffer(ticket, monastery);
//       console.log("PDF generated bytes:", pdfBuffer.length);

//       // try Cloudinary upload
//       let uploadedUrl = null;
//       if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
//         try {
//           const publicId = `ticket-${ticket._id.toString()}`;
//           const res = await uploadBufferToCloudinary(pdfBuffer, publicId);
//           uploadedUrl = res.secure_url || res.url;
//           console.log("Uploaded to Cloudinary:", uploadedUrl);

//           // update ticket doc
//           await Ticket.findByIdAndUpdate(ticket._id, { pdfUrl: uploadedUrl, pdfSentAt: new Date() });
//           console.log("Ticket updated with pdfUrl");
//         } catch (err) {
//           console.error("Cloudinary upload failed:", err.message || err);
//         }
//       } else {
//         const out = path.join(process.cwd(), `ticket-${ticket._id}.pdf`);
//         fs.writeFileSync(out, pdfBuffer);
//         console.log("Saved PDF locally:", out);
//       }

//       // send email if SMTP present
//       if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
//         const subject = `Your Monastery360 Ticket — ${monastery?.name || "Visit"}`;
//         const text = `Hello ${ticket.purchaserName},\n\nAttached is your Monastery360 ticket for ${monastery?.name || "your visit"} on ${ticket.visitDate ? new Date(ticket.visitDate).toLocaleDateString() : date}.\n\nThank you.`;
//         try {
//           const info = await sendEmailWithAttachment(ticket.purchaserEmail, subject, text, pdfBuffer, `ticket-${ticket._id}.pdf`);
//           console.log("Email sent. MessageId:", info && info.messageId);
//           await Ticket.findByIdAndUpdate(ticket._id, { emailSentAt: new Date() });
//         } catch (err) {
//           console.error("Email send failed:", err.message || err);
//         }
//       } else {
//         console.log("SMTP not configured — skipped email send.");
//       }
//     }

//     console.log("All done.");
//     process.exit(0);
//   } catch (err) {
//     console.error("Fatal error:", err);
//     process.exit(1);
//   }
// })();
