/**
 * OpenAI API service with retry logic and structured response handling
 */
import axios, {AxiosError} from "axios";

import type {
  AnalyzeResponse,
  JobMetaDataResponse,
  ParsedJobMetadata,
  StructuredJD,
  StructuredResume,
  TailoredResume,
} from "../types/index.js";
import {sanitizeText} from "../utils/sanitizeText.js";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface RetryableError extends Error {
  isRetryable?: boolean;
  statusCode?: number;
}

/**
 * Checks if an error status code is retryable
 */
function isRetryableStatus(statusCode?: number): boolean {
  return (
    statusCode === 429 ||
    statusCode === 500 ||
    statusCode === 502 ||
    statusCode === 503
  );
}

/**
 * Creates a retryable error from an axios error
 */
function createRetryableError(axiosError: AxiosError): RetryableError {
  const statusCode = axiosError.response?.status;
  return {
    name: "OpenAIError",
    message: axiosError.message || "OpenAI API request failed",
    isRetryable: isRetryableStatus(statusCode),
    statusCode,
  } as RetryableError;
}

/**
 * Handles non-retryable errors by throwing appropriate error messages
 */
function handleNonRetryableError(error: RetryableError): never {
  const statusCode = error.statusCode;

  if (statusCode === 401) {
    throw new Error("Invalid OpenAI API key");
  }
  if (statusCode === 400) {
    throw new Error("Invalid request to OpenAI API");
  }

  throw error;
}

/**
 * Makes a single OpenAI API call
 */
async function makeOpenAIRequest(
  apiKey: string,
  messages: Array<{role: string; content: string}>,
  model: string,
  temperature: number,
  maxTokens?: number
): Promise<string> {
  const requestBody: any = {
    model,
    messages,
    temperature,
    response_format: {type: "json_object"},
  };

  if (maxTokens) {
    requestBody.max_tokens = maxTokens;
  }

  const response = await axios.post(OPENAI_API_URL, requestBody, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 60000, // 60 seconds
  });

  const content = response.data.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI API");
  }

  return content;
}

/**
 * Calls OpenAI Chat API with retry logic for 429 and 500 errors
 */
async function callOpenAIChat(
  messages: Array<{role: string; content: string}>,
  model: string = "gpt-4o-mini",
  temperature: number = 0.3,
  maxTokens?: number
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  let lastError: RetryableError | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await makeOpenAIRequest(
        apiKey,
        messages,
        model,
        temperature,
        maxTokens
      );
    } catch (error) {
      const axiosError = error as AxiosError;
      lastError = createRetryableError(axiosError);

      // If error is not retryable, throw immediately
      if (!lastError.isRetryable) {
        handleNonRetryableError(lastError);
      }

      // Wait before retrying (exponential backoff)
      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.info(
          `Retrying OpenAI API call (attempt ${attempt + 1}/${MAX_RETRIES}) after ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `OpenAI API call failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}

/**
 * Preprocesses a job description into structured format
 */
export async function preProcessJD(jd: string): Promise<StructuredJD> {
  const sanitizedJD = sanitizeText(jd.substring(0, 6000));

  const extractionPrompt = `
You are an expert Job Description analyst and structured data extractor.

Your goal is to analyze the given Job Description text and extract a detailed, structured JSON object
that captures all critical information needed to match candidates.

Guidelines:
1. Understand the JD contextually — infer role type, required technologies, and domain focus.
2. Separate **must-have skills** (core skills explicitly or strongly implied) and **nice-to-have skills** (optional or supportive).
3. Identify the main **responsibilities** in clear bullet points.
4. Extract **experience level**, **education requirements**, **employment type** (full-time, contract, etc.), and **location** if available.
5. Include any **tools, frameworks, libraries, or technologies** mentioned in the JD.
6. Avoid unnecessary words or duplication.
7. Use consistent casing and concise phrasing.
8. Respond ONLY with valid JSON — no markdown, no explanations.

Return structured JSON in this format:
{
  "title": string,
  "company": string,
  "location": string,
  "employmentType": string, // e.g. "Full-time", "Contract", etc.
  "experienceLevel": string, // e.g. "Mid-level", "Senior", "Entry-level"
  "educationRequirements": string[],
  "domain": string, // e.g. "FinTech", "Healthcare", etc.
  "responsibilities": string[],
  "mustHaveSkills": string[],
  "niceToHaveSkills": string[],
  "technologies": string[],
  "summary": string // 2-3 sentences summarizing the JD
}

Job Description Text:
${sanitizedJD}
`;

  try {
    const response = await callOpenAIChat(
      [
        {
          role: "system",
          content:
            "You are a professional job description parser that outputs structured JSON.",
        },
        {role: "user", content: extractionPrompt},
      ],
      "gpt-4o-mini",
      0.3,
      1200
    );

    const jdData: StructuredJD = JSON.parse(response.trim());

    return {
      title: jdData.title || "",
      company: jdData.company || "",
      location: jdData.location || "",
      employmentType: jdData.employmentType || "",
      experienceLevel: jdData.experienceLevel || "",
      educationRequirements: jdData.educationRequirements || [],
      domain: jdData.domain || "",
      responsibilities: jdData.responsibilities || [],
      mustHaveSkills: jdData.mustHaveSkills || [],
      niceToHaveSkills: jdData.niceToHaveSkills || [],
      technologies: jdData.technologies || [],
      summary: jdData.summary || "",
    };
  } catch (error) {
    console.error("Error processing Job Description:", error);
    throw new Error(
      `Failed to preprocess job description: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Preprocesses a resume into structured format
 */
export async function preprocessResume(
  resumeText: string
): Promise<StructuredResume> {
  const sanitizedResume = sanitizeText(resumeText.substring(0, 6000));

  const extractionPrompt = `
You are an expert resume analyst and structured data extractor.

Your goal is to deeply analyze the following resume text and extract a comprehensive structured JSON object.

Guidelines:
1. Read the resume holistically, not just literally. Infer details when clearly implied.
2. If explicit skill sections are missing, extract skills mentioned inside experience, projects, and summary.
3. Normalize and deduplicate skills (e.g., "React.js" → "React", "Javascript" → "JavaScript").
4. Parse education, experience, and projects chronologically if possible.
5. Infer total years and months of experience with particular skills like 4 years of frontend experience, 2 years of backend experience, 4 years of sales experience, etc.
6. For experience and project bullet points, rewrite them briefly but clearly.
7. Use consistent ISO date format (YYYY-MM-DD if full date available, otherwise YYYY-MM).
8. Do not invent unrealistic data — only infer if it is strongly implied.
9. Keep all strings trimmed and concise.
10. Respond ONLY with valid JSON (no markdown, no explanations).

Output JSON structure:
{
  "name": string,
  "email": string,
  "phone": string,
  "location": string,
  "summary": string,
  "skills": string[], // inferred + explicit skills
  "education": [
    {
      "institution": string,
      "degree": string,
      "field": string,
      "startDate": string,
      "endDate": string
    }
  ],
  "inferredExperience": [
    {
      "bullets": string[],
      "technologies": string[]
    }
  ],
  "experience": [
    {
      "company": string,
      "title": string,
      "location": string,
      "startDate": string,
      "endDate": string,
      "bullets": string[], // concise key achievements
      "technologies": string[] // technologies & tools from text
    }
  ],
  "projects": [
    {
      "name": string,
      "description": string,
      "technologies": string[],
      "bullets": string[]
    }
  ],
  "certifications": string[]
}

Resume Text:
${sanitizedResume}
`;

  try {
    const response = await callOpenAIChat(
      [
        {role: "system", content: "You extract structured JSON from resumes."},
        {role: "user", content: extractionPrompt},
      ],
      "gpt-4o-mini",
      0.2,
      1200
    );

    try {
      return JSON.parse(response.trim());
    } catch {
      // Fallback structure if parsing fails
      return {
        name: "",
        email: "",
        phone: "",
        location: "",
        summary: sanitizedResume.substring(0, 1000),
        skills: [],
        education: [],
        experience: [],
        projects: [],
        certifications: [],
      };
    }
  } catch (error) {
    console.error("Error preprocessing resume:", error);
    throw new Error(
      `Failed to preprocess resume: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Parse job metadata from HTML string
 */
export async function parseJobMetadata(
  metadataHtmlString: string
): Promise<JobMetaDataResponse> {
  const sanitizedHtml = sanitizeText(metadataHtmlString.substring(0, 6000));

  const extractionPrompt = `
You are an expert HTML parser that extracts job posting metadata from LinkedIn-like HTML pages.

Your goal is to analyze the given HTML string and extract structured job metadata in the following JSON format:

{
  "company": {
    "name": "",
    "logo": "",
    "linkedinUrl": ""
  },
  "job": {
    "title": "",
    "location": "",
    "employmentType": "",
    "applyUrl": "",
    "posted": "",
    "applicants": "",
    "promotedBy": "",
    "responsesManaged": ""
  }
}

Instructions:
- Parse the HTML carefully and extract only what is visible or explicitly stated in the HTML.
- If any field is missing or not clearly available, return an empty string for that field.
- Do not infer or guess values.
- Ensure the output is valid JSON — no extra text, markdown, or explanations.
- Keep URLs exactly as they appear in the HTML, even if they are relative.
- For "company.logo", return the image URL from the <img> tag with alt containing "logo".
- For "company.name" and "company.linkedinUrl", extract from the company name <a> tag.
- For "job.title", extract the full text of the <h1> job title link.
- For "job.location", extract the text showing the location (city, state, country).
- For "employmentType", use the text after the check icon (e.g., “Full-time”).
- For "applyUrl", extract the href from the job title link (<h1><a>...</a></h1>).
- For "posted", extract the text containing “Reposted” or similar phrases.
- For "applicants", extract the phrase like “Over 100 people clicked apply”.
- For "promotedBy" and "responsesManaged", extract the text following those labels if present.

Return only the JSON object.

HTML:

${sanitizedHtml}
`;

  try {
    const response = await callOpenAIChat(
      [
        {
          role: "system",
          content:
            "You are an HTML parser that extracts structured job metadata from HTML content.",
        },
        {role: "user", content: extractionPrompt},
      ],
      "gpt-4o-mini",
      0.2,
      1000
    );

    const parsed: ParsedJobMetadata = JSON.parse(response.trim());

    return {
      companyLinkedInUrl: parsed.company.linkedinUrl || "",
      companyLogoUrl: parsed.company.logo || "",
      companyName: parsed.company.name || "",
      jobTitle: parsed.job.title || "",
      location: parsed.job.location || "",
      salary: "",
      postedDate: parsed.job.posted || "",
      applicationDeadline: "",
      jobType: parsed.job.employmentType || "",
      remote: "",
      benefits: [],
      additionalInfo: {},
    };
  } catch (error) {
    console.error("Error parsing job metadata:", error);
    // Return empty metadata on error
    return {
      companyLinkedInUrl: "",
      companyLogoUrl: "",
      companyName: "",
      jobTitle: "",
      location: "",
      salary: "",
      postedDate: "",
      applicationDeadline: "",
      jobType: "",
      remote: "",
      benefits: [],
      additionalInfo: {},
    };
  }
}

/**
 * Base analysis result (without structuredJD and tailoredResume)
 */
interface BaseAnalysisResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  sampleBullets: string[];
  summary: string;
}

/**
 * Call OpenAI API for JD-Resume analysis
 * PRIVACY: Only sends sanitized JD and resume text - no personal identifiers
 */
async function callOpenAI(
  jd: string,
  structuredResumeJson: string,
  structuredJDJson: string
): Promise<BaseAnalysisResult> {
  const sanitizedJD = sanitizeText(jd.substring(0, 3000));

  const prompt = `
You are an expert technical recruiter and AI-powered resume evaluator.  
Your task is to deeply analyze and compare the following:
1. The **original Job Description text** (for tone, role intent, and domain cues).
2. The **structured Job Description JSON** (for explicit requirements, skills, and responsibilities).
3. The **structured Resume JSON** (for the candidate's skills, experience, education, and projects).

Your goal is to produce a comprehensive job–resume fit analysis.

Guidelines:
1. Consider both **explicit and inferred skills and inferred experience** in the resume (from experience, inferredExperience, projects, and technologies).
2. Evaluate **semantic similarity**, not just keyword overlap — e.g., "React.js" ≈ "React", "Node" ≈ "Express".
3. Analyze **role level alignment** (junior/mid/senior) based on experience and responsibilities.
4. Check **domain and tool match** — e.g., FinTech, SaaS, Healthcare.
5. Identify **must-have skills** missing or weakly represented.
6. Provide **3–5 actionable suggestions** for improving the resume alignment for this JD.
7. Include **3–5 sample bullet points** that naturally incorporate missing or weak skills.
8. Respond ONLY with valid JSON — no markdown, no extra text, no explanations.
9. While evaluating missing skills and must have skills, consider the inferred experience (inferredExperience array in structured resume JSON) as well.
10. Like if in inferredExperience, there is an n number of years of experience with a particular skill, then consider that skill as well (e.g 5 years of sales experience, 3 years of frontend experience, etc).

Return strictly in the following JSON format:
{
  "matchScore": number, // overall job fit score (0-100)
  "matchedSkills": string[], // exact and semantically similar skills found in both JD and resume
  "missingSkills": string[], // key JD skills missing or weakly represented in resume
  "suggestions": string[], // actionable resume improvement suggestions
  "sampleBullets": string[], // example bullets improving alignment
  "summary": string // 2–3 sentence overview of candidate fit, strengths, and improvement areas
}

Job Description (raw text):
${sanitizedJD}

Structured Job Description (JSON):
${structuredJDJson}

Structured Resume (JSON):
${structuredResumeJson}
`;

  try {
    const response = await callOpenAIChat(
      [
        {
          role: "system",
          content:
            "You are a job resume matching expert that produces accurate, structured JSON analyses.",
        },
        {role: "user", content: prompt},
      ],
      "gpt-4o-mini",
      0.5,
      1800
    );

    const result: BaseAnalysisResult = JSON.parse(response.trim());

    return {
      matchScore: Math.min(100, Math.max(0, result.matchScore || 0)),
      matchedSkills: result.matchedSkills || [],
      missingSkills: result.missingSkills || [],
      suggestions: result.suggestions || [],
      sampleBullets: result.sampleBullets || [],
      summary: result.summary || "",
    };
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw new Error(
      `Failed to analyze job description and resume: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Analyzes a job description and resume, returning match analysis and tailored resume
 */
export async function analyze(
  jd: string,
  structuredResume: StructuredResume,
  metadataHtmlString?: string
): Promise<AnalyzeResponse> {
  try {
    // Preprocess JD
    const structuredJD = await preProcessJD(jd);

    // Parse job metadata if provided
    let parsedMetadata: JobMetaDataResponse | undefined;
    if (metadataHtmlString && metadataHtmlString.trim().length > 0) {
      try {
        parsedMetadata = await parseJobMetadata(metadataHtmlString);
        console.info("Successfully parsed job metadata");
      } catch (error) {
        console.warn("Failed to parse job metadata:", error);
        // Continue without metadata if parsing fails
      }
    }

    // Inject structured resume JSON into the analysis prompt
    const structuredResumeJson = JSON.stringify(structuredResume);
    const structuredJDJson = JSON.stringify(structuredJD);

    const baseAnalysis = await callOpenAI(
      jd,
      structuredResumeJson,
      structuredJDJson
    );

    // Build complete analysis result
    const analysisResult: AnalyzeResponse = {
      ...baseAnalysis,
      structuredJD,
      tailoredResume: {
        tailoredSummary: "",
        tailoredSkills: [],
        tailoredExperience: [],
        tailoredProjects: [],
        coverLetterHighlights: [],
      },
      jobMetadata: parsedMetadata,
    };

    // Generate tailored resume content
    try {
      const tailoredResume = await generateTailoredResume(
        structuredJD,
        structuredResume
      );
      analysisResult.tailoredResume = tailoredResume;
    } catch (error) {
      console.warn("Failed to generate tailored resume:", error);
      // Continue with empty tailored resume structure if generation fails
    }

    return analysisResult;
  } catch (error) {
    console.error("Error analyzing JD and resume:", error);
    throw new Error(
      `Failed to analyze job description and resume: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate tailored resume content optimized for the specific job
 */
export async function generateTailoredResume(
  structuredJD: StructuredJD,
  structuredResume: StructuredResume
): Promise<TailoredResume> {
  const prompt = `
You are an expert resume writer and career coach. Your task is to tailor a candidate's resume specifically for a job opportunity.

Based on the structured Job Description and the candidate's Structured Resume, generate optimized resume sections that highlight the best fit between the candidate and the job.

Guidelines:
1. Create a **tailored professional summary** (2-3 sentences) that emphasizes the candidate's most relevant experience, skills, and achievements for this specific role.
2. Prioritize and reorder **skills** to match the job's must-have and nice-to-have skills list, placing the most relevant at the top.
3. For top 2 **experience entry**, suggest 4-5 tailored bullet points that:
   - Use a smart combination of missing skills and already present skills between the structuredJD JSON and structuredResume JSON in each bullet point
   - Highlight achievements that align with the job requirements
   - Quantify results where possible
   - Show progression and impact
   - Include the **company name** from the structuredResume JSON for each experience entry
4. For **projects**, suggest tailored descriptions that emphasize technologies and outcomes relevant to the job.
5. Provide **cover letter highlights** - 3-5 key talking points the candidate should emphasize in their cover letter.

Important:
- Keep all content authentic and truthful to the candidate's actual experience
- Focus on reframing and emphasizing existing experience, not creating false experience
- Match the tone and terminology used in the job description
- Prioritize must-have skills from the JD
- Consider the job's domain, technologies, and responsibilities

Return ONLY valid JSON in this format:
{
  "tailoredSummary": string,
  "tailoredSkills": string[],
  "tailoredExperience": [
    {
      "role": string,
      "company": string,
      "bullets": string[]
    }
  ],
  "tailoredProjects": [
    {
      "name": string,
      "description": string,
      "bullets": string[]
    }
  ],
  "coverLetterHighlights": string[]
}

Structured Job Description:
${JSON.stringify(structuredJD, null, 2)}

Structured Resume:
${JSON.stringify(structuredResume, null, 2)}
`;

  try {
    const response = await callOpenAIChat(
      [
        {
          role: "system",
          content:
            "You are a professional resume writer that produces tailored, authentic resume content in JSON format.",
        },
        {role: "user", content: prompt},
      ],
      "gpt-4o-mini",
      0.7,
      2000
    );

    const result: TailoredResume = JSON.parse(response.trim());

    return {
      tailoredSummary: result.tailoredSummary || "",
      tailoredSkills: result.tailoredSkills || [],
      tailoredExperience: result.tailoredExperience || [],
      tailoredProjects: result.tailoredProjects || [],
      coverLetterHighlights: result.coverLetterHighlights || [],
    };
  } catch (error) {
    console.error("Error generating tailored resume:", error);
    throw new Error(
      `Failed to generate tailored resume: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
