import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/apiResponse.js";
import { fetchPlaylistTracks } from "../services/spotifyService.js";
import { enrichTracksWithAudioFeatures } from "../services/reccoBeatsService.js";
import { attachGenres } from "../services/enrichmentService.js";
import { findSimilarTracks } from "../analyzer/similarTracks.js";

const bodySchema = z.object({
  playlistId: z.string().min(1),
  minScore: z.coerce.number().min(0).max(1).default(0.55),
  perTrack: z.coerce.number().int().min(1).max(10).default(2),
});

export const spotifySimilarTracksController = asyncHandler(async (req, res) => {
  const { playlistId, minScore, perTrack } = bodySchema.parse(req.body);

  // 1. Fetch the playlist's tracks
  const tracks = await fetchPlaylistTracks(req.user, playlistId);
  if (tracks.length < 2) {
    return fail(
      res,
      400,
      "Playlist needs at least 2 playable tracks for similarity comparison.",
      "NOT_ENOUGH_TRACKS"
    );
  }

  // 2. Enrich with audio features + genres
  await enrichTracksWithAudioFeatures(tracks);
  await attachGenres(tracks);

  // 3. Find similar pairs within the playlist
  const pairs = findSimilarTracks(tracks, { minScore, perTrack });

  return ok(res, {
    playlistId,
    trackCount: tracks.length,
    minScore,
    perTrack,
    pairCount: pairs.length,
    pairs,
  });
});
