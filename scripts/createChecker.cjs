// scripts/createChecker.cjs
// Usage: node scripts/createChecker.cjs email password "Full Name"
// Example: node scripts/createChecker.cjs checker@example.com MySecret123 "Akash Kumar"

require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function ensureDB(uri) {
  if (!uri) throw new Error("MONGO_URI not provided. Set MONGO_URI in .env.local or env.");
  // If already connected, no-op
  if (mongoose.connection && mongoose.connection.readyState && mongoose.connection.readyState !== 0) {
    console.log("✅ Mongoose already connected");
    return;
  }
  // Connect WITHOUT unsupported legacy options
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB");
}

function tryRequireModel(path) {
  try {
    const mod = require(path);
    return mod && (mod.default || mod);
  } catch (err) {
    return null;
  }
}

function createFallbackCheckerModel() {
  const schema = new mongoose.Schema(
    {
      name: String,
      email: { type: String, index: true, unique: true },
      passwordHash: String,
      role: { type: String, default: "checker" },
      approved: { type: Boolean, default: false },
      active: { type: Boolean, default: true },
      tempPasswordSet: { type: Boolean, default: false },
    },
    { timestamps: true }
  );
  return mongoose.models.CheckerUser || mongoose.model("CheckerUser", schema);
}

function createFallbackUserModel() {
  const schema = new mongoose.Schema(
    {
      name: String,
      email: { type: String, index: true, unique: true },
      passwordHash: String,
      role: { type: String, default: "user" },
      approved: { type: Boolean, default: false },
      active: { type: Boolean, default: true },
      tempPasswordSet: { type: Boolean, default: false },
    },
    { timestamps: true }
  );
  return mongoose.models.User || mongoose.model("User", schema);
}

(async function main() {
  try {
    const argv = process.argv.slice(2);
    const email = argv[0];
    const password = argv[1];
    const nameArg = argv.slice(2).join(" ") || "Checker";

    if (!email || !password) {
      console.error("Usage: node scripts/createChecker.cjs email password \"Full Name\"");
      process.exit(1);
    }

    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.mongo_uri;
    if (!MONGO_URI) {
      console.error("Missing MONGO_URI in environment or .env.local");
      process.exit(1);
    }

    await ensureDB(MONGO_URI);

    // Try project's CheckerUser model first, then User model
    let CheckerUser = tryRequireModel("../lib/models/CheckerUser") || tryRequireModel("./lib/models/CheckerUser") || tryRequireModel("../lib/models/CheckerUser.js");
    let User = tryRequireModel("../lib/models/User") || tryRequireModel("./lib/models/User") || tryRequireModel("../lib/models/User.js");

    if (!CheckerUser) {
      CheckerUser = createFallbackCheckerModel();
      console.log("⚠️  CheckerUser model not found in project — using fallback model.");
    }
    if (!User) {
      User = createFallbackUserModel();
      console.log("⚠️  User model not found in project — using fallback model.");
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Check if there's a user with this email in User collection
    const existingUser = await User.findOne({ email: normalizedEmail }).lean().catch(() => null);

    if (existingUser) {
      // If existing is a checker (or role === 'checker') update passwordHash + approve
      if (existingUser.role === "checker") {
        const hashed = await bcrypt.hash(String(password), 10);
        const updated = await User.findOneAndUpdate(
          { email: normalizedEmail },
          { passwordHash: hashed, approved: true, active: true, updatedAt: new Date() },
          { new: true }
        ).select("-password -passwordHash");
        console.log(`✅ Checker updated (email already present). Email: ${normalizedEmail}`);
        console.log("Result:", { id: updated?._id, email: updated?.email, name: updated?.name, role: updated?.role });
        process.exit(0);
      } else {
        console.error(
          `❌ A user with email ${normalizedEmail} already exists with role '${existingUser.role}'. Will not overwrite.`
        );
        process.exit(2);
      }
    }

    // If no existing user, create new checker record (prefer CheckerUser model)
    const hashed = await bcrypt.hash(String(password), 10);

    let created;
    // If CheckerUser model file exists and modelName matches, create there
    try {
      const modelName = CheckerUser && CheckerUser.modelName;
      if (modelName && modelName === "CheckerUser") {
        created = await CheckerUser.create({
          name: nameArg,
          email: normalizedEmail,
          passwordHash: hashed,
          role: "checker",
          approved: true,
          active: true,
        });
        console.log("✅ Created new CheckerUser:", { id: created._id, email: created.email });
      } else {
        // fallback: create in User collection with role checker
        created = await User.create({
          name: nameArg,
          email: normalizedEmail,
          passwordHash: hashed,
          role: "checker",
          approved: true,
          active: true,
        });
        console.log("✅ Created new User (role=checker):", { id: created._id, email: created.email });
      }
    } catch (err) {
      // handle duplicate key gracefully
      if (err && err.code === 11000) {
        console.error("❌ Duplicate key error — an entry with this email already exists.");
        process.exit(3);
      }
      throw err;
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating checker:", err && (err.message || err));
    process.exit(1);
  }
})();
