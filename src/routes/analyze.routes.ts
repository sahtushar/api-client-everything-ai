/**
 * Analyze routes
 */
import {type IRouter, Router} from "express";

import {analyzeHandler} from "../controllers/analyze.controller.js";
import {asyncHandler} from "../middlewares/errorHandler.js";
import {validateRequest} from "../middlewares/validateRequest.js";

const router: IRouter = Router();

/**
 * POST /api/analyze
 * Analyzes a job description and resume, returning match analysis and tailored resume
 */
router.post(
  "/analyze",
  validateRequest([
    {field: "jd", required: true, minLength: 10, maxLength: 50000},
    {field: "resume", required: true, minLength: 10, maxLength: 50000},
  ]),
  asyncHandler(analyzeHandler)
);

export default router;
