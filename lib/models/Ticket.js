// import mongoose from "mongoose";

// // const TicketSchema = new mongoose.Schema(
// //   {
// //     // Reference to the Monastery
// //     monastery: { type: mongoose.Schema.Types.ObjectId, ref: "Monastery", required: true },

// //     // Buyer information
// //     purchaserName: { type: String, required: true },
// //     purchaserEmail: { type: String, required: true },

// //     // Visit details
// //     visitDate: { type: Date, required: true },
// //     numVisitors: { type: Number, required: true },
// //     visitors: [{ type: String }], // optional names list

// //     // Payment info
// //     totalPrice: { type: Number, required: true },
// //     paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
// //     razorpay: {
// //       orderId: String,
// //       paymentId: String,
// //       signature: String,
// //     },

// //     // QR + PDF
// //     qrCodeData: String,
// //     pdfUrl: String,

// //     // ✅ New verification fields
// //     isUsed: { type: Boolean, default: false },          // whether this ticket has been used
// //     verifiedAt: { type: Date, default: null },           // when it was used
// //     verifiedBy: {                                       // who verified it (checker user)
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "CheckerUser",
// //       default: null,
// //     },

// //     // (optional) track general lifecycle
// //     createdAt: { type: Date, default: Date.now },
// //     updatedAt: { type: Date, default: Date.now },
// //   },
// //   { timestamps: true } // ensures createdAt / updatedAt auto
// // );
// const TicketSchema = new mongoose.Schema(
//   {
//     monastery: { type: mongoose.Schema.Types.ObjectId, ref: "Monastery" },
//     purchaserName: String,
//     purchaserEmail: String,
//     visitDate: Date,
//     numVisitors: Number,
//     totalPrice: Number,
//     paymentStatus: { type: String, default: "pending" },
//     qrCodeData: String,
//     pdfUrl: String,

//     // ✅ new fields
//     isUsed: { type: Boolean, default: false },
//     verifiedAt: { type: Date, default: null },
//     verifiedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "CheckerUser",
//       default: null,
//     },
//   },
//   { timestamps: true }
// );


// export default mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);


import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema({
  purchaserName: { type: String, required: true },
  purchaserEmail: { type: String, required: true },
  visitDate: { type: Date, required: true },
  numVisitors: { type: Number, default: 1 },
  monastery: { type: mongoose.Schema.Types.ObjectId, ref: "Monastery" },
  isUsed: { type: Boolean, default: false }, // <-- critical default false
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "CheckerUser", default: null },
  createdAt: { type: Date, default: Date.now }
});

// Prevent model overwrite upon hot reload in dev
export default mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
