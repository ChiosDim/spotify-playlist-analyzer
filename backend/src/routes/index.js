import { Router } from "express";
import { uploadSingleCSV, uploadMultipleCSV } from "../middleware/uploadMiddleware.js";
import { analyzeController } from "../controllers/analyzeController.js";
import { duplicatesController } from "../controllers/duplicatesController.js";
import { compareController } from "../controllers/compareController.js";
import { recommendController } from "../controllers/recommendController.js";

const router = Router();

router.post("/analyze", uploadSingleCSV, analyzeController);
router.post("/duplicates", uploadSingleCSV, duplicatesController);
router.post("/compare", uploadMultipleCSV, compareController);
router.post("/recommend", uploadSingleCSV, recommendController);

export default router;
