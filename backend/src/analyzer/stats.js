/**
 * Statistical summary for one audio feature across a playlist.
 * @typedef {{
 *   mean: number, median: number, min: number, max: number,
 *   stdDev: number, valid: number, total: number
 * }} AudioStats
 */

const FEATURE_NAMES = [
  "danceability",
  "energy",
  "speechiness",
  "acousticness",
  "instrumentalness",
  "liveness",
  "valence",
  "tempo",
  "loudness",
  "durationMs",
  "popularity",
  "key",
  "mode",
  "timeSignature",
];

/**
 * Compute stats for each audio feature across a list of tracks.
 * Zero-valued features (missing data) are excluded from stats,
 * but the `total` count reflects the whole playlist.
 *
 * @param {import("../models/Track.js").default[]} tracks
 * @returns {Record<string, AudioStats>}
 */
export function calculateAudioFeatures(tracks) {
  const buckets = {};
  for (const name of FEATURE_NAMES) buckets[name] = [];

  for (const t of tracks) {
    for (const name of FEATURE_NAMES) {
      const value = t[name];
      // Skip missing data: treat 0 as "not set" for features that are
      // naturally non-zero when present.
      if (isPresent(name, value)) {
        buckets[name].push(value);
      }
    }
  }

  const result = {};
  for (const name of FEATURE_NAMES) {
    result[name] = computeStats(buckets[name], tracks.length);
  }
  return result;
}

/**
 * Heuristic: which values count as "present" for a feature.
 * Loudness can legitimately be negative; key/mode can be 0.
 */
function isPresent(feature, value) {
  if (value === null || value === undefined) return false;
  if (feature === "loudness") return value !== 0;
  if (feature === "key" || feature === "mode") return value >= 0;
  return value > 0;
}

/**
 * Basic descriptive statistics.
 * @param {number[]} values
 * @param {number} total
 * @returns {AudioStats}
 */
export function computeStats(values, total) {
  if (values.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0, valid: 0, total };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((s, v) => s + v, 0);
  const mean = sum / values.length;
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const variance =
    values.length > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1) : 0;

  return {
    mean,
    median,
    min,
    max,
    stdDev: Math.sqrt(variance),
    valid: values.length,
    total,
  };
}
