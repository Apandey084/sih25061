// scripts/seedSample.mjs
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb.js";

import FeaturedMonastery from "../lib/models/FeaturedMonastery.js";
import CheckerUser from "../lib/models/CheckerUser.js";
import Ticket from "../lib/models/Ticket.js";

dotenv.config({ path: ".env.local" });

async function seed() {
  console.log("🌱 Starting Phase 2 seeding...");

  try {
    // 🟢 Connect to MongoDB
    await connectDB();
    console.log("✅ MongoDB connected");

    // 1️⃣ Clear existing sample data (optional but clean)
    await FeaturedMonastery.deleteMany({});
    await CheckerUser.deleteMany({});
    await Ticket.deleteMany({});

    // 2️⃣ Create Featured Monastery
    const monastery = await FeaturedMonastery.create({
      name: "Golden Serenity Monastery",
      description: "A peaceful monastery known for its panoramic golden hall.",
      coverImage:
        "https://example.com/images/golden-monastery.jpg",
      locationAddress: "Dharamshala, Himachal Pradesh, India",
      locationLat: 32.219, // example coordinates
      locationLng: 76.323,
      rooms: [
        {
          name: "Main Prayer Hall",
          imageUrl: "https://example.com/images/hall.jpg",
          audioUrl: "https://example.com/audio/hall.mp3",
        },
        {
          name: "Meditation Garden",
          imageUrl: "https://example.com/images/garden.jpg",
          audioUrl: "https://example.com/audio/garden.mp3",
        },
      ],
      ticketPrice: 100,
      maxCapacityPerDay: 200,
      openTime: "06:00",
      closeTime: "18:00",
      closedDays: ["Monday"],
      verified: true,
      timezone: "Asia/Kolkata",
    });

    console.log(`✅ Created FeaturedMonastery: ${monastery.name}`);

    // 3️⃣ Create Checker User
    const checker = await CheckerUser.create({
      name: "Checker Admin",
      email: "checker@example.com",
      passwordHash: "hashedpassword123", // fake for seed
      role: "checker",
    });

    console.log(`✅ Created CheckerUser: ${checker.email}`);

    // 4️⃣ Create Ticket (matches your schema)
    const ticket = await Ticket.create({
      purchaserName: "Test Visitor",
      purchaserEmail: "visitor@example.com",
      user: checker._id, // required
      monastery: monastery._id, // required
      visitDate: new Date(), // required
      numVisitors: 2, // required
      visitors: [
        { name: "John Doe", age: 30, gender: "Male", nationality: "Indian" },
        { name: "Jane Doe", age: 28, gender: "Female", nationality: "Indian" },
      ],
      totalPrice: 200, // required
      paymentStatus: "paid",
      qrCodeData: "SAMPLE_QR_CODE_12345",
      checkedAt: new Date(),
      checkedBy: checker._id,
      timezone: "Asia/Kolkata",
    });

    console.log(`✅ Created Ticket: ${ticket._id}`);

    // 🌿 Summary
    console.log("\n🌿 Seeding completed successfully!");
    console.log("🧾 Summary:");
    console.table({
      Monastery: monastery.name,
      CheckerUser: checker.email,
      Ticket: ticket._id.toString(),
    });
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

seed();
