// import mongoose from "mongoose";

// const MonasterySchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     location: { type: String, required: true },
//     description: { type: String },
//     image: { type: String },
//     lat: { type: Number },
//     lng: { type: Number },
//   },
//   { timestamps: true }
// );

// export default mongoose.models.Monastery ||
//   mongoose.model("Monastery", MonasterySchema);

// // // lib/models/Monastery.js
// // import mongoose from "mongoose";

// // const MonasterySchema = new mongoose.Schema({
// //   name: { type: String, required: true },
// //   location: { type: String },
// //   description: { type: String },
// //   images: [{ type: String }],
// //   createdAt: { type: Date, default: Date.now },
// // });

// // // Avoid model overwrite on hot reload
// // export default mongoose.models.Monastery || mongoose.model("Monastery", MonasterySchema);

// lib/models/Monastery.js
import mongoose from "mongoose";

const MonasterySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String },
    image: { type: String },         // primary image (string)
    images: [{ type: String }],      // optional array of images
    lat: { type: Number },
    lng: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.models.Monastery || mongoose.model("Monastery", MonasterySchema);
