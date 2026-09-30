import session from "express-session";
import { RedisStore } from "connect-redis";
import { getRedis } from "../config/redis.js";

export function buildSessionMiddleware() {
  if (process.env.NODE_ENV === "test") {
    return session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
    });
  }
  const redis = getRedis();
  
  const store = new RedisStore({
    client: redis,
    prefix: "sess:",
    ttl: 60 * 60 * 24 * 7, // 7 days
  });

  const isProd = process.env.NODE_ENV === "production";

  return session({
    store,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "spa.sid", // don't advertise "connect.sid"
    rolling: true, // reset TTL on every request
    cookie: {
      httpOnly: true,
      secure: isProd, // HTTPS only in prod
      sameSite: isProd ? "none" : "lax", // cross-site in prod (Vercel <-> Fly)
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: isProd ? undefined : undefined,
    },
  });
}
