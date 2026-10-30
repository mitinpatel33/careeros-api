const mongoose = require("mongoose");

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

const connectDB = async () => {
  // fast path: already connected, no awaits
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 1, // keep one warm socket
        maxIdleTimeMS: 60000,
        family: 4, // avoids slow IPv6 lookups (esp. on Windows)
        // never build indexes on cold start in production (see scripts/syncIndexes.js)
        autoIndex: process.env.NODE_ENV !== "production",
      })
      .then((m) => {
        console.log("MongoDB Connected Successfully");
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error("MongoDB connection error:", err.message);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }
  return cached.conn;
};

module.exports = connectDB;
