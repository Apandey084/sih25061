// lib/models/CheckerRequest.js
import mongoose from "mongoose";

const CheckerRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true }, // hashed at request time
  note: { type: String },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  requestedAt: { type: Date, default: () => new Date() },
  reviewedAt: { type: Date, default: null },
  adminId: { type: String, default: null },
});

const CheckerRequest = mongoose.models.CheckerRequest || mongoose.model("CheckerRequest", CheckerRequestSchema);
export default CheckerRequest;
