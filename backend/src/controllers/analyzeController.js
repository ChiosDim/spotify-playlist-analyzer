import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/apiResponse.js";
import { parseCSV } from "../services/parserService.js";
import { genreDistribution, topGenres } from "../analyzer/genre.js";
import { calculateAudioFeatures } from "../analyzer/stats.js";
import { decodeFilename } from "../utils/decodeFilename.js";

export const analyzeController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return fail(res, 400, "No CSV file uploaded. Use field name 'playlist'.", "NO_FILE");
  }

  let tracks;

  try {
    tracks = await parseCSV(req.file.buffer);
  } catch (err) {
    if (err.message.includes("Empty CSV buffer") || err.message.includes("no data rows")) {
      return fail(res, 400, "CSV contains no valid tracks", "NO_VALID_TRACKS");
    }

    throw err;
  }

  if (tracks.length === 0) {
    return fail(res, 400, "CSV contains no valid tracks", "NO_VALID_TRACKS");
  }
  const distribution = genreDistribution(tracks);
  const top = topGenres(distribution, 20);
  const audioFeatures = calculateAudioFeatures(tracks);

  return ok(res, {
    filename: decodeFilename(req.file.originalname),
    trackCount: tracks.length,
    genreDistribution: distribution,
    topGenres: top,
    audioFeatures,
  });
});
