import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import app from "../app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");

const FILE_A = path.join(FIXTURES, "playlist-a.csv");
const FILE_B = path.join(FIXTURES, "playlist-b.csv");
const EMPTY = path.join(FIXTURES, "empty.csv");

/* ------------------------------------------------------------------ */
/* Health                                                             */
/* ------------------------------------------------------------------ */

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
  });
});

/* ------------------------------------------------------------------ */
/* /api/analyze                                                       */
/* ------------------------------------------------------------------ */

describe("POST /api/analyze", () => {
  it("returns genre distribution and audio features", async () => {
    const res = await request(app).post("/api/analyze").attach("playlist", FILE_A);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data.filename).toBe("playlist-a.csv");
    expect(data.trackCount).toBe(6);
    expect(Object.keys(data.genreDistribution)).toEqual(
      expect.arrayContaining(["Pop", "Rock", "Jazz"])
    );
    expect(data.topGenres[0]).toHaveProperty("genre");
    expect(data.topGenres[0]).toHaveProperty("count");
    expect(data.audioFeatures.danceability).toMatchObject({
      valid: expect.any(Number),
      total: 6,
    });
  });

  it("returns 400 when no file is uploaded", async () => {
    const res = await request(app).post("/api/analyze");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("NO_FILE");
  });

  it("returns 400 for an empty CSV (header only)", async () => {
    const res = await request(app).post("/api/analyze").attach("playlist", EMPTY);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("NO_VALID_TRACKS");
  });
});

/* ------------------------------------------------------------------ */
/* /api/duplicates                                                    */
/* ------------------------------------------------------------------ */

describe("POST /api/duplicates", () => {
  it("finds the track name and artist duplicate in playlist-a.csv", async () => {
    const res = await request(app).post("/api/duplicates").attach("playlist", FILE_A);

    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(data.trackCount).toBe(6);
    expect(data.totalDuplicateGroups).toBeGreaterThanOrEqual(1);
    expect(data.totalDuplicateTracks).toBeGreaterThanOrEqual(2);

    const group = data.duplicateGroups.find((g) => g.reason === "Track name and artist match");
    expect(group).toBeDefined();
    expect(group.tracks).toHaveLength(2);
  });

  it("returns zero duplicates for playlist-b.csv", async () => {
    const res = await request(app).post("/api/duplicates").attach("playlist", FILE_B);

    expect(res.status).toBe(200);
    expect(res.body.data.totalDuplicateGroups).toBe(0);
    expect(res.body.data.duplicateGroups).toEqual([]);
  });

  it("returns 400 when no file is uploaded", async () => {
    const res = await request(app).post("/api/duplicates");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("NO_FILE");
  });
});

/* ------------------------------------------------------------------ */
/* /api/compare                                                       */
/* ------------------------------------------------------------------ */

describe("POST /api/compare", () => {
  it("finds the shared track between two playlists", async () => {
    const res = await request(app)
      .post("/api/compare")
      .attach("playlists", FILE_A)
      .attach("playlists", FILE_B);

    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(data.playlists).toHaveLength(2);
    expect(data.trackCounts).toEqual([6, 3]);
    expect(data.commonTracks.map((t) => t.uri)).toContain("spotify:track:3");
    expect(data.uniqueTracksPerPlaylist).toHaveLength(2);
  });

  it("returns 400 when only one file is uploaded", async () => {
    const res = await request(app).post("/api/compare").attach("playlists", FILE_A);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("NOT_ENOUGH_FILES");
  });

  it("returns 400 when no files are uploaded", async () => {
    const res = await request(app).post("/api/compare");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("NOT_ENOUGH_FILES");
  });
});

/* ------------------------------------------------------------------ */
/* /api/similar-tracks                                                */
/* ------------------------------------------------------------------ */

describe("POST /api/similar-tracks", () => {
  it("returns similar track pairs for a playlist", async () => {
    const res = await request(app)
      .post("/api/similar-tracks?minScore=0.3&perTrack=2")
      .attach("playlist", FILE_A);

    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(data.trackCount).toBe(6);
    expect(data.minScore).toBe(0.3);
    expect(data.perTrack).toBe(2);
    expect(Array.isArray(data.similarTracks)).toBe(true);
    expect(typeof data.similarTrackCount).toBe("number");

    if (data.similarTracks.length > 0) {
      const pair = data.similarTracks[0];
      // Every pair must have BOTH a source and a match
      expect(pair).toHaveProperty("source");
      expect(pair).toHaveProperty("match");
      expect(pair).toHaveProperty("reason");
      expect(pair.source).toHaveProperty("name");
      expect(pair.match).toHaveProperty("name");
      expect(pair.similarityScore).toBeGreaterThanOrEqual(0.3);
    }
  });

  it("uses default query params when omitted", async () => {
    const res = await request(app).post("/api/similar-tracks").attach("playlist", FILE_A);
    expect(res.status).toBe(200);
    expect(res.body.data.minScore).toBe(0.5);
    expect(res.body.data.perTrack).toBe(2);
  });

  it("rejects invalid minScore (out of range)", async () => {
    const res = await request(app)
      .post("/api/similar-tracks?minScore=2")
      .attach("playlist", FILE_A);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when no file is uploaded", async () => {
    const res = await request(app).post("/api/similar-tracks");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("NO_FILE");
  });
});

/* ------------------------------------------------------------------ */
/* 404 and unknown routes                                             */
/* ------------------------------------------------------------------ */

describe("Unknown routes", () => {
  it("returns 404 with structured error for unknown paths", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});
