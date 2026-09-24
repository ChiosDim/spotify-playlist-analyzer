import { describe, it, expect } from "@jest/globals";
import { findDuplicates, normalizeKey } from "../analyzer/duplicates.js";
import Track from "../models/Track.js";

describe("normalizeKey", () => {
  it("lowercases, trims, and strips punctuation", () => {
    expect(normalizeKey("Hey, Jude!", "The Beatles")).toBe("hey jude|the beatles");
  });

  it("collapses whitespace", () => {
    expect(normalizeKey("Song   Name", "  Artist  ")).toBe("song name|artist");
  });
});

describe("findDuplicates", () => {
  it("returns [] for fewer than 2 tracks", () => {
    expect(findDuplicates([])).toEqual([]);
    expect(findDuplicates([new Track({ name: "A", artists: "B" })])).toEqual([]);
  });

  it("groups tracks with identical URIs", () => {
    const tracks = [
      new Track({ uri: "spotify:track:1", name: "A", artists: "X" }),
      new Track({ uri: "spotify:track:1", name: "A", artists: "X" }),
      new Track({ uri: "spotify:track:2", name: "B", artists: "Y" }),
    ];
    const groups = findDuplicates(tracks);
    expect(groups).toHaveLength(1);
    expect(groups[0].reason).toBe("Exact URI match");
    expect(groups[0].tracks).toHaveLength(2);
  });

  it("groups tracks with matching name+artist and no URI", () => {
    const tracks = [
      new Track({ name: "Song", artists: "Artist" }),
      new Track({ name: "song", artists: "ARTIST!" }),
      new Track({ name: "Other", artists: "Artist" }),
    ];
    const groups = findDuplicates(tracks);
    expect(groups).toHaveLength(1);
    expect(groups[0].reason).toBe("Track name and artist match");
    expect(groups[0].tracks).toHaveLength(2);
  });

  it("does not double-report URI-matched tracks as name-matched", () => {
    const tracks = [
      new Track({ uri: "spotify:track:1", name: "A", artists: "X" }),
      new Track({ uri: "spotify:track:1", name: "A", artists: "X" }),
    ];
    const groups = findDuplicates(tracks);
    expect(groups).toHaveLength(1);
  });
});
