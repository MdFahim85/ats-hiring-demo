import express from "express";

import { roleMiddleware } from "../controllers/_middlewares";
import ROUTEMAP from "./ROUTEMAP";
import {
  getAllInterviews,
  getInterviewById,
  getInterviewsByJobId,
  getInterviewsByCandidateId,
  getInterviewByApplicationId,
  createInterview,
  bulkScheduleInterviews,
  updateInterview,
  updateInterviewStatus,
  addPreparationNotes,
  addFeedback,
  deleteInterview,
} from "../controllers/interview";

const interviewRouter = express.Router();

// Admin only routes
interviewRouter.get(
  ROUTEMAP.interviews.get,
  roleMiddleware(["admin"]),
  getAllInterviews,
);

// Protected routes (auth required)
interviewRouter.get(ROUTEMAP.interviews.getById, getInterviewById);
interviewRouter.get(ROUTEMAP.interviews.getByJob, getInterviewsByJobId);
interviewRouter.get(
  ROUTEMAP.interviews.getByCandidate,
  getInterviewsByCandidateId,
);
interviewRouter.get(
  ROUTEMAP.interviews.getByApplication,
  getInterviewByApplicationId,
);

// HR routes
interviewRouter.post(
  ROUTEMAP.interviews.post,
  roleMiddleware(["hr"]),
  createInterview,
);
interviewRouter.post(
  ROUTEMAP.interviews.bulkSchedule,
  roleMiddleware(["hr"]),
  bulkScheduleInterviews,
);
interviewRouter.put(
  ROUTEMAP.interviews.put,
  roleMiddleware(["hr"]),
  updateInterview,
);
interviewRouter.put(
  ROUTEMAP.interviews.updateStatus,
  roleMiddleware(["hr"]),
  updateInterviewStatus,
);
interviewRouter.put(
  ROUTEMAP.interviews.addPreparationNotes,
  roleMiddleware(["hr"]),
  addPreparationNotes,
);
interviewRouter.put(
  ROUTEMAP.interviews.addFeedback,
  roleMiddleware(["hr"]),
  addFeedback,
);
interviewRouter.delete(
  ROUTEMAP.interviews.delete,
  roleMiddleware(["admin"]),
  deleteInterview,
);

export default interviewRouter;
