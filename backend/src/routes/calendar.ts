import express from "express";
import { authMiddleware, roleMiddleware } from "../controllers/_middlewares";
import {
  getAuthUrl,
  oauthCallback,
  getCalendarStatus,
  getCalendarEmbedUrl,
} from "../controllers/calendar";
import ROUTEMAP from "./ROUTEMAP";

const calendarRouter = express.Router();

// Get OAuth URL (HR only)
calendarRouter.get(
  ROUTEMAP.calendar.authUrl,
  authMiddleware,
  roleMiddleware(["hr"]),
  getAuthUrl,
);

// OAuth callback (Google redirects here - no auth middleware)
calendarRouter.get(ROUTEMAP.calendar.callBack, oauthCallback);

// Check calendar connection status (HR only)
calendarRouter.get(
  ROUTEMAP.calendar.status,
  authMiddleware,
  roleMiddleware(["hr"]),
  getCalendarStatus,
);

// routes/calendarRouter.ts
calendarRouter.get(
  ROUTEMAP.calendar.embedURL,
  authMiddleware,
  roleMiddleware(["hr"]),
  getCalendarEmbedUrl,
);

export default calendarRouter;
