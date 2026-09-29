import multer from "multer";
import { HttpError } from "../utils/HttpError.js";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

// Memory storage: files live only in RAM and are garbage-collected after
// the request. Perfect for CSV processing — we never need to persist them.
const storage = multer.memoryStorage();

const ALLOWED_MIME = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
  "application/octet-stream",
]);

function csvFileFilter(_req, file, cb) {
  if (ALLOWED_MIME.has(file.mimetype)) {
    return cb(null, true);
  }
  cb(
    new HttpError(
      400,
      `Unsupported file type "${file.mimetype}". Please upload a CSV file.`,
      "UNSUPPORTED_FILE_TYPE"
    )
  );
}

const baseMulter = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES },
  fileFilter: csvFileFilter,
});

export const uploadSingleCSV = baseMulter.single("playlist");
export const uploadMultipleCSV = baseMulter.array("playlists", MAX_FILES);
