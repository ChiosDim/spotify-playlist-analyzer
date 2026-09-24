import { describe, it, expect } from "@jest/globals";
import { computeStats, calculateAudioFeatures } from "../analyzer/stats.js";
import Track from "../models/Track.js";

describe("computeStats", () => {
  it("returns zeros for empty input", () => {
    expect(computeStats([], 5)).toEqual({
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      stdDev: 0,
      valid: 0,
      total: 5,
    });
  });

  it("computes mean/median/min/max/stdDev for odd-length arrays", () => {
    const s = computeStats([1, 2, 3, 4, 5], 5);
    expect(s.mean).toBe(3);
    expect(s.median).toBe(3);
    expect(s.min).toBe(1);
    expect(s.max).toBe(5);
    expect(s.stdDev).toBeCloseTo(1.5811, 3);
    expect(s.valid).toBe(5);
  });

  it("computes median for even-length arrays", () => {
    const s = computeStats([1, 2, 3, 4], 4);
    expect(s.median).toBe(2.5);
  });

  it("returns stdDev=0 for a single value", () => {
    expect(computeStats([5], 1).stdDev).toBe(0);
  });
});

describe("calculateAudioFeatures", () => {
  it("ignores zero values (missing data)", () => {
    const tracks = [
      new Track({ danceability: 0.5, tempo: 120 }),
      new Track({ danceability: 0.7, tempo: 0 }),
      new Track({ danceability: 0, tempo: 130 }),
    ];
    const features = calculateAudioFeatures(tracks);
    expect(features.danceability.valid).toBe(2);
    expect(features.danceability.mean).toBeCloseTo(0.6);
    expect(features.tempo.valid).toBe(2);
    expect(features.tempo.total).toBe(3);
  });

  it("includes negative loudness values", () => {
    const tracks = [
      new Track({ loudness: -5 }),
      new Track({ loudness: -10 }),
      new Track({ loudness: 0 }), // treated as missing
    ];
    const features = calculateAudioFeatures(tracks);
    expect(features.loudness.valid).toBe(2);
    expect(features.loudness.min).toBe(-10);
    expect(features.loudness.max).toBe(-5);
  });

  it("includes zero values for key and mode", () => {
    const tracks = [new Track({ key: 0, mode: 0 }), new Track({ key: 5, mode: 1 })];
    const features = calculateAudioFeatures(tracks);
    expect(features.key.valid).toBe(2);
    expect(features.mode.valid).toBe(2);
  });
});
