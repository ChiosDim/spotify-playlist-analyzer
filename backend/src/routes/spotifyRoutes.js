import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/apiResponse.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { librarySimilarController } from "../controllers/librarySimilarController.js";
import { fetchPlaylistTracks, fetchUserPlaylists } from "../services/spotifyService.js";
import { enrichTracksWithAudioFeatures } from "../services/reccoBeatsService.js";
import { genreDistribution, topGenres } from "../analyzer/genre.js";
import { calculateAudioFeatures } from "../analyzer/stats.js";
import { findDuplicates } from "../analyzer/duplicates.js";
import { findSimilarTracks } from "../analyzer/similarTracks.js";

const router = Router();

// Every route below requires a logged-in Spotify user.
router.use(requireAuth);

/**
 * GET /api/spotify/playlists
 * List the user's playlists (for a picker in the UI).
 */
router.get(
  "/playlists",
  asyncHandler(async (req, res) => {
    const playlists = await fetchUserPlaylists(req.user);
    return ok(res, { playlists });
  })
);

/**
 * POST /api/spotify/analyze
 * Body: { playlistId: string, include?: "features" | "duplicates" | "recommendations" }
 *
 * Hybrid pipeline:
 *   1. Spotify  -> playlist tracks (metadata)
 *   2. ReccoBeats -> audio features for those tracks
 *   3. Phase-1 analyzers -> insights
 */
router.post(
  "/analyze",
  asyncHandler(async (req, res) => {
    const { playlistId, include = "features" } = req.body ?? {};

    if (!playlistId || typeof playlistId !== "string") {
      return fail(res, 400, "playlistId is required", "MISSING_PLAYLIST_ID");
    }

    // 1. Fetch tracks from Spotify
    const tracks = await fetchPlaylistTracks(req.user, playlistId);

    if (tracks.length === 0) {
      return fail(res, 400, "Playlist has no playable tracks", "EMPTY_PLAYLIST");
    }

    // 2. Enrich with ReccoBeats audio features
    const enrichment = await enrichTracksWithAudioFeatures(tracks);

    // 3. Run the same analyzers used by the CSV path
    const distribution = genreDistribution(tracks); // usually sparse for Spotify
    const audioFeatures = calculateAudioFeatures(tracks);

    const payload = {
      playlistId,
      trackCount: tracks.length,
      featuresEnriched: enrichment.enriched,
      featuresMissing: enrichment.missing,
      genreDistribution: distribution,
      topGenres: topGenres(distribution, 20),
      audioFeatures,
    };

    if (include === "duplicates" || include === "all") {
      payload.duplicateGroups = findDuplicates(tracks);
    }

    if (include === "similar" || include === "all") {
      payload.similarTracks = findSimilarTracks(tracks, {
        minScore: 0.5,
        perTrack: 2,
      });
    }

    return ok(res, payload);
  })
);

/**
 * POST /api/spotify/similar-from-library
 * Body: { playlistId, minScore?, perSource?, limit? }
 * Finds tracks in the user's other playlists that are similar to the given playlist.
 */
router.post(
  "/similar-from-library",
  asyncHandler(librarySimilarController)
);
export default router;
