/**
 * Resume controller
 */
import type {Request, Response} from "express";

import {preprocessResume} from "../services/openai.service.js";
import type {
  PreprocessResumeRequest,
  PreprocessResumeResponse,
} from "../types/index.js";
import {sanitizeText} from "../utils/sanitizeText.js";

/**
 * POST /api/preprocess/resume
 * Preprocesses a resume into structured format
 */
export async function preprocessResumeHandler(
  req: Request<{}, PreprocessResumeResponse, PreprocessResumeRequest>,
  res: Response<PreprocessResumeResponse>
): Promise<void> {
  const {resumeText} = req.body;

  if (!resumeText || typeof resumeText !== "string") {
    res.status(400).json({
      message: "Resume text is required",
      statusCode: 400,
    } as any);
    return;
  }

  const sanitizedResume = sanitizeText(resumeText);

  console.info("Preprocessing resume...", {
    length: sanitizedResume.length,
  });

  try {
    const structuredResume = await preprocessResume(sanitizedResume);

    console.info("Successfully preprocessed resume");

    res.json({structuredResume});
  } catch (error) {
    console.error("Error preprocessing resume:", error);
    throw error; // Let error handler middleware catch it
  }
}
