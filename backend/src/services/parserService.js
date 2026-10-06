import csv from "csv-parser";
import { Readable } from "node:stream";
import Track from "../models/Track.js";
import { HttpError } from "../utils/HttpError.js";

const REQUIRED_COLUMNS = ["Track URI", "Track Name"];

// Accept multiple header name variants for the same data
const ARTIST_COLUMN_VARIANTS = ["Artist Names", "Artist Name(s)", "Artist Name"];

/**
 * Strip a UTF-8 BOM (EF BB BF) from the start of a buffer if present.
 */
function stripBOM(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    if (!buffer || buffer.length === 0) {
      return reject(new HttpError(400, "Empty CSV buffer", "EMPTY_CSV"));
    }

    const tracks = [];
    let rowCount = 0;

    const parser = csv();

    parser.on("headers", (headers) => {
      // Normalize headers: strip BOM, trim whitespace
      const normalized = headers.map((h) => h.replace(/^\uFEFF/, "").trim());

      const missing = REQUIRED_COLUMNS.filter((col) => !normalized.includes(col));
      const hasArtistColumn = ARTIST_COLUMN_VARIANTS.some((v) => normalized.includes(v));

      if (missing.length > 0 || !hasArtistColumn) {
        const problems = [...missing];
        if (!hasArtistColumn) problems.push("Artist Names (or Artist Name(s))");

        parser.destroy(
          new HttpError(
            400,
            `CSV is missing required columns: ${problems.join(", ")}. ` +
              `Please use an Exportify CSV (https://exportify.net) with audio features enabled. ` +
              `Found columns: ${normalized.join(" | ")}`,
            "INVALID_CSV_FORMAT",
            { foundColumns: normalized }
          )
        );
      }
    });

    parser.on("data", (row) => {
      rowCount++;
      const track = Track.fromCSVRow(row);
      if (track.isValid()) {
        tracks.push(track);
      }
    });

    parser.on("end", () => {
      if (rowCount === 0) {
        return reject(new HttpError(400, "CSV contained no data rows", "EMPTY_CSV"));
      }
      resolve(tracks);
    });

    parser.on("error", (err) => reject(err));

    // Strip BOM before piping to the CSV parser
    const cleaned = stripBOM(buffer.toString("utf8"));
    Readable.from(cleaned).pipe(parser);
  });
}
