import mongoose from "mongoose";

const CheckerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, default: "checker" },
  approved: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.CheckerUser || mongoose.model("CheckerUser", CheckerSchema);
