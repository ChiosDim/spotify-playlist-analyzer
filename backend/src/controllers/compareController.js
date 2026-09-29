import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/ApiResponse.js";
import { parseCSV } from "../services/parserService.js";
import { comparePlaylists } from "../analyzer/compare.js";

export const compareController = asyncHandler(async (req, res) => {
  const files = req.files || [];

  if (files.length < 2) {
    return fail(
      res,
      400,
      "At least 2 CSV files are required. Use field name 'playlists' (repeatable).",
      "NOT_ENOUGH_FILES"
    );
  }

  const playlists = await Promise.all(files.map((f) => parseCSV(f.buffer)));

  const emptyIndex = playlists.findIndex((p) => p.length === 0);
  if (emptyIndex !== -1) {
    return fail(
      res,
      400,
      `File "${files[emptyIndex].originalname}" contains no valid tracks`,
      "EMPTY_PLAYLIST",
      { filename: files[emptyIndex].originalname }
    );
  }

  const names = files.map((f) => f.originalname.replace(/\.csv$/i, ""));
  const comparison = comparePlaylists(playlists, names);

  return ok(res, {
    playlists: files.map((f, i) => ({
      filename: f.originalname,
      name: names[i],
      trackCount: playlists[i].length,
    })),
    ...comparison,
  });
});
