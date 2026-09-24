/**
 * @typedef {{
 *   track: import("../models/Track.js").default,
 *   reason: string,
 *   similarityScore: number,
 * }} Recommendation
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

const TEMPO_RANGE = 140; // max meaningful BPM difference

/**
 * Compute similarity between two tracks (0.0–1.0) based on audio features.
 * Only features present (>0) in both tracks are considered.
 *
 * @param {import("../models/Track.js").default} t1
 * @param {import("../models/Track.js").default} t2
 * @returns {{ score: number, reason: string }}
 */
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
  const reason = reasons.length > 0 ? `due to ${reasons.join(", ")}` : "based on audio similarity";
  return { score, reason };
}

/**
 * Generate top recommendations for a playlist.
 * For each track, find its 2 most similar neighbours, avoiding duplicates.
 *
 * @param {import("../models/Track.js").default[]} tracks
 * @param {{ minScore?: number, perTrack?: number }} [opts]
 * @returns {Recommendation[]}
 */
export function generateRecommendations(tracks, opts = {}) {
  const { minScore = 0.5, perTrack = 2 } = opts;
  if (tracks.length < 2) return [];

  const recommendations = [];
  const seenTrackKeys = new Set();

  for (let i = 0; i < tracks.length; i++) {
    const neighbours = [];
    for (let j = 0; j < tracks.length; j++) {
      if (i === j) continue;
      const { score, reason } = calculateSimilarity(tracks[i], tracks[j]);
      if (score >= minScore) neighbours.push({ track: tracks[j], score, reason });
    }

    neighbours.sort((a, b) => b.score - a.score);

    for (let k = 0; k < Math.min(perTrack, neighbours.length); k++) {
      const { track, score, reason } = neighbours[k];
      const key = track.key();
      if (seenTrackKeys.has(key)) continue;
      seenTrackKeys.add(key);
      recommendations.push({ track, reason, similarityScore: score });
    }
  }

  return recommendations;
}
