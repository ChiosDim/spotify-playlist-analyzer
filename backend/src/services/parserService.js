import csv from "csv-parser";
import { Readable } from "node:stream";
import Track from "../models/Track.js";

/**
 * Parse an Exportify CSV buffer (from multer) into an array of Track objects.
 *
 * @param {Buffer} buffer - Raw CSV bytes
 * @returns {Promise<Track[]>}
 * @throws {Error} if the buffer is empty or CSV parsing fails
 */
export function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    if (!buffer || buffer.length === 0) {
      return reject(new Error("Empty CSV buffer"));
    }

    const tracks = [];
    let rowCount = 0;

    Readable.from(buffer.toString("utf8"))
      .pipe(csv())
      .on("data", (row) => {
        rowCount++;
        const track = Track.fromCSVRow(row);
        if (track.isValid()) {
          tracks.push(track);
        }
      })
      .on("end", () => {
        if (rowCount === 0) {
          return reject(new Error("CSV contained no data rows"));
        }
        resolve(tracks);
      })
      .on("error", (err) => reject(err));
  });
}
