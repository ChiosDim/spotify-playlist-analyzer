import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import axios from "axios";
import Track from "../models/Track.js";
import { enrichTracksWithAudioFeatures } from "../services/reccoBeatsService.js";

jest.mock("axios");

describe("enrichTracksWithAudioFeatures", () => {
  beforeEach(() => {
    axios.get = jest.fn();
    jest.clearAllMocks();
  });

  it("populates features for matched tracks", async () => {
    // /track -> maps spotify ids to reccobeats ids
    axios.get.mockImplementation((url) => {
      if (url.endsWith("/track")) {
        return Promise.resolve({
          data: { content: [{ id: "r1", spotifyId: "sid1" }] },
        });
      }
      if (url.endsWith("/audio-features")) {
        return Promise.resolve({
          data: {
            content: [
              {
                id: "r1",
                danceability: 0.7,
                energy: 0.8,
                valence: 0.6,
                tempo: 120,
              },
            ],
          },
        });
      }
      return Promise.reject(new Error("unexpected url"));
    });

    const tracks = [new Track({ uri: "spotify:track:sid1", name: "A", artists: "X" })];
    const result = await enrichTracksWithAudioFeatures(tracks);

    expect(result.enriched).toBe(1);
    expect(tracks[0].danceability).toBe(0.7);
    expect(tracks[0].energy).toBe(0.8);
    expect(tracks[0].tempo).toBe(120);
  });

  it("degrades gracefully when ReccoBeats is down", async () => {
    axios.get.mockRejectedValue(new Error("network"));
    const tracks = [new Track({ uri: "spotify:track:sid1", name: "A", artists: "X" })];
    const result = await enrichTracksWithAudioFeatures(tracks);
    expect(result.enriched).toBe(0);
    expect(tracks[0].danceability).toBe(0);
  });
});
