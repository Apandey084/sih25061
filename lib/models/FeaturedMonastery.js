import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: String,
  audioUrl: String,
});

const FeaturedMonasterySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    coverImage: String,
    locationAddress: String,
    locationLat: Number,
    locationLng: Number,
    rooms: { type: [RoomSchema], default: [] },
    ticketPrice: { type: Number, default: 0 },
    maxCapacityPerDay: { type: Number, default: 100 },
    openTime: { type: String, default: "06:00" },
    closeTime: { type: String, default: "18:00" },
    closedDays: { type: [String], default: [] },
    timezone: { type: String, default: "Asia/Kolkata" },
    verified: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const FeaturedMonastery =
  mongoose.models.FeaturedMonastery ||
  mongoose.model("FeaturedMonastery", FeaturedMonasterySchema);

export default FeaturedMonastery;
