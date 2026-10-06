import { Router } from "express";
import { uploadSingleCSV, uploadMultipleCSV } from "../middleware/uploadMiddleware.js";
import { analyzeController } from "../controllers/analyzeController.js";
import { duplicatesController } from "../controllers/duplicatesController.js";
import { compareController } from "../controllers/compareController.js";
import { similarTracksController } from "../controllers/similarTracksController.js";

const router = Router();

router.post("/analyze", uploadSingleCSV, analyzeController);
router.post("/duplicates", uploadSingleCSV, duplicatesController);
router.post("/compare", uploadMultipleCSV, compareController);
router.post("/similar-tracks", uploadSingleCSV, similarTracksController);

export default router;
