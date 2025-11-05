/**
 * Job Description routes
 */
import {type IRouter, Router} from "express";

import {preprocessJDHandler} from "../controllers/jd.controller.js";
import {asyncHandler} from "../middlewares/errorHandler.js";
import {validateRequest} from "../middlewares/validateRequest.js";

const router: IRouter = Router();

/**
 * POST /api/preprocess/jd
 * Preprocesses a job description into structured format
 */
router.post(
  "/preprocess/jd",
  validateRequest([
    {field: "jd", required: true, minLength: 10, maxLength: 50000},
  ]),
  asyncHandler(preprocessJDHandler)
);

export default router;
