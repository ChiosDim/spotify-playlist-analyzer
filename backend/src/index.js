import "./instrument.mjs";
import "dotenv/config";
import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { disconnectRedis } from "./config/redis.js";

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Backend running on http://127.0.0.1:${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`[shutdown] received ${signal}`);
    server.close(async () => {
      await disconnectDB();
      await disconnectRedis();
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("Fatal startup error:", err);
  throw err;
});
