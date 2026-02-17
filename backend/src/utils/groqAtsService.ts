// utils/groqService.ts
import OpenAI from "openai";
import { Job } from "../models/Job";
import env from "../config/env";
import { PDFParse } from "pdf-parse";

const openai = new OpenAI({
  apiKey: env.groq_API,
  baseURL: "https://api.groq.com/openai/v1",
});

export class AIService {
  private model = "llama-3.3-70b-versatile";

  private buildMessages(systemContent: string, userContent: string) {
    if (!userContent?.trim()) {
      throw new Error("Empty user message passed to AI");
    }
    return [
      { role: "system" as const, content: systemContent },
      { role: "user" as const, content: userContent.trim() },
    ];
  }

  // Safely parse JSON from model response, stripping any accidental markdown fences
  private parseJSON<T>(raw: string): T {
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    return JSON.parse(cleaned) as T;
  }

  //  PDF Parsing

  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      const parser = new PDFParse(new Uint8Array(pdfBuffer));
      const result = await parser.getText();
      return result.text || "";
    } catch (error) {
      console.error("PDF Parse Error:", error);
      throw new Error("Failed to parse PDF");
    }
  }

  //  Task 0: Resume Parsing

  async parseResumeText(resumeText: string): Promise<{
    skills: string[];
    experience: string;
    education: string;
  }> {
    if (!resumeText?.trim()) {
      throw new Error("Resume text is empty");
    }

    try {
      const completion = await openai.chat.completions.create({
        model: this.model,
        temperature: 0.3,
        // json_object is the mode Groq reliably supports
        response_format: { type: "json_object" },
        messages: this.buildMessages(
          `You extract resume information. 
Respond ONLY with valid JSON matching this exact shape:
{
  "skills": ["skill1", "skill2"],
  "experience": "summary string",
  "education": "degree and institution string"
}
No markdown, no extra keys.`,
          `Extract structured information from this resume:\n\n${resumeText}`,
        ),
      });

      const raw = completion.choices?.[0]?.message.content ?? "";
      return this.parseJSON(raw);
    } catch (error) {
      console.error("Resume parsing error:", error);
      throw new Error("Failed to parse resume");
    }
  }

  //  Task 1: Generate Job Post

  async generateJobPost(input: {
    title: string;
    department: string;
    requirements: string;
    salaryRange: string;
    jobType: string;
    deadline: Date;
  }): Promise<{ description: string }> {
    // Pre-format the deadline so the model doesn't have to guess
    const formattedDeadline = input.deadline.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    // Produces e.g. "Saturday, February 28, 2026" → append the time manually
    const deadlineString = `${formattedDeadline}, 11:59 pm`;

    try {
      const completion = await openai.chat.completions.create({
        model: this.model,
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: this.buildMessages(
          `You write professional job descriptions.
Respond ONLY with valid JSON matching this exact shape:
{
  "description": "full job description string"
}
No markdown, no extra keys.`,
          `Create a compelling job post for the following role.

Title: ${input.title}
Department: ${input.department}
Requirements: ${input.requirements}
Salary Range: ${input.salaryRange}
Job Type: ${input.jobType}
Application Deadline: ${deadlineString}

The description should be 2-3 paragraphs covering:
- Role responsibilities and day-to-day work
- What makes this position attractive
- Team culture and ideal candidate fit

Include the deadline in the text formatted exactly as: "${deadlineString}"`,
        ),
      });

      const raw = completion.choices?.[0]?.message.content ?? "";
      return this.parseJSON(raw);
    } catch (error) {
      console.error("Job description generation error:", error);
      throw new Error("Failed to generate job description");
    }
  }

  //  Task 2: Rank Candidates for a Job

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
  ): Promise<{
    rankedCandidates: Array<{
      candidateId: number;
      name: string;
      matchScore: number;
      strengths: string[];
      concerns: string[];
      recommendation: string;
    }>;
  }> {
    if (!candidates.length) {
      throw new Error("No candidates provided for ranking");
    }

    const candidateList = candidates
      .map(
        (c) =>
          `${c.name} (ID: ${c.id})
  Skills: ${c.skills.join(", ") || "Not specified"}
  Experience: ${c.experience}
  Education: ${c.education}`,
      )
      .join("\n\n");

    try {
      const completion = await openai.chat.completions.create({
        model: this.model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: this.buildMessages(
          `You objectively rank job candidates.
Respond ONLY with valid JSON matching this exact shape:
{
  "rankedCandidates": [
    {
      "candidateId": 1,
      "name": "string",
      "matchScore": 85,
      "strengths": ["string"],
      "concerns": ["string"],
      "recommendation": "string"
    }
  ]
}
Sort by matchScore descending. No markdown, no extra keys.`,
          `Rank the following candidates for this job opening.

JOB:
Title: ${job.title}
Department: ${job.department}
Requirements: ${job.requirements}

CANDIDATES:
${candidateList}`,
        ),
      });

      const raw = completion.choices?.[0]?.message.content ?? "";
      return this.parseJSON(raw);
    } catch (error) {
      console.error("Candidate ranking error:", error);
      throw new Error("Failed to rank candidates");
    }
  }

  //  Task 3: Find Matching Jobs for a Candidate

  async findMatchingJobsForCandidate(
    candidate: {
      skills: string[];
      experience: string;
      education: string;
    },
    jobs: Job[],
  ): Promise<{
    matchedJobs: Array<{
      jobId: number;
      title: string;
      matchScore: number;
      matchReason: string;
      missingSkills: string[];
    }>;
  }> {
    if (!jobs.length) {
      throw new Error("No jobs provided for matching");
    }

    const jobList = jobs
      .map(
        (j) =>
          `${j.title} (ID: ${j.id})
  Department: ${j.department}
  Requirements: ${j.requirements.slice(0, 200)}...
  Salary: ${j.salaryRange || "Not specified"}`,
      )
      .join("\n\n");

    try {
      const completion = await openai.chat.completions.create({
        model: this.model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: this.buildMessages(
          `You match candidates to suitable job openings.
Respond ONLY with valid JSON matching this exact shape:
{
  "matchedJobs": [
    {
      "jobId": 1,
      "title": "string",
      "matchScore": 90,
      "matchReason": "string",
      "missingSkills": ["string"]
    }
  ]
}
Return the top 5 matches only, sorted by matchScore descending. No markdown, no extra keys.`,
          `Match this candidate to the most suitable jobs from the list below.

CANDIDATE:
Skills: ${candidate.skills.join(", ") || "Not specified"}
Experience: ${candidate.experience}
Education: ${candidate.education}

AVAILABLE JOBS:
${jobList}`,
        ),
      });

      const raw = completion.choices?.[0]?.message.content ?? "";
      return this.parseJSON(raw);
    } catch (error) {
      console.error("Job matching error:", error);
      throw new Error("Failed to match jobs");
    }
  }
}
