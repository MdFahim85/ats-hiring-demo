// routes/aiRouter.ts
import express from "express";
import { authMiddleware, roleMiddleware } from "../controllers/_middlewares";
import {
  generateJobDescription,
  rankCandidatesForJob,
  findMatchingJobs,
  chat,
} from "../controllers/ai";
import ROUTEMAP from "./ROUTEMAP";

const aiRouter = express.Router();

// Chat
aiRouter.post(ROUTEMAP.ai.chat, chat);

// HR: Generate job description from input
aiRouter.post(
  ROUTEMAP.ai.generateDesc,
  roleMiddleware(["hr"]),
  generateJobDescription,
);

// HR: Rank candidates for a job
aiRouter.post(
  ROUTEMAP.ai.rankCandidates,
  roleMiddleware(["hr"]),
  rankCandidatesForJob,
);

// Candidate: Find matching jobs
aiRouter.get(
  ROUTEMAP.ai.matchJobs,
  roleMiddleware(["candidate"]),
  findMatchingJobs,
);

export default aiRouter;
