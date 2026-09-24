import { describe, it, expect } from "@jest/globals";
import { calculateSimilarity, generateRecommendations } from "../analyzer/recommend.js";
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

console.log("A-B", calculateSimilarity(A, B));
console.log("A-C", calculateSimilarity(A, C));
console.log("B-C", calculateSimilarity(B, C));

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

describe("generateRecommendations", () => {
  it("returns [] for fewer than 2 tracks", () => {
    expect(generateRecommendations([])).toEqual([]);
    expect(generateRecommendations([A])).toEqual([]);
  });

  it("recommends similar tracks above the minimum score", () => {
    const recs = generateRecommendations([A, B, C], { minScore: 0.5 });
    const uris = recs.map((r) => r.track.uri);
    expect(uris).toContain("u2"); // B is similar to A
    expect(uris).not.toContain("u3"); // C is not similar enough
  });

  it("does not return the same track twice", () => {
    const recs = generateRecommendations([A, B, C]);
    const uris = recs.map((r) => r.track.uri);
    expect(new Set(uris).size).toBe(uris.length);
  });
});
