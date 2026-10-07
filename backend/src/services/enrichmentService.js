import { getArtistTopTags } from "./lastfmService.js";

/**
 * Attach Last.fm genre tags to each track based on its primary artist.
 * Uses the 7-day Redis cache managed inside getArtistTopTags.
 */
export async function attachGenres(tracks) {
  const artists = new Set();
  for (const t of tracks) {
    if (t.artists) {
      const primary = t.artists.split(",")[0].trim();
      if (primary) artists.add(primary);
    }
  }
  if (artists.size === 0) return;

  const genreMap = new Map();
  for (const artist of artists) {
    const tags = await getArtistTopTags(artist, { limit: 5 });
    if (tags.length > 0) genreMap.set(artist, tags);
  }

  for (const t of tracks) {
    const primary = t.artists?.split(",")[0]?.trim();
    const tags = primary ? genreMap.get(primary) : null;
    t.genres = tags ? tags.join(", ") : "";
  }
}
