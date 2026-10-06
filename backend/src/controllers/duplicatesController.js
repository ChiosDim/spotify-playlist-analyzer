import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/apiResponse.js";
import { parseCSV } from "../services/parserService.js";
import { findDuplicates } from "../analyzer/duplicates.js";

export const duplicatesController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return fail(res, 400, "No CSV file uploaded. Use field name 'playlist'.", "NO_FILE");
  }

  const tracks = await parseCSV(req.file.buffer);

  if (tracks.length === 0) {
    return fail(res, 400, "CSV contains no valid tracks", "NO_VALID_TRACKS");
  }

  const groups = findDuplicates(tracks);
  const totalDuplicateTracks = groups.reduce((sum, g) => sum + g.tracks.length, 0);

  return ok(res, {
    filename: req.file.originalname,
    trackCount: tracks.length,
    duplicateGroups: groups,
    totalDuplicateGroups: groups.length,
    totalDuplicateTracks,
  });
});
