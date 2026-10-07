import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/apiResponse.js";
import { parseCSV } from "../services/parserService.js";
import { fetchPlaylistTracks } from "../services/spotifyService.js";
import { fetchUserLibrary } from "../services/libraryService.js";
import { findNewDiscoveries } from "../services/discoveryService.js";
import { trackKey } from "../utils/trackKey.js";

const bodySchema = z.object({
  source: z.enum(["csv", "spotify"]).default("csv"),
  playlistId: z.string().optional(),
  seedCount: z.coerce.number().int().min(3).max(25).default(10),
  perSeed: z.coerce.number().int().min(5).max(20).default(10),
  limit: z.coerce.number().int().min(1).max(100).default(40),
});

export const discoverController = asyncHandler(async (req, res) => {
  const { source, playlistId, seedCount, perSeed, limit } = bodySchema.parse(req.body);

  // 1. Get source tracks
  let sourceTracks;
  let fileName = null;

  if (source === "csv") {
    if (!req.file) {
      return fail(res, 400, "No CSV file uploaded. Use field name 'playlist'.", "NO_FILE");
    }
    sourceTracks = await parseCSV(req.file.buffer);
    fileName = req.file.originalname;
  } else {
    if (!playlistId) {
      return fail(res, 400, "playlistId is required for Spotify source.", "MISSING_PLAYLIST_ID");
    }
    sourceTracks = await fetchPlaylistTracks(req.user, playlistId);
  }

  if (sourceTracks.length === 0) {
    return fail(res, 400, "Source playlist has no playable tracks.", "EMPTY_PLAYLIST");
  }

  // 2. Build the exclusion set: source tracks + (if logged in) user's full library
  const existingKeys = new Set(sourceTracks.map(trackKey));

  if (req.user) {
    try {
      const library = await fetchUserLibrary(req.user);
      for (const t of library.tracks) existingKeys.add(trackKey(t));
    } catch (err) {
      // Non-fatal — just means some recommendations may be tracks they already own
      console.warn("[discover] library fetch failed:", err.message);
    }
  }

  // 3. Query Last.fm via seeds and filter
  const discoveries = await findNewDiscoveries(sourceTracks, existingKeys, {
    seedCount,
    perSeed,
  });

  return ok(res, {
    source,
    fileName,
    sourceTrackCount: sourceTracks.length,
    seedCount: Math.min(seedCount, sourceTracks.length),
    excludedTrackCount: existingKeys.size,
    recommendationCount: Math.min(discoveries.length, limit),
    recommendations: discoveries.slice(0, limit),
  });
});
