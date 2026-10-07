import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/apiResponse.js";
import { fetchPlaylistTracks } from "../services/spotifyService.js";
import { fetchUserLibrary } from "../services/libraryService.js";
import { enrichTracksWithAudioFeatures } from "../services/reccoBeatsService.js";
import { findSimilarInPool } from "../analyzer/similarTracks.js";
import { trackKey } from "../utils/trackKey.js";
import { attachGenres } from "../services/enrichmentService.js";

const bodySchema = z.object({
  playlistId: z.string().min(1),
  perSource: z.coerce.number().int().min(1).max(10).default(3),
  limit: z.coerce.number().int().min(1).max(100).default(40),
});

export const librarySimilarController = asyncHandler(async (req, res) => {
  const { playlistId, perSource, limit } = bodySchema.parse(req.body);

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
