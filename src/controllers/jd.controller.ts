/**
 * Job Description controller
 */
import type {Request, Response} from "express";

import {preProcessJD} from "../services/openai.service.js";
import type {
  PreprocessJDRequest,
  PreprocessJDResponse,
} from "../types/index.js";
import {sanitizeText} from "../utils/sanitizeText.js";

/**
 * POST /api/preprocess/jd
 * Preprocesses a job description into structured format
 */
export async function preprocessJDHandler(
  req: Request<{}, PreprocessJDResponse, PreprocessJDRequest>,
  res: Response<PreprocessJDResponse>
): Promise<void> {
  const {jd} = req.body;

  if (!jd || typeof jd !== "string") {
    res.status(400).json({
      message: "Job description is required",
      statusCode: 400,
    } as any);
    return;
  }

  const sanitizedJD = sanitizeText(jd);

  console.info("Preprocessing job description...", {
    length: sanitizedJD.length,
  });

  try {
    const structuredJD = await preProcessJD(sanitizedJD);

    console.info("Successfully preprocessed job description");

    res.json({structuredJD});
  } catch (error) {
    console.error("Error preprocessing JD:", error);
    throw error; // Let error handler middleware catch it
  }
}
