/**
 * Multer/busboy decode multipart filenames as Latin-1 by default.
 * Modern browsers send them as UTF-8. This function reinterprets the
 * bytes correctly so non-ASCII characters survive.
 *
 * Safe to call on ASCII-only filenames — returns them unchanged.
 */
export function decodeFilename(name) {
  if (!name || typeof name !== "string") return name;
  try {
    return Buffer.from(name, "latin1").toString("utf8");
  } catch {
    return name;
  }
}
