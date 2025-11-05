/**
 * Resume routes
 */
import {type IRouter, Router} from "express";

import {preprocessResumeHandler} from "../controllers/resume.controller.js";
import {asyncHandler} from "../middlewares/errorHandler.js";
import {validateRequest} from "../middlewares/validateRequest.js";

const router: IRouter = Router();

/**
 * POST /api/preprocess/resume
 * Preprocesses a resume into structured format
 */
router.post(
  "/preprocess/resume",
  validateRequest([
    {field: "resumeText", required: true, minLength: 10, maxLength: 50000},
  ]),
  asyncHandler(preprocessResumeHandler)
);

export default router;
