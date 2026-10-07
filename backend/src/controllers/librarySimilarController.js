import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/apiResponse.js";
import { fetchPlaylistTracks } from "../services/spotifyService.js";
import { fetchUserLibrary } from "../services/libraryService.js";
import { enrichTracksWithAudioFeatures } from "../services/reccoBeatsService.js";
import { getArtistTopTags } from "../services/lastfmService.js";
import { findSimilarInPool } from "../analyzer/similarTracks.js";
import { trackKey } from "../utils/trackKey.js";

const bodySchema = z.object({
  playlistId: z.string().min(1),
  minScore: z.coerce.number().min(0).max(1).default(0.85),
  perSource: z.coerce.number().int().min(1).max(10).default(3),
  limit: z.coerce.number().int().min(1).max(100).default(40),
});

/**
 * Attach Last.fm genre tags to each track based on its primary artist.
 * Uses the same 7-day Redis cache as the library enrichment.
 */
async function attachGenres(tracks) {
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

  console.log(`[genres] attached to ${genreMap.size}/${artists.size} source artists`);
}

export const librarySimilarController = asyncHandler(async (req, res) => {
  const { playlistId, minScore, perSource, limit } = bodySchema.parse(req.body);

  // 1. Fetch the source playlist's tracks
  const sourceTracks = await fetchPlaylistTracks(req.user, playlistId);
  if (sourceTracks.length === 0) {
    return fail(res, 400, "Playlist has no playable tracks", "EMPTY_PLAYLIST");
  }

  // 2. Enrich source tracks with audio features + genres
  await enrichTracksWithAudioFeatures(sourceTracks);
  await attachGenres(sourceTracks);

  // 3. Fetch (or use cached) the user's library — already enriched with both
  const library = await fetchUserLibrary(req.user);

  // 4. Compute matches
  const matches = findSimilarInPool(sourceTracks, library.tracks, {
    minScore: 0,
    perSource: perSource,
  });

  // Always take the top N by score
  const topMatches = matches.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, limit);

  // 5. Attach the playlists each match belongs to
  const enriched = topMatches.map((m, i) => ({
    ...m,
    rank: i + 1,
    inPlaylists: library.playlistsByKey[trackKey(m.track)] ?? [],
  }));

  return ok(res, {
    playlistId,
    sourceTrackCount: sourceTracks.length,
    libraryTrackCount: library.tracks.length,
    libraryPlaylistCount: library.playlistCount,
    librarySkippedCount: library.skippedCount,
    libraryCached: library.cached,
    matchCount: enriched.length,
    matches: enriched,
  });
});
