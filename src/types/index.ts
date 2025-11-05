/**
 * Type definitions for the API service
 */

export interface StructuredJD {
  title: string;
  company: string;
  location: string;
  employmentType: string; // e.g. "Full-time", "Contract", etc.
  experienceLevel: string; // e.g. "Mid-level", "Senior", "Entry-level"
  educationRequirements: string[];
  domain: string; // e.g. "FinTech", "Healthcare", etc.
  responsibilities: string[];
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  technologies: string[];
  summary: string; // 2-3 sentences summarizing the JD
}

export interface StructuredResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[]; // inferred + explicit skills
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
  }>;
  inferredExperience?: Array<{
    bullets: string[];
    technologies: string[];
  }>;
  experience: Array<{
    company: string;
    title: string;
    location: string;
    startDate: string;
    endDate: string;
    bullets: string[]; // concise key achievements
    technologies: string[]; // technologies & tools from text
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    bullets: string[];
  }>;
  certifications: string[];
}

export interface TailoredResume {
  tailoredSummary: string;
  tailoredSkills: string[];
  tailoredExperience: Array<{
    role: string;
    company: string;
    bullets: string[];
  }>;
  tailoredProjects: Array<{
    name: string;
    description: string;
    bullets: string[];
  }>;
  coverLetterHighlights: string[];
}

export interface AnalysisResult {
  matchScore: number; // overall job fit score (0-100)
  matchedSkills: string[]; // exact and semantically similar skills found in both JD and resume
  missingSkills: string[]; // key JD skills missing or weakly represented in resume
  suggestions: string[]; // actionable resume improvement suggestions
  sampleBullets: string[]; // example bullets improving alignment
  summary: string; // 2-3 sentence overview of candidate fit, strengths, and improvement areas
  structuredJD: StructuredJD;
  tailoredResume: TailoredResume;
}

export interface AnalyzeResponse extends AnalysisResult {}

export interface PreprocessJDRequest {
  jd: string;
}

export interface PreprocessJDResponse {
  structuredJD: StructuredJD;
}

export interface PreprocessResumeRequest {
  resumeText: string;
}

export interface PreprocessResumeResponse {
  structuredResume: StructuredResume;
}

export interface AnalyzeRequest {
  jd: string;
  resume: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
