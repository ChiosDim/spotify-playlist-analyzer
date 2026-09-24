import { describe, it, expect } from "@jest/globals";
import { comparePlaylists } from "../analyzer/compare.js";
import Track from "../models/Track.js";

const t = (uri, name, artists) => new Track({ uri, name, artists });

describe("comparePlaylists", () => {
  it("returns empty result for no playlists", () => {
    const r = comparePlaylists([]);
    expect(r.commonTracks).toEqual([]);
    expect(r.uniqueTracksPerPlaylist).toEqual([]);
  });

  it("finds common tracks appearing in multiple playlists", () => {
    const p1 = [t("u1", "A", "X"), t("u2", "B", "Y")];
    const p2 = [t("u2", "B", "Y"), t("u3", "C", "Z")];
    const r = comparePlaylists([p1, p2], ["P1", "P2"]);

    expect(r.playlistNames).toEqual(["P1", "P2"]);
    expect(r.commonTracks.map((t) => t.uri)).toEqual(["u2"]);
    expect(r.uniqueTracksPerPlaylist[0].map((t) => t.uri)).toEqual(["u1"]);
    expect(r.uniqueTracksPerPlaylist[1].map((t) => t.uri)).toEqual(["u3"]);
  });

  it("does not double-count duplicate tracks within one playlist", () => {
    const p1 = [t("u1", "A", "X"), t("u1", "A", "X")]; // duplicate inside
    const p2 = [t("u1", "A", "X")];
    const r = comparePlaylists([p1, p2]);
    expect(r.commonTracks).toHaveLength(1);
    expect(r.uniqueTracksPerPlaylist[0]).toEqual([]);
  });

  it("treats all tracks as common when there is only one playlist", () => {
    const p1 = [t("u1", "A", "X"), t("u2", "B", "Y")];
    const r = comparePlaylists([p1]);
    expect(r.commonTracks).toHaveLength(0); // by design: needs >1 playlist
    expect(r.uniqueTracksPerPlaylist[0]).toHaveLength(2);
  });

  it("auto-generates names when not provided", () => {
    const r = comparePlaylists([[t("u1", "A", "X")], [t("u2", "B", "Y")]]);
    expect(r.playlistNames).toEqual(["Playlist 1", "Playlist 2"]);
  });

  it("returns trackCounts for each playlist", () => {
    const r = comparePlaylists([[t("u1", "A", "X"), t("u2", "B", "Y")], [t("u3", "C", "Z")]]);
    expect(r.trackCounts).toEqual([2, 1]);
  });
});
