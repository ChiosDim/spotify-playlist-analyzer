import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/apiResponse.js";
import { fetchPlaylistTracks } from "../services/spotifyService.js";
import { fetchUserLibrary } from "../services/libraryService.js";
import { enrichTracksWithAudioFeatures } from "../services/reccoBeatsService.js";
import { findSimilarInPool } from "../analyzer/similarTracks.js";
import { trackKey } from "../utils/trackKey.js";

const bodySchema = z.object({
  playlistId: z.string().min(1),
  minScore: z.coerce.number().min(0).max(1).default(0.7),
  perSource: z.coerce.number().int().min(1).max(10).default(3),
  limit: z.coerce.number().int().min(1).max(100).default(40),
});

export const librarySimilarController = asyncHandler(async (req, res) => {
  const { playlistId, minScore, perSource, limit } = bodySchema.parse(req.body);

  // 1. Fetch the source playlist's tracks
  const sourceTracks = await fetchPlaylistTracks(req.user, playlistId);
  if (sourceTracks.length === 0) {
    return fail(res, 400, "Playlist has no playable tracks", "EMPTY_PLAYLIST");
  }

  // 1b. Enrich the source tracks with audio features
  await enrichTracksWithAudioFeatures(sourceTracks);

  // 2. Fetch (or use cached) the user's library
  const library = await fetchUserLibrary(req.user);

  // 3. Compute matches
  const matches = findSimilarInPool(sourceTracks, library.tracks, {
    minScore,
    perSource,
  });

  // 4. Attach the playlists each match belongs to
  const enriched = matches.slice(0, limit).map((m) => ({
    ...m,
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
