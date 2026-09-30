import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import app from "../app.js";

describe("Auth routes", () => {
  it("GET /api/auth/me returns null when not logged in", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();
  });

  it("GET /api/auth/spotify redirects to Spotify", async () => {
    const res = await request(app).get("/api/auth/spotify");
    expect([302, 303]).toContain(res.status);
    expect(res.headers.location).toContain("accounts.spotify.com/authorize");
  });

  it("POST /api/auth/logout returns success", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
  });
});

describe("Spotify routes require auth", () => {
  it("GET /api/spotify/playlists returns 401 when not logged in", async () => {
    const res = await request(app).get("/api/spotify/playlists");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("AUTH_REQUIRED");
  });

  it("POST /api/spotify/analyze returns 401 when not logged in", async () => {
    const res = await request(app).post("/api/spotify/analyze").send({ playlistId: "any" });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("AUTH_REQUIRED");
  });
});
