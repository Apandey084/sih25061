import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  audioUrl: { type: String, required: true },
});

const vrTourSchema = new mongoose.Schema(
  {
    monastery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Monastery",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    rooms: { type: [roomSchema], required: true },
  },
  { timestamps: true }
);

export default mongoose.models.VRTour || mongoose.model("VRTour", vrTourSchema);
