import express from "express";

import config from "../config";
// import { authMiddleware } from "../controllers/_middlewares";

import userRouter from "./user";
import ROUTEMAP from "./ROUTEMAP";
import jobRouter from "./job";
import applicationRouter from "./application";
import { authMiddleware, roleMiddleware } from "../controllers/_middlewares";
import interviewRouter from "./interview";
import notificationRouter from "./notification";
import adminRouter from "./admin";
import geminiRouter from "./gemini";

const router = express.Router();

router.use(
  ROUTEMAP.uploads.root + ROUTEMAP.uploads.pdf,
  express.static(config.pdfDir),
);
router.use(
  ROUTEMAP.uploads.root + ROUTEMAP.uploads.images,
  express.static(config.imageDir),
);

router.use(ROUTEMAP.users.root, userRouter);
router.use(ROUTEMAP.jobs.root, jobRouter);
router.use(
  ROUTEMAP.admin.root,
  authMiddleware,
  roleMiddleware(["admin"]),
  adminRouter,
);
router.use(ROUTEMAP.applications.root, authMiddleware, applicationRouter);
router.use(ROUTEMAP.interviews.root, authMiddleware, interviewRouter);
router.use(ROUTEMAP.notifications.root, authMiddleware, notificationRouter);
router.use(ROUTEMAP.ai.root, authMiddleware, geminiRouter);

export default router;
