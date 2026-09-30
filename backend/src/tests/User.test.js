import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";

let mongo;
jest.setTimeout(120000);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe("User model", () => {
  it("creates a user with tokens", async () => {
    const user = await User.create({
      spotifyId: "abc",
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: new Date(Date.now() + 3600_000),
    });
    expect(user.spotifyId).toBe("abc");
    expect(user.isTokenExpired()).toBe(false);
  });

  it("flags expired tokens", async () => {
    const user = await User.create({
      spotifyId: "abc",
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(user.isTokenExpired()).toBe(true);
  });

  it("updateTokens persists new values", async () => {
    const user = await User.create({
      spotifyId: "abc",
      accessToken: "old",
      refreshToken: "old-refresh",
      expiresAt: new Date(Date.now() - 1000),
    });
    await user.updateTokens({
      accessToken: "new",
      refreshToken: "new-refresh",
      expiresIn: 3600,
    });
    expect(user.accessToken).toBe("new");
    expect(user.refreshToken).toBe("new-refresh");
    expect(user.isTokenExpired()).toBe(false);
  });
});
