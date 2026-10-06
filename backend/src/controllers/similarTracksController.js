import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/ApiResponse.js";
import { parseCSV } from "../services/parserService.js";
import { findSimilarTracks } from "../analyzer/similarTracks.js";

const querySchema = z.object({
  minScore: z.coerce.number().min(0).max(1).default(0.5),
  perTrack: z.coerce.number().int().min(1).max(10).default(2),
});

export const similarTracksController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return fail(res, 400, "No CSV file uploaded. Use field name 'playlist'.", "NO_FILE");
  }

  const { minScore, perTrack } = querySchema.parse(req.query);
  const tracks = await parseCSV(req.file.buffer);

  if (tracks.length === 0) {
    return fail(
      res,
      400,
      "No valid tracks found in the CSV. Please make sure it's an Exportify CSV with audio features included.",
      "NO_VALID_TRACKS"
    );
  }

  if (tracks.length < 2) {
    return fail(
      res,
      400,
      `Similarity requires at least 2 tracks, but only ${tracks.length} was found.`,
      "NOT_ENOUGH_TRACKS"
    );
  }

  const similarTracks = findSimilarTracks(tracks, { minScore, perTrack });

  return ok(res, {
    filename: req.file.originalname,
    trackCount: tracks.length,
    minScore,
    perTrack,
    similarTrackCount: similarTracks.length,
    similarTracks,
  });
});
