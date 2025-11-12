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
  const {jd, structuredResume, jobMetadata} = req.body;

  if (!jd || typeof jd !== "string") {
    res.status(400).json({
      message: "Job description is required",
      statusCode: 400,
    } as any);
    return;
  }

  if (
    !structuredResume ||
    typeof structuredResume !== "object" ||
    Array.isArray(structuredResume)
  ) {
    res.status(400).json({
      message: "Structured resume is required and must be an object",
      statusCode: 400,
    } as any);
    return;
  }

  const sanitizedJD = sanitizeText(jd);

  // Extract metadataHtmlString from jobMetadata if provided
  const metadataHtmlString = jobMetadata?.metadataHtmlString;

  console.info("Analyzing job description and structured resume...", {
    jdLength: sanitizedJD.length,
    resumeName: structuredResume.name || "N/A",
    hasJobMetadata: !!metadataHtmlString,
  });

  try {
    const analysisResult = await analyze(
      sanitizedJD,
      structuredResume,
      metadataHtmlString
    );

    console.info("Successfully analyzed job description and resume", {
      matchScore: analysisResult.matchScore,
      hasJobMetadata: !!analysisResult.jobMetadata,
    });

    res.json(analysisResult);
  } catch (error) {
    console.error("Error analyzing JD and resume:", error);
    throw error; // Let error handler middleware catch it
  }
}
