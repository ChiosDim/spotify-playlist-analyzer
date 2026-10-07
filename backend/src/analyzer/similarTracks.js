import { trackKey } from "../utils/trackKey.js";

/**
 * @typedef {{
 *   source: import("../models/Track.js").default,
 *   match: import("../models/Track.js").default,
 *   reason: string,
 *   similarityScore: number,
 * }} SimilarPair
 */

// ─────────────────────────────────────────────────────────────────
// TUNING KNOBS — change these two numbers to shift the balance
// ─────────────────────────────────────────────────────────────────
const AUDIO_WEIGHT = 0.3; // how much audio features matter (0–1)
const GENRE_WEIGHT = 0.7; // how much genre overlap matters (0–1)
// They should sum to 1.0

// Per-feature weights inside the audio score (must sum to 1.0)
const FEATURE_WEIGHTS = {
  danceability: 0.15,
  energy: 0.15,
  valence: 0.2,
  acousticness: 0.1,
  instrumentalness: 0.05,
  liveness: 0.05,
  speechiness: 0.05,
  tempo: 0.25,
};

const TEMPO_RANGE = 140;

// Tags that are too broad to discriminate between tracks
const BROAD_TAGS = new Set([
  "pop",
  "rock",
  "indie",
  "alternative",
  "electronic",
  "dance",
  "metal",
  "folk",
  "soul",
  "rnb",
  "r&b",
  "hip-hop",
  "hip hop",
  "rap",
  "jazz",
  "country",
  "classical",
  "punk",
  "emo",
  "blues",
  "reggae",
]);

const STOP_WORDS = new Set([
  "and",
  "the",
  "of",
  "music",
  "with",
  "for",
  "n",
  "feat",
  "style",
  "genre",
]);

function genreSet(genres) {
  if (!genres) return new Set();
  const tokens = new Set();
  const genreList = genres
    .split(",")
    .map((g) => g.trim().toLowerCase())
    .filter(Boolean);

  for (const genre of genreList) {
    // Skip broad umbrella genres
    if (BROAD_TAGS.has(genre)) continue;

    tokens.add(genre);
    const words = genre
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w) && !BROAD_TAGS.has(w));
    for (const w of words) tokens.add(w);
  }
  return tokens;
}

/**
 * Jaccard similarity between two genre sets.
 * 0.0 = no overlap, 1.0 = identical sets.
 */
function genreOverlap(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return null; // no data on either side
  let intersection = 0;
  for (const g of setA) if (setB.has(g)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function calculateSimilarity(t1, t2) {
  const reasons = [];

  // ── Audio feature score ─────────────────────────────────────────
  let audioSum = 0;
  let audioWeightTotal = 0;

  const compare = (name, v1, v2, weight) => {
    if (v1 > 0 && v2 > 0) {
      const diff = Math.abs(v1 - v2);
      const sim = Math.max(0, 1 - 6 * diff * diff);
      audioSum += sim * weight;
      audioWeightTotal += weight;
      if (sim > 0.8) reasons.push(`similar ${name}`);
    }
  };

  compare("danceability", t1.danceability, t2.danceability, FEATURE_WEIGHTS.danceability);
  compare("energy", t1.energy, t2.energy, FEATURE_WEIGHTS.energy);
  compare("valence", t1.valence, t2.valence, FEATURE_WEIGHTS.valence);
  compare("acousticness", t1.acousticness, t2.acousticness, FEATURE_WEIGHTS.acousticness);
  compare(
    "instrumentalness",
    t1.instrumentalness,
    t2.instrumentalness,
    FEATURE_WEIGHTS.instrumentalness
  );
  compare("liveness", t1.liveness, t2.liveness, FEATURE_WEIGHTS.liveness);
  compare("speechiness", t1.speechiness, t2.speechiness, FEATURE_WEIGHTS.speechiness);

  if (t1.tempo > 0 && t2.tempo > 0) {
    const diff = Math.abs(t1.tempo - t2.tempo) / TEMPO_RANGE;
    const sim = Math.max(0, 1 - 6 * diff * diff);
    audioSum += sim * FEATURE_WEIGHTS.tempo;
    audioWeightTotal += FEATURE_WEIGHTS.tempo;
    if (sim > 0.8) reasons.push("similar tempo");
  }

  const audioScore = audioWeightTotal > 0 ? audioSum / audioWeightTotal : 0;
  const hasAudio = audioWeightTotal >= 0.5; // at least ~3 features compared

  // ── Genre score ─────────────────────────────────────────────────
  const overlap = genreOverlap(genreSet(t1.genres), genreSet(t2.genres));
  const genreScore = overlap === null ? 0 : overlap;
  const hasGenre = overlap !== null && overlap > 0;

  if (overlap !== null && overlap >= 0.3) reasons.push("shared genres");

  // ── Blend ───────────────────────────────────────────────────────
  let score;
  if (hasAudio && hasGenre) {
    score = AUDIO_WEIGHT * audioScore + GENRE_WEIGHT * genreScore;
  } else if (hasAudio) {
    score = audioScore;
  } else if (hasGenre) {
    // Only genre data available — cap at 0.5 so it doesn't dominate
    score = Math.min(0.5, genreScore * 0.5);
  } else {
    score = 0;
  }

  const reason =
    reasons.length > 0
      ? `similar ${reasons.map((r) => r.replace("similar ", "")).join(", ")}`
      : "based on audio similarity";

  return { score, reason };
}

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
