// // lib/models/User.js
// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: false },
//     role: {
//       type: String,
//       enum: ["user", "admin", "checker"],
//       default: "user",
//     },
//   },
//   { timestamps: true }
// );

// // ✅ Prevent OverwriteModelError in Next.js
// export default mongoose.models.User || mongoose.model("User", userSchema);


// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({
//   name: String,
//   email: { type: String, required: true, unique: true },
//   password: { type: String },
//   role: { type: String, enum: ["admin", "checker", "user"], default: "user" },
//   approved: { type: Boolean, default: false },
//   tempPasswordSet: { type: Boolean, default: false }, // 👈 NEW
// });

// export default mongoose.models.User || mongoose.model("User", userSchema);


import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: "user" },
    approved: { type: Boolean, default: true },
     tempPasswordSet: { type: Boolean, default: false }, // 👈 NEW

    // Reset password fields
    resetToken: String,
    resetTokenExpiry: Date,
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
