import express from "express";

import { authMiddleware, roleMiddleware } from "../controllers/_middlewares";
import ROUTEMAP from "./ROUTEMAP";
import {
  getAllJobs,
  getPublicJobs,
  getJobById,
  getPublicJobById,
  getJobsByHrId,
  createJob,
  updateJob,
  closeJob,
  deleteJob,
} from "../controllers/job";

const jobRouter = express.Router();

// Public routes (no auth required)
jobRouter.get(ROUTEMAP.jobs.getPublic, getPublicJobs);
jobRouter.get(ROUTEMAP.jobs.getPublicById, getPublicJobById);

// Protected routes (auth required)
jobRouter.get(ROUTEMAP.jobs.get, authMiddleware, getAllJobs);
jobRouter.get(ROUTEMAP.jobs.getById, authMiddleware, getJobById);
jobRouter.get(ROUTEMAP.jobs.getByHr, authMiddleware, getJobsByHrId);

// HR only routes
jobRouter.post(
  ROUTEMAP.jobs.post,
  authMiddleware,
  roleMiddleware(["hr"]),
  createJob,
);
jobRouter.put(
  ROUTEMAP.jobs.put,
  authMiddleware,
  roleMiddleware(["hr"]),
  updateJob,
);
jobRouter.put(
  ROUTEMAP.jobs.close,
  authMiddleware,
  roleMiddleware(["hr"]),
  closeJob,
);
jobRouter.delete(
  ROUTEMAP.jobs.delete,
  authMiddleware,
  roleMiddleware(["hr"]),
  deleteJob,
);

export default jobRouter;
