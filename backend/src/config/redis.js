import Redis from "ioredis";

let client;

export function getRedis() {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    client.on("connect", () => console.log("[redis] connecting…"));
    client.on("ready", () => console.log("[redis] ready"));
    client.on("error", (err) => console.error("[redis] error:", err.message));
    client.on("close", () => console.warn("[redis] connection closed"));
  }
  return client;
}

export async function disconnectRedis() {
  if (client) {
    await client.quit();
    client = null;
    console.log("[redis] client quit");
  }
}
