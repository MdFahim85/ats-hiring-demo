import express from "express";

import { roleMiddleware } from "../controllers/_middlewares";
import ROUTEMAP from "./ROUTEMAP";
import {
  getAllApplications,
  getApplicationById,
  getApplicationsByJobId,
  getApplicationsByCandidateId,
  createApplication,
  updateApplicationStatus,
  addApplicationNotes,
  deleteApplication,
} from "../controllers/application";

const applicationRouter = express.Router();

// Admin only routes
applicationRouter.get(
  ROUTEMAP.applications.get,
  roleMiddleware("admin"),
  getAllApplications,
);

// Protected routes (auth required)
applicationRouter.get(ROUTEMAP.applications.getById, getApplicationById);
applicationRouter.get(ROUTEMAP.applications.getByJob, getApplicationsByJobId);
applicationRouter.get(
  ROUTEMAP.applications.getByCandidate,
  getApplicationsByCandidateId,
);

// Candidate routes
applicationRouter.post(
  ROUTEMAP.applications.post,
  roleMiddleware("candidate"),
  createApplication,
);

// HR routes
applicationRouter.patch(
  ROUTEMAP.applications.updateStatus,
  roleMiddleware("hr"),
  updateApplicationStatus,
);
applicationRouter.patch(
  ROUTEMAP.applications.addNotes,
  roleMiddleware("hr"),
  addApplicationNotes,
);

// Admin routes
applicationRouter.delete(
  ROUTEMAP.applications.delete,
  roleMiddleware("admin"),
  deleteApplication,
);

export default applicationRouter;
