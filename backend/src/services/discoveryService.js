import { getSimilarTracks } from "./lastfmService.js";

/**
 * Sample N tracks spread evenly across the playlist so we don't
 * waste API calls on 100 songs when 10 seeds will do.
 */
export function sampleSeeds(tracks, n) {
  if (tracks.length <= n) return tracks;
  const step = tracks.length / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(tracks[Math.floor(i * step)]);
  }
  return out;
}

/**
 * Find new tracks similar to the user's playlist but NOT already in their library.
 *
 * @param {import("../models/Track.js").default[]} sourceTracks
 * @param {Set<string>} existingKeys    — trackKey() set of tracks to exclude
 * @param {{ seedCount?: number, perSeed?: number, delayMs?: number }} [opts]
 * @returns {Promise<Array>}
 */
export async function findNewDiscoveries(sourceTracks, existingKeys, opts = {}) {
  const { seedCount = 10, perSeed = 10, delayMs = 200 } = opts;
  if (sourceTracks.length === 0) return [];

  const seeds = sampleSeeds(sourceTracks, seedCount);
  const seen = new Map(); // "name|artist" → best entry

  for (const seed of seeds) {
    try {
      const similar = await getSimilarTracks(seed.artists, seed.name, { limit: perSeed });

      for (const s of similar) {
        const key = `${s.name.toLowerCase()}|${s.artist.toLowerCase()}`;
        if (existingKeys.has(key)) continue;

        const prev = seen.get(key);
        if (!prev || prev.match < s.match) {
          seen.set(key, {
            name: s.name,
            artist: s.artist,
            match: s.match,
            url: s.url,
            mbid: s.mbid,
            seedName: seed.name,
            seedArtist: seed.artists,
          });
        }
      }
    } catch (err) {
      console.warn(`[discover] failed for seed "${seed.name}":`, err.message);
    }

    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return [...seen.values()].sort((a, b) => b.match - a.match);
}
