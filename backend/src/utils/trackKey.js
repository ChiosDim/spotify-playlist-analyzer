/**
 * Stable key for a track, used for deduplication and mapping.
 * Prefers URI; falls back to lowercase name|artist.
 *
 * NOTE: do NOT add a `key()` method to the Track model — `key` is
 * already a numeric field (musical key 0-11). Use this helper instead.
 */
export function trackKey(track) {
  if (!track) return "";
  if (track.uri) return track.uri;
  const name = (track.name || "").toLowerCase();
  const artists = (track.artists || "").toLowerCase();
  return `${name}|${artists}`;
}
