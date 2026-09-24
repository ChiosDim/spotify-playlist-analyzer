/**
 * A group of tracks that are duplicates of each other.
 * @typedef {{ tracks: import("../models/Track.js").default[], reason: string }} DuplicateGroup
 */

/**
 * Find duplicate tracks by exact URI first, then by normalized
 * name+artist for tracks that don't share a URI.
 *
 * @param {import("../models/Track.js").default[]} tracks
 * @returns {DuplicateGroup[]}
 */
export function findDuplicates(tracks) {
  if (tracks.length < 2) return [];

  const byURI = new Map();
  const byNameArtist = new Map();

  tracks.forEach((track, index) => {
    if (track.uri) {
      if (!byURI.has(track.uri)) byURI.set(track.uri, []);
      byURI.get(track.uri).push(index);
    }
    if (track.name && track.artists) {
      const key = normalizeKey(track.name, track.artists);
      if (!byNameArtist.has(key)) byNameArtist.set(key, []);
      byNameArtist.get(key).push(index);
    }
  });

  const groups = [];
  const alreadyGrouped = new Set();

  for (const indices of byURI.values()) {
    if (indices.length > 1) {
      groups.push({
        tracks: indices.map((i) => tracks[i]),
        reason: "Exact URI match",
      });
      indices.forEach((i) => alreadyGrouped.add(i));
    }
  }

  for (const indices of byNameArtist.values()) {
    if (indices.length > 1) {
      const fresh = indices.filter((i) => !alreadyGrouped.has(i));
      if (fresh.length > 1) {
        groups.push({
          tracks: fresh.map((i) => tracks[i]),
          reason: "Track name and artist match",
        });
      }
    }
  }

  return groups;
}

/**
 * Normalize a name/artist pair for comparison.
 * Lowercase, trim, collapse whitespace, strip punctuation.
 */
export function normalizeKey(name, artists) {
  const clean = (s) =>
    s
      .toLowerCase()
      .replace(/[.,!?;:()[\]"'`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  return `${clean(name)}|${clean(artists)}`;
}
