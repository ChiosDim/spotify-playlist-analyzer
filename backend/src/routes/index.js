import { Router } from "express";
import multer from "multer";
import { uploadSingleCSV, uploadMultipleCSV } from "../middleware/uploadMiddleware.js";
import { analyzeController } from "../controllers/analyzeController.js";
import { duplicatesController } from "../controllers/duplicatesController.js";
import { compareController } from "../controllers/compareController.js";
import { similarTracksController } from "../controllers/similarTracksController.js";
import { discoverController } from "../controllers/discoverController.js";
const router = Router();

// Discover accepts multipart for CSV OR JSON for Spotify — so we need
// a permissive upload middleware that tolerates either content type.
const optionalUpload = multer({ storage: multer.memoryStorage() }).single("playlist");

function maybeUpload(req, res, next) {
  const ct = req.headers["content-type"] || "";
  if (ct.startsWith("multipart/form-data")) {
    return optionalUpload(req, res, next);
  }
  next();
}

router.post("/analyze", uploadSingleCSV, analyzeController);
router.post("/duplicates", uploadSingleCSV, duplicatesController);
router.post("/compare", uploadMultipleCSV, compareController);
router.post("/similar-tracks", uploadSingleCSV, similarTracksController);
router.post("/discover", maybeUpload, discoverController);

export default router;
