import { describe, it, expect } from "@jest/globals";
import { findSimilarInPool } from "../analyzer/similarTracks.js";
import Track from "../models/Track.js";

const mk = (name, artist, features = {}) =>
  new Track({
    uri: `u:${name}`,
    name,
    artists: artist,
    danceability: 0.7,
    energy: 0.8,
    valence: 0.6,
    tempo: 120,
    acousticness: 0.1,
    liveness: 0.2,
    speechiness: 0.05,
    ...features,
  });

describe("findSimilarInPool", () => {
  it("returns [] for empty source or pool", () => {
    expect(findSimilarInPool([], [mk("A", "X")])).toEqual([]);
    expect(findSimilarInPool([mk("A", "X")], [])).toEqual([]);
  });

  it("excludes pool tracks that are already in the source", () => {
    const source = [mk("Sunrise", "Artist A")];
    const pool = [
      mk("Sunrise", "Artist A"), // duplicate of source
      mk("Neon", "Artist B", { danceability: 0.72 }),
    ];
    const matches = findSimilarInPool(source, pool, { minScore: 0.5 });
    const names = matches.map((m) => m.track.name);
    expect(names).not.toContain("Sunrise");
    expect(names).toContain("Neon");
  });

  it("deduplicates matches returned for multiple seeds", () => {
    const source = [mk("SeedA", "X"), mk("SeedB", "Y")];
    const pool = [mk("CommonMatch", "Z")];
    const matches = findSimilarInPool(source, pool, { minScore: 0.5 });
    expect(matches).toHaveLength(1);
  });

  it("respects minScore", () => {
    const source = [mk("A", "X")];
    const pool = [mk("B", "Y", { danceability: 0.1, energy: 0.1, valence: 0.1 })];
    const matches = findSimilarInPool(source, pool, { minScore: 0.99 });
    expect(matches).toEqual([]);
  });
});
