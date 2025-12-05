// // scripts/createAdmin.cjs

// require("dotenv").config({ path: ".env.local" });
// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// let User = require("../lib/models/User");
// User = User.default || User;


// (async () => {
//   console.log("🔍 Starting createAdmin script...");

//   const MONGO_URI = process.env.MONGO_URI;
//   console.log("MONGO_URI =", MONGO_URI);

//   if (!MONGO_URI) {
//     console.error("❌ MONGO_URI missing in .env.local");
//     process.exit(1);
//   }

//   try {
//     // 🧠 Connect to MongoDB
//     await mongoose.connect(MONGO_URI);
//     console.log("✅ Connected to MongoDB");

//     // 🧍‍♂️ Admin credentials — customize if needed
//     const adminEmail = "admin@monastery.in";
//     const adminPassword = "Admin@123"; // You can change this later in DB
//     const adminName = "Super Admin";

//     // 🧩 Check if admin already exists
//     const existing = await User.findOne({ email: adminEmail });
//     if (existing) {
//       console.log("⚠️ Admin already exists:", adminEmail);
//       process.exit(0);
//     }

//     // 🔐 Hash password
//     const hashed = await bcrypt.hash(adminPassword, 10);

//     // 🏗️ Create admin
//     const admin = await User.create({
//       name: adminName,
//       email: adminEmail,
//       password: hashed,
//       role: "admin",
//     });

//     console.log("✅ Admin created successfully:");
//     console.log(admin);

//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Error creating admin:", err);
//     process.exit(1);
//   }
// })();


// scripts/createAdmin.cjs
require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Load User model
let User = require("../lib/models/User");
User = User.default || User;

(async () => {
  console.log("🚀 Starting createAdmin script...");

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("❌ Missing MONGO_URI in .env.local");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // ---- EDIT HERE ----
  const adminEmail = "atulrkgit084@gmail.com";
  const adminPassword = "Akp@3511";
  const adminName = "ATUL PANDEY";
  // -------------------

  // Find user by email
  const existing = await User.findOne({ email: adminEmail });

  if (existing) {
    const storedHash = existing.passwordHash || existing.password || "";
    const isPasswordMatch = await bcrypt.compare(adminPassword, storedHash);

    if (isPasswordMatch && existing.role === "admin") {
      console.log("⚠️ Admin already exists with SAME email, password & role.");
      process.exit(0);
    }
  }

  // Create NEW ADMIN
  const hashed = await bcrypt.hash(adminPassword, 10);

  const newAdmin = await User.create({
    name: adminName,
    email: adminEmail,
    password: hashed,
    role: "admin",
  });

  console.log("✅ New Admin Created Successfully:");
  console.log({
    id: newAdmin._id.toString(),
    name: newAdmin.name,
    email: newAdmin.email,
    role: newAdmin.role,
  });

  process.exit(0);
})();
