import { describe, it, expect } from "@jest/globals";
import { genreDistribution, topGenres } from "../analyzer/genre.js";
import Track from "../models/Track.js";

describe("genreDistribution", () => {
  it("counts and computes percentages", () => {
    const tracks = [
      new Track({ name: "A", genres: "Pop, Rock" }),
      new Track({ name: "B", genres: "Rock, Hip-Hop" }),
      new Track({ name: "C", genres: "Pop" }),
      new Track({ name: "D", genres: "" }),
      new Track({ name: "E", genres: "   " }),
    ];
    const dist = genreDistribution(tracks);
    expect(dist.Pop).toEqual({ count: 2, percentage: 40 });
    expect(dist.Rock).toEqual({ count: 2, percentage: 40 });
    expect(dist["Hip-Hop"]).toEqual({ count: 1, percentage: 20 });
    expect(Object.keys(dist)).toHaveLength(3);
  });

  it("returns an empty object when no genres are present", () => {
    expect(genreDistribution([])).toEqual({});
    expect(genreDistribution([new Track({ genres: "" })])).toEqual({});
  });
});

describe("topGenres", () => {
  it("returns genres sorted by count, limited to N", () => {
    const dist = {
      Pop: { count: 10, percentage: 40 },
      Rock: { count: 8, percentage: 32 },
      Jazz: { count: 5, percentage: 20 },
      Classical: { count: 2, percentage: 8 },
    };
    const top = topGenres(dist, 2);
    expect(top).toHaveLength(2);
    expect(top[0].genre).toBe("Pop");
    expect(top[1].genre).toBe("Rock");
  });
});
