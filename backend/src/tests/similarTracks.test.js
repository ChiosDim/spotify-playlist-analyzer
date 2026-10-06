import { describe, it, expect } from "@jest/globals";
import { calculateSimilarity, findSimilarTracks } from "../analyzer/similarTracks.js";
import Track from "../models/Track.js";

const makeTrack = (overrides) => new Track(overrides);

const A = makeTrack({
  uri: "u1",
  name: "A",
  artists: "X",
  danceability: 0.8,
  energy: 0.7,
  valence: 0.6,
  tempo: 120,
  acousticness: 0.1,
  instrumentalness: 0.0,
  liveness: 0.2,
  speechiness: 0.05,
});

const B = makeTrack({
  uri: "u2",
  name: "B",
  artists: "Y",
  danceability: 0.78,
  energy: 0.72,
  valence: 0.58,
  tempo: 122,
  acousticness: 0.12,
  instrumentalness: 0.0,
  liveness: 0.22,
  speechiness: 0.06,
});

const C = makeTrack({
  uri: "u3",
  name: "C",
  artists: "Z",
  danceability: 0.1,
  energy: 0.9,
  valence: 0.1,
  tempo: 180,
  acousticness: 0.9,
  instrumentalness: 0.8,
  liveness: 0.8,
  speechiness: 0.5,
});

describe("calculateSimilarity", () => {
  it("returns a high score for similar tracks", () => {
    const { score } = calculateSimilarity(A, B);
    expect(score).toBeGreaterThan(0.9);
  });

  it("returns a low score for dissimilar tracks", () => {
    const { score } = calculateSimilarity(A, C);
    expect(score).toBeLessThan(0.5);
  });

  it("returns a reason string mentioning similar features", () => {
    const { reason } = calculateSimilarity(A, B);
    expect(reason).toMatch(/similar/);
  });

  it("returns score 0 when no features overlap", () => {
    const empty = makeTrack({ uri: "u0", name: "Empty", artists: "Z" });
    const { score } = calculateSimilarity(empty, empty);
    expect(score).toBe(0);
  });
});

describe("findSimilarTracks", () => {
  it("returns [] for fewer than 2 tracks", () => {
    expect(findSimilarTracks([])).toEqual([]);
    expect(findSimilarTracks([A])).toEqual([]);
  });

  it("returns pairs with both source and match properties", () => {
    const pairs = findSimilarTracks([A, B, C], { minScore: 0.5 });
    expect(pairs.length).toBeGreaterThan(0);

    for (const pair of pairs) {
      expect(pair).toHaveProperty("source");
      expect(pair).toHaveProperty("match");
      expect(pair).toHaveProperty("reason");
      expect(pair).toHaveProperty("similarityScore");
      expect(pair.source).toHaveProperty("uri");
      expect(pair.match).toHaveProperty("uri");
    }
  });

  it("includes B in pairs since it is similar to A", () => {
    const pairs = findSimilarTracks([A, B, C], { minScore: 0.6 });
    const allUris = pairs.flatMap((p) => [p.source.uri, p.match.uri]);
    expect(allUris).toContain("u2");
  });

  it("excludes C since it is not similar enough to anything", () => {
    const pairs = findSimilarTracks([A, B, C], { minScore: 0.6 });
    const allUris = pairs.flatMap((p) => [p.source.uri, p.match.uri]);
    expect(allUris).not.toContain("u3");
  });

  it("does not return the same pair twice (symmetric dedupe)", () => {
    const pairs = findSimilarTracks([A, B], { minScore: 0.5 });
    // A→B and B→A should collapse into one pair
    expect(pairs).toHaveLength(1);
  });

  it("never pairs a track with itself", () => {
    const pairs = findSimilarTracks([A, B], { minScore: 0.5 });
    for (const pair of pairs) {
      expect(pair.source.uri).not.toBe(pair.match.uri);
    }
  });

  it("respects the minScore threshold", () => {
    const pairs = findSimilarTracks([A, B, C], { minScore: 0.99 });
    // Only near-perfect matches survive; A/B won't be this close
    for (const pair of pairs) {
      expect(pair.similarityScore).toBeGreaterThanOrEqual(0.99);
    }
  });
});
