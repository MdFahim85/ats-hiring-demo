import express from "express";

import { authMiddleware, roleMiddleware } from "../controllers/_middlewares";
import ROUTEMAP from "./ROUTEMAP";
import {
  getDashboardMetrics,
  getHrUsers,
  getHrById,
  createHr,
  updateHr,
  deleteHr,
  getAllJobs,
  getAllCandidates,
} from "../controllers/admin";

const adminRouter = express.Router();

// Dashboard
adminRouter.get(ROUTEMAP.admin.dashboard, getDashboardMetrics);

// HR Management
adminRouter.get(ROUTEMAP.admin.getHrUsers, getHrUsers);
adminRouter.get(ROUTEMAP.admin.getHrById, getHrById);
adminRouter.post(ROUTEMAP.admin.createHr, createHr);
adminRouter.put(ROUTEMAP.admin.updateHr, updateHr);
adminRouter.delete(ROUTEMAP.admin.deleteHr, deleteHr);

// System Overview
adminRouter.get(ROUTEMAP.admin.getAllJobs, getAllJobs);
adminRouter.get(ROUTEMAP.admin.getAllCandidates, getAllCandidates);

export default adminRouter;
