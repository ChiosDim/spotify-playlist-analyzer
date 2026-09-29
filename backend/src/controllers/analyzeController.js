import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/ApiResponse.js";
import { parseCSV } from "../services/parserService.js";
import { genreDistribution, topGenres } from "../analyzer/genre.js";
import { calculateAudioFeatures } from "../analyzer/stats.js";

export const analyzeController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return fail(res, 400, "No CSV file uploaded. Use field name 'playlist'.", "NO_FILE");
  }

  const tracks = await parseCSV(req.file.buffer);

  if (tracks.length === 0) {
    return fail(res, 400, "CSV contains no valid tracks", "NO_VALID_TRACKS");
  }

  const distribution = genreDistribution(tracks);
  const top = topGenres(distribution, 20);
  const audioFeatures = calculateAudioFeatures(tracks);

  return ok(res, {
    filename: req.file.originalname,
    trackCount: tracks.length,
    genreDistribution: distribution,
    topGenres: top,
    audioFeatures,
  });
});
