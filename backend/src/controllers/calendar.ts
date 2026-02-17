import { RequestHandler } from "express";
import { calendarService } from "../utils/calendarService";
import UserModel from "../models/User";
import ResponseError from "../utils/ResponseError";
import status from "http-status";
import env from "../config/env";
import { calendar_v3 } from "googleapis";

// Get OAuth URL for HR to authorize Google Calendar
export const getAuthUrl: RequestHandler = async (req, res) => {
  const user = req.user!;
  const url = calendarService.getAuthUrl(user.id.toString());
  res.json({ url });
};

// OAuth callback - Google redirects here after HR authorizes
export const oauthCallback: RequestHandler = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== "string") {
      throw new ResponseError("Invalid auth code", status.BAD_REQUEST);
    }

    if (!state || typeof state !== "string") {
      throw new ResponseError("Invalid state", status.BAD_REQUEST);
    }

    const tokens = await calendarService.getTokensFromCode(code);

    const userId = parseInt(state);

    await UserModel.editUser(userId, {
      googleAccessToken: tokens.access_token!,
      googleRefreshToken: tokens.refresh_token!,
    });

    res.redirect(`${env.frontend_API}/hr/dashboard?calendar=connected`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.redirect(`${env.frontend_API}/hr/dashboard?calendar=error`);
  }
};
// Check if HR has connected Google Calendar
export const getCalendarStatus: RequestHandler = async (req, res) => {
  const user = req.user!;
  res.json({
    connected: !!user.googleAccessToken,
  });
};

export const getCalendarEmbedUrl: RequestHandler<
  {},
  {
    events: {
      id: string | null | undefined;
      summary: string | null | undefined;
      description: string | null | undefined;
      start: calendar_v3.Schema$EventDateTime | undefined;
      end: calendar_v3.Schema$EventDateTime | undefined;
      hangoutLink: string | null | undefined;
      htmlLink: string | null | undefined;
    }[];
  }
> = async (req, res) => {
  try {
    const user = req.user!;

    if (!user.googleAccessToken) {
      throw new ResponseError(
        "Please connect Google Calendar first",
        status.BAD_REQUEST,
      );
    }

    // Set OAuth credentials
    calendarService.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    // Get events (next 3 months for example)
    const events = await calendarService.getUpcomingEvents({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    res.json({ events });
  } catch (error) {
    console.error("Get calendar events error:", error);
    throw new ResponseError(
      "Failed to fetch calendar events",
      status.INTERNAL_SERVER_ERROR,
    );
  }
};
