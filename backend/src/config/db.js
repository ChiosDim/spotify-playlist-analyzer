import mongoose from "mongoose";

let isConnected = false;

/**
 * Connect to MongoDB with retry-friendly options.
 * Called once from index.js at startup.
 */
export async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in the environment");
  }

  // Deprecated flags ({ useNewUrlParser, useUnifiedTopology }) are omitted —
  // modern Mongoose (7+) enables them by default.
  const options = {
    autoIndex: process.env.NODE_ENV !== "production",
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1,
  };

  try {
    const conn = await mongoose.connect(uri, options);
    isConnected = true;
    console.log(`[mongo] connected to ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      console.warn("[mongo] disconnected — driver will attempt to reconnect");
    });
    mongoose.connection.on("reconnected", () => {
      isConnected = true;
      console.log("[mongo] reconnected");
    });

    return conn;
  } catch (err) {
    isConnected = false;
    console.error("[mongo] initial connection failed:", err.message);
    throw err;
  }
}

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Graceful shutdown — called from SIGTERM handler.
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    isConnected = false;
    console.log("[mongo] connection closed");
  }
}
