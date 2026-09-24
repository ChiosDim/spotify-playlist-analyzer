/**
 * @typedef {{
 *   playlistNames: string[],
 *   commonTracks: import("../models/Track.js").default[],
 *   uniqueTracksPerPlaylist: import("../models/Track.js").default[][],
 *   trackCounts: number[],
 * }} ComparisonResult
 */

/**
 * Compare multiple playlists:
 *   - commonTracks: tracks that appear in more than one playlist
 *   - uniqueTracksPerPlaylist: for each playlist, tracks that appear
 *     in that playlist only (not in any other)
 *
 * @param {import("../models/Track.js").default[][]} playlistTracks
 * @param {string[]} [playlistNames]
 * @returns {ComparisonResult}
 */
export function comparePlaylists(playlistTracks, playlistNames = []) {
  const trackCounts = playlistTracks.map((p) => p.length);

  if (playlistTracks.length === 0) {
    return {
      playlistNames: [],
      commonTracks: [],
      uniqueTracksPerPlaylist: [],
      trackCounts: [],
    };
  }

  const names =
    playlistNames.length === playlistTracks.length
      ? playlistNames
      : playlistTracks.map((_, i) => `Playlist ${i + 1}`);

  // Count how many *distinct* playlists each track appears in.
  const playlistsContaining = new Map(); // key -> Set of playlist indices
  const trackByKey = new Map(); // key -> Track (first seen)

  playlistTracks.forEach((playlist, playlistIdx) => {
    const seenInThisPlaylist = new Set();
    for (const track of playlist) {
      const key = track.trackKey();
      if (seenInThisPlaylist.has(key)) continue;
      seenInThisPlaylist.add(key);

      if (!playlistsContaining.has(key)) playlistsContaining.set(key, new Set());
      playlistsContaining.get(key).add(playlistIdx);

      if (!trackByKey.has(key)) trackByKey.set(key, track);
    }
  });

  const commonTracks = [];
  for (const [key, set] of playlistsContaining.entries()) {
    if (set.size > 1) commonTracks.push(trackByKey.get(key));
  }

  const uniqueTracksPerPlaylist = playlistTracks.map((playlist) => {
    const seen = new Set();
    const unique = [];
    for (const track of playlist) {
      const key = track.trackKey();
      if (seen.has(key)) continue;
      seen.add(key);
      if (playlistsContaining.get(key).size === 1) unique.push(track);
    }
    return unique;
  });

  return {
    playlistNames: names,
    commonTracks,
    uniqueTracksPerPlaylist,
    trackCounts,
  };
}
