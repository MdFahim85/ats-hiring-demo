// utils/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Job } from "../models/Job";

import { PDFParse } from "pdf-parse";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class AIService {
  private model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      maxOutputTokens: 2048,
    },
  });

  // Extract text from PDF buffer
  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      const uint8Array = new Uint8Array(pdfBuffer);
      const parser = new PDFParse(uint8Array);
      const result = await parser.getText();
      return result.text || "";
    } catch (error) {
      console.error("PDF Parse Error:", error);
      throw new Error("Failed to parse PDF");
    }
  }

  // Parse resume text and extract structured data
  async parseResumeText(resumeText: string) {
    const prompt = `Extract structured information from this resume:

${resumeText}

Extract and return ONLY valid JSON (no markdown, no backticks):
{
  "skills": ["skill1", "skill2", ...],
  "experience": "X years in field or brief experience summary",
  "education": "Highest degree and institution"
}

If information is not found, use empty arrays or "Not specified".`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response.text();

      // Clean response
      const cleaned = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Resume parsing error:", error);
      throw new Error("Failed to parse resume");
    }
  }

  // Task 1: Generate job description from HR input
  async generateJobPost(input: {
    title: string;
    department: string;
    requirements: string;
    salaryRange: string;
    jobType: string;
    deadline: Date;
  }) {
    const prompt = `Create a professional job posting:

Title: ${input.title}
Department: ${input.department}
Requirements: ${input.requirements}
Salary Range: ${input.salaryRange}
Job Type: ${input.jobType}
Deadline: ${input.deadline}

Generate a compelling job description (2-3 paragraphs) that:
- Describes the role and responsibilities
- Highlights what makes this position attractive
- Mentions the team/company culture fit
- Is professional but engaging

IMPORTANT: When including the deadline in the text, format it exactly like this format : Day, Month Date, Year, 11.59 pm. Example - "Saturday, February 28, 2026, 11:59 pm". Do follow this format stictly.

Return ONLY valid JSON (no markdown, no backticks):
{
  "description": "Full generated description here"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response.text();

      const cleaned = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Job description generation error:", error);
      throw new Error("Failed to generate job description");
    }
  }

  // Task 2: Rank candidates for a specific job
  async rankCandidatesForJob(
    job: {
      title: string;
      department: string;
      requirements: string;
    },
    candidates: Array<{
      id: number;
      name: string;
      email: string;
      skills: string[];
      experience: string;
      education: string;
    }>,
  ) {
    const prompt = `Rank these candidates for the job opening:

JOB:
Title: ${job.title}
Department: ${job.department}
Requirements: ${job.requirements}

CANDIDATES:
${candidates
  .map(
    (c, i) => `
${i + 1}. ${c.name} (ID: ${c.id})
   Skills: ${c.skills.join(", ") || "Not specified"}
   Experience: ${c.experience}
   Education: ${c.education}
`,
  )
  .join("\n")}

Analyze each candidate and return ONLY valid JSON (no markdown, no backticks):
{
  "rankedCandidates": [
    {
      "candidateId": number,
      "name": "Candidate name",
      "matchScore": 0-100,
      "strengths": ["strength1", "strength2"],
      "concerns": ["concern1", "concern2"],
      "recommendation": "Brief hiring recommendation"
    }
  ]
}

Sort by matchScore (highest first). Consider skills match, experience relevance, and education fit.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response.text();

      const cleaned = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Candidate ranking error:", error);
      throw new Error("Failed to rank candidates");
    }
  }

  // Task 3: Find matching jobs for candidate
  async findMatchingJobsForCandidate(
    candidate: {
      skills: string[];
      experience: string;
      education: string;
    },
    jobs: Job[],
  ) {
    const prompt = `Match this candidate to suitable jobs:

CANDIDATE PROFILE:
Skills: ${candidate.skills.join(", ") || "Not specified"}
Experience: ${candidate.experience}
Education: ${candidate.education}

AVAILABLE JOBS:
${jobs
  .map(
    (j, i) => `
${i + 1}. ${j.title} (ID: ${j.id})
   Department: ${j.department}
   Requirements: ${j.requirements.substring(0, 200)}...
   Salary: ${j.salaryRange || "Not specified"}
`,
  )
  .join("\n")}

Analyze and return ONLY valid JSON (no markdown, no backticks):
{
  "matchedJobs": [
    {
      "jobId": number,
      "title": "Job title",
      "matchScore": 0-100,
      "matchReason": "Why this is a good fit",
      "missingSkills": ["skill1", "skill2"]
    }
  ]
}

Sort by matchScore (highest first). Include top 5 matches only.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response.text();

      const cleaned = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Job matching error:", error);
      throw new Error("Failed to match jobs");
    }
  }
}
