import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || process.env.mongo_uri || process.env.MONGO_URI;
if (!uri) {
  throw new Error("Please set MONGODB_URI (or MONGO_URI) in your environment");
}

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

export default async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 }).then(m => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}