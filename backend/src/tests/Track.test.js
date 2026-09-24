import { describe, it, expect } from "@jest/globals";
import Track from "../models/Track.js";

describe("Track", () => {
  it("constructs from an empty object with safe defaults", () => {
    const t = new Track();
    expect(t.uri).toBe("");
    expect(t.name).toBe("");
    expect(t.durationMs).toBe(0);
    expect(t.explicit).toBe(false);
    expect(t.isValid()).toBe(false);
  });

  it("isValid requires uri, name, and artists", () => {
    expect(new Track({ uri: "x", name: "y" }).isValid()).toBe(false);
    expect(new Track({ uri: "x", name: "y", artists: "z" }).isValid()).toBe(true);
  });

  it("coerces numeric strings to numbers", () => {
    const t = new Track({ durationMs: "180000", tempo: "120.5", explicit: true });
    expect(t.durationMs).toBe(180000);
    expect(t.tempo).toBe(120.5);
    expect(t.explicit).toBe(true);
  });

  it("drops non-numeric strings gracefully", () => {
    const t = new Track({ durationMs: "not-a-number", tempo: "abc" });
    expect(t.durationMs).toBe(0);
    expect(t.tempo).toBe(0);
  });

  it("trackKey() prefers URI over name/artist", () => {
    const a = new Track({ uri: "spotify:track:1", name: "A", artists: "B" });
    const b = new Track({ name: "A", artists: "B" });
    expect(a.trackKey()).toBe("spotify:track:1");
    expect(b.trackKey()).toBe("a|b");
  });

  it("fromCSVRow maps Exportify columns correctly", () => {
    const row = {
      "Track URI": "spotify:track:xyz",
      "Track Name": "Bohemian Rhapsody",
      "Artist Names": "Queen",
      "Album Name": "A Night at the Opera",
      "Duration (ms)": "354000",
      Popularity: "88",
      Explicit: "false",
      Danceability: "0.39",
      Energy: "0.91",
      Tempo: "144.0",
      "Time Signature": "4",
      Genres: "classic rock, rock",
      "Record Label": "EMI",
    };
    const t = Track.fromCSVRow(row);
    expect(t.uri).toBe("spotify:track:xyz");
    expect(t.name).toBe("Bohemian Rhapsody");
    expect(t.artists).toBe("Queen");
    expect(t.durationMs).toBe(354000);
    expect(t.popularity).toBe(88);
    expect(t.explicit).toBe(false);
    expect(t.danceability).toBe(0.39);
    expect(t.tempo).toBe(144);
    expect(t.timeSignature).toBe(4);
    expect(t.isValid()).toBe(true);
  });
});
