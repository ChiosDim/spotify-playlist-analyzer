/**
 * Count and percentage for a single genre.
 * @typedef {{ count: number, percentage: number }} GenreStat
 */

/**
 * Compute the distribution of genres across a list of tracks.
 * A track with "Pop, Rock" contributes 1 to Pop and 1 to Rock.
 * Empty or whitespace-only genre strings are ignored.
 *
 * @param {import("../models/Track.js").default[]} tracks
 * @returns {Record<string, GenreStat>}
 */
export function genreDistribution(tracks) {
  const counts = new Map();
  let total = 0;

  for (const track of tracks) {
    if (!track.genres) continue;
    const parts = track.genres
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    for (const genre of parts) {
      counts.set(genre, (counts.get(genre) || 0) + 1);
      total++;
    }
  }

  const result = {};
  for (const [genre, count] of counts.entries()) {
    result[genre] = {
      count,
      percentage: total === 0 ? 0 : (count / total) * 100,
    };
  }
  return result;
}

/**
 * Returns the top-N genres sorted by count.
 * @param {Record<string, GenreStat>} distribution
 * @param {number} n
 */
export function topGenres(distribution, n = 10) {
  return Object.entries(distribution)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, n)
    .map(([genre, stat]) => ({ genre, ...stat }));
}
