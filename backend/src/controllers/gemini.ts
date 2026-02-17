// controllers/ai.ts
import { RequestHandler } from "express";
import fs from "fs/promises";
import path from "path";

import { AIService } from "../utils/geminiService";
import ApplicationModel from "../models/Application";
import JobModel, { addJobSchema, Job } from "../models/Job";
import UserModel from "../models/User";
import config from "../config";
import ResponseError from "../utils/ResponseError";
import status from "http-status";

const aiService = new AIService();

// HR TASK 1: Generate job description from input
export const generateJobDescription: RequestHandler<
  {},
  string,
  Partial<Job>
> = async (req, res) => {
  try {
    const user = req.user;

    if (!user)
      throw new ResponseError(
        "You must be logged in to access this",
        status.UNAUTHORIZED,
      );

    if (user.role !== "hr") {
      throw new ResponseError(
        "You must be an HR to access this",
        status.UNAUTHORIZED,
      );
    }

    req.body.deadline = new Date(req.body.deadline!);

    const { title, department, requirements, salaryRange, jobType, deadline } =
      await addJobSchema
        .omit({ description: true, hrId: true, status: true, createdAt: true })
        .parseAsync(req.body);

    const result: { description: string } = await aiService.generateJobPost({
      title,
      department,
      requirements,
      salaryRange: salaryRange || "Competitive",
      jobType: jobType || "Full-time",
      deadline,
    });

    res.json(result.description);
  } catch (error) {
    console.error("Generate job description error:", error);
    throw new ResponseError(
      "Failed to generate job description",
      status.BAD_REQUEST,
    );
  }
};

// HR TASK 2: Rank candidates for a specific job
export const rankCandidatesForJob: RequestHandler<
  {},
  {
    candidateId: number;
    name: string;
    matchScore: number;
    strengths: string[];
    concerns: string[];
    recommendation: string;
  }[],
  { jobId: Job["id"] }
> = async (req, res) => {
  try {
    const user = req.user;

    if (!user)
      throw new ResponseError(
        "You must be logged in to access this",
        status.UNAUTHORIZED,
      );

    if (user.role !== "hr") {
      throw new ResponseError(
        "You must be an HR to access this",
        status.UNAUTHORIZED,
      );
    }

    const { jobId } = req.body;

    // Get job details
    const job = await JobModel.getJobById(jobId);
    if (!job) {
      throw new ResponseError("Job not found", status.NOT_FOUND);
    }

    // Get all applications for this job
    const applications = await ApplicationModel.getApplicationsByJobId(jobId);

    if (applications.length === 0)
      throw new ResponseError(
        "No applicants for this job yet",
        status.NOT_FOUND,
      );

    // Get candidate IDs
    const candidateIds = applications.map((app) => app.candidateId);

    // Fetch all candidates
    const candidates = await UserModel.getUsersByIds(candidateIds);

    // Parse each candidate's resume
    const parsedCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        try {
          if (!candidate.cvUrl) {
            return {
              id: candidate.id,
              name: candidate.name,
              email: candidate.email,
              skills: [],
              experience: "Not specified",
              education: "Not specified",
            };
          }

          // Read CV file
          const cvPath = path.join(config.pdfDir, candidate.cvUrl);
          const pdfBuffer = await fs.readFile(cvPath);

          // Extract text from PDF
          const resumeText = await aiService.extractTextFromPDF(pdfBuffer);

          // Parse resume with AI
          const parsed = await aiService.parseResumeText(resumeText);

          return {
            id: candidate.id,
            name: candidate.name,
            email: candidate.email,
            skills: parsed.skills || [],
            experience: parsed.experience || "Not specified",
            education: parsed.education || "Not specified",
          };
        } catch (error) {
          console.error(
            `Failed to parse CV for candidate ${candidate.id}:`,
            error,
          );
          return {
            id: candidate.id,
            name: candidate.name,
            email: candidate.email,
            skills: [],
            experience: "CV parsing failed",
            education: "Not specified",
          };
        }
      }),
    );

    // Rank candidates using AI
    const ranking = await aiService.rankCandidatesForJob(
      {
        title: job.title,
        department: job.department,
        requirements: job.requirements,
      },
      parsedCandidates,
    );

    res.json(ranking.rankedCandidates);
  } catch (error) {
    console.error("Rank candidates error:", error);
    throw new ResponseError(
      "Failed to rank candidates",
      status.SERVICE_UNAVAILABLE,
    );
  }
};

// CANDIDATE TASK: Find matching jobs
export const findMatchingJobs: RequestHandler = async (req, res) => {
  try {
    const user = req.user!;

    if (user.role !== "candidate") {
      return res.status(403).json({ message: "Candidates only" });
    }

    if (!user.cvUrl) {
      return res.status(400).json({ message: "Please upload your CV first" });
    }

    // Read candidate's CV
    const cvPath = path.join(config.pdfDir, user.cvUrl);
    const pdfBuffer = await fs.readFile(cvPath);

    // Extract text from PDF
    const resumeText = await aiService.extractTextFromPDF(pdfBuffer);

    // Parse resume with AI
    const parsed = await aiService.parseResumeText(resumeText);

    // Get all active jobs
    const allJobs = await JobModel.getJobs();
    const activeJobs = allJobs.filter((j) => j.status === "active");

    if (activeJobs.length === 0) {
      return res.json({
        success: true,
        data: { matchedJobs: [] },
        message: "No active jobs available at the moment",
      });
    }

    // Find matching jobs using AI
    const matches = await aiService.findMatchingJobsForCandidate(
      {
        skills: parsed.skills || [],
        experience: parsed.experience || "Not specified",
        education: parsed.education || "Not specified",
      },
      activeJobs.map((j) => ({
        ...j,
      })),
    );

    res.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    console.error("Find matching jobs error:", error);
    res.status(500).json({ message: "Failed to find matching jobs" });
  }
};
