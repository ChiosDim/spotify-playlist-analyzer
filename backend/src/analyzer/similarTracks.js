/**
 * @typedef {{
 *   source: import("../models/Track.js").default,
 *   match: import("../models/Track.js").default,
 *   reason: string,
 *   similarityScore: number,
 * }} SimilarPair
 */

const WEIGHTS = {
  danceability: 0.15,
  energy: 0.15,
  valence: 0.15,
  tempo: 0.15,
  acousticness: 0.1,
  instrumentalness: 0.1,
  liveness: 0.1,
  speechiness: 0.1,
};

const TEMPO_RANGE = 140;

export function calculateSimilarity(t1, t2) {
  let weightSum = 0;
  let scoreSum = 0;
  const reasons = [];

  const compare = (name, v1, v2, weight) => {
    if (v1 > 0 && v2 > 0) {
      const sim = 1 - Math.abs(v1 - v2);
      scoreSum += sim * weight;
      weightSum += weight;
      if (sim > 0.8) reasons.push(`similar ${name}`);
    }
  };

  compare("danceability", t1.danceability, t2.danceability, WEIGHTS.danceability);
  compare("energy", t1.energy, t2.energy, WEIGHTS.energy);
  compare("valence", t1.valence, t2.valence, WEIGHTS.valence);
  compare("acousticness", t1.acousticness, t2.acousticness, WEIGHTS.acousticness);
  compare("instrumentalness", t1.instrumentalness, t2.instrumentalness, WEIGHTS.instrumentalness);
  compare("liveness", t1.liveness, t2.liveness, WEIGHTS.liveness);
  compare("speechiness", t1.speechiness, t2.speechiness, WEIGHTS.speechiness);

  if (t1.tempo > 0 && t2.tempo > 0) {
    const sim = 1 - Math.abs(t1.tempo - t2.tempo) / TEMPO_RANGE;
    if (sim > 0) {
      scoreSum += sim * WEIGHTS.tempo;
      weightSum += WEIGHTS.tempo;
      if (sim > 0.8) reasons.push("similar tempo");
    }
  }

  const score = weightSum === 0 ? 0 : scoreSum / weightSum;
  const reason =
    reasons.length > 0
      ? `similar ${reasons.map((r) => r.replace("similar ", "")).join(", ")}`
      : "based on audio similarity";
  return { score, reason };
}

/**
 * Build a stable key for a track, matching the logic used elsewhere.
 */
export function trackKey(track) {
  if (track.uri) return track.uri;
  return `${track.name.toLowerCase()}|${track.artists.toLowerCase()}`;
}

// Backwards-compat alias so callers can use either name
export const getTrackKey = trackKey;

/**
 * Find pairs of similar tracks within a playlist.
 * Returns pairs where each entry has BOTH source and match.
 * @param {import("../models/Track.js").default[]} tracks
 * @param {{ minScore?: number, perTrack?: number }} [opts]
 * @returns {SimilarPair[]}
 */
export function findSimilarTracks(tracks, opts = {}) {
  const { minScore = 0.5, perTrack = 2 } = opts;
  if (tracks.length < 2) return [];

  const pairs = [];
  const seenPairs = new Set();

  for (let i = 0; i < tracks.length; i++) {
    const neighbours = [];
    for (let j = 0; j < tracks.length; j++) {
      if (i === j) continue;
      const { score, reason } = calculateSimilarity(tracks[i], tracks[j]);
      if (score >= minScore) {
        neighbours.push({ track: tracks[j], score, reason });
      }
    }
    neighbours.sort((a, b) => b.score - a.score);

    for (let k = 0; k < Math.min(perTrack, neighbours.length); k++) {
      const { track: match, score, reason } = neighbours[k];
      // Canonical pair key — A↔B and B↔A are the same pair
      const pairKey = [trackKey(tracks[i]), trackKey(match)].sort().join("||");
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      pairs.push({
        source: tracks[i],
        match,
        reason,
        similarityScore: score,
      });
    }
  }

  return pairs;
}

/**
 * Find tracks from a pool that are similar to tracks in a source playlist.
 * Different from findSimilarTracks: source and pool are two different lists.
 * Filters out anything already in the source playlist and deduplicates results.
 *
 * @param {import("../models/Track.js").default[]} sourceTracks
 * @param {import("../models/Track.js").default[]} poolTracks
 * @param {{ minScore?: number, perSource?: number }} [opts]
 * @returns {Array<{
 *   track: import("../models/Track.js").default,
 *   seedName: string,
 *   seedArtists: string,
 *   similarityScore: number,
 *   reason: string,
 * }>}
 */
export function findSimilarInPool(sourceTracks, poolTracks, opts = {}) {
  const { minScore = 0.7, perSource = 3 } = opts;
  if (sourceTracks.length === 0 || poolTracks.length === 0) return [];

  // Exclude anything already in the source playlist
  const sourceKeys = new Set(sourceTracks.map(trackKey));
  const filteredPool = poolTracks.filter((t) => !sourceKeys.has(trackKey(t)));

  if (filteredPool.length === 0) return [];

  const matches = [];
  const seenMatches = new Set(); // dedupe by pool track

  for (const source of sourceTracks) {
    const scored = [];
    for (const candidate of filteredPool) {
      const { score, reason } = calculateSimilarity(source, candidate);
      if (score >= minScore) {
        scored.push({ track: candidate, score, reason });
      }
    }
    scored.sort((a, b) => b.score - a.score);

    for (let i = 0; i < Math.min(perSource, scored.length); i++) {
      const { track, score, reason } = scored[i];
      const key = trackKey(track);
      if (seenMatches.has(key)) continue;
      seenMatches.add(key);
      matches.push({
        track,
        seedName: source.name,
        seedArtists: source.artists,
        similarityScore: score,
        reason,
      });
    }
  }

  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
}
