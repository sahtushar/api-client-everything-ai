/**
 * Analyze controller
 */
import type {Request, Response} from "express";

import {analyze} from "../services/openai.service.js";
import type {AnalyzeRequest, AnalyzeResponse} from "../types/index.js";
import {sanitizeText} from "../utils/sanitizeText.js";

/**
 * POST /api/analyze
 * Analyzes a job description and resume, returning match analysis and tailored resume
 */
export async function analyzeHandler(
  req: Request<{}, AnalyzeResponse, AnalyzeRequest>,
  res: Response<AnalyzeResponse>
): Promise<void> {
  const {jd, resume} = req.body;

  if (!jd || typeof jd !== "string") {
    res.status(400).json({
      message: "Job description is required",
      statusCode: 400,
    } as any);
    return;
  }

  if (!resume || typeof resume !== "string") {
    res.status(400).json({
      message: "Resume is required",
      statusCode: 400,
    } as any);
    return;
  }

  const sanitizedJD = sanitizeText(jd);
  const sanitizedResume = sanitizeText(resume);

  console.info("Analyzing job description and resume...", {
    jdLength: sanitizedJD.length,
    resumeLength: sanitizedResume.length,
  });

  try {
    const analysisResult = await analyze(sanitizedJD, sanitizedResume);

    console.info("Successfully analyzed job description and resume", {
      matchScore: analysisResult.matchScore,
    });

    res.json(analysisResult);
  } catch (error) {
    console.error("Error analyzing JD and resume:", error);
    throw error; // Let error handler middleware catch it
  }
}
