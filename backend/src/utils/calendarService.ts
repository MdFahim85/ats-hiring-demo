import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import env from "../config/env";

const oauth2Client = new OAuth2Client(
  env.googleClientId,
  env.googleClientSecret,
  env.googleDirectURI,
);

export class CalendarService {
  // Step 1: Generate OAuth URL (HR user clicks this to authorize)
  getAuthUrl(userId: string): string {
    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ];

    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state: userId,
    });
  }

  // Step 2: Exchange auth code for tokens
  async getTokensFromCode(code: string) {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error("Token exchange error:", error);
      throw new Error("Failed to exchange auth code for tokens");
    }
  }

  // Step 3: Set credentials on client
  setCredentials(tokens: any) {
    oauth2Client.setCredentials(tokens);
  }

  // Step 4: Create interview event with Google Meet link
  async createInterviewEvent({
    summary,
    description,
    startDateTime,
    durationMinutes,
    attendeeEmails,
    tokens,
  }: {
    summary: string;
    description: string;
    startDateTime: string;
    durationMinutes: number;
    attendeeEmails: string[];
    tokens: any;
  }) {
    try {
      // Set tokens for this request
      this.setCredentials(tokens);

      const calendar = google.calendar({
        version: "v3",
        auth: oauth2Client,
      });

      // Calculate end time
      const startDate = new Date(startDateTime);
      const endDate = new Date(
        startDate.getTime() + durationMinutes * 60 * 1000,
      );

      const event = {
        summary,
        description,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: "UTC",
        },
        attendees: attendeeEmails.map((email) => ({ email })),
        // This generates Google Meet link automatically
        conferenceData: {
          createRequest: {
            requestId: `interview-${Date.now()}`,
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 }, // 1 day before
            { method: "popup", minutes: 30 }, // 30 min before
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: 1, // Required for Meet link generation
        sendUpdates: "all", // Send email invites to attendees
        requestBody: event,
      });

      const createdEvent = response.data;

      return {
        eventId: createdEvent.id,
        meetLink: createdEvent.hangoutLink, // Google Meet link
        calendarLink: createdEvent.htmlLink, // Calendar event link
        startTime: createdEvent.start?.dateTime,
        endTime: createdEvent.end?.dateTime,
      };
    } catch (error) {
      console.error("Calendar event creation error:", error);
      throw new Error("Failed to create calendar event");
    }
  }

  // Step 5: Delete/cancel an event
  async deleteEvent(eventId: string, tokens: any) {
    try {
      this.setCredentials(tokens);

      const calendar = google.calendar({
        version: "v3",
        auth: oauth2Client,
      });

      await calendar.events.delete({
        calendarId: "primary",
        eventId,
        sendUpdates: "all", // Notify attendees of cancellation
      });

      return { success: true };
    } catch (error) {
      console.error("Calendar event deletion error:", error);
      throw new Error("Failed to delete calendar event");
    }
  }

  // Step 6: Update an existing event
  async updateEvent({
    eventId,
    startDateTime,
    durationMinutes,
    tokens,
  }: {
    eventId: string;
    startDateTime: string;
    durationMinutes: number;
    tokens: any;
  }) {
    try {
      this.setCredentials(tokens);

      const calendar = google.calendar({
        version: "v3",
        auth: oauth2Client,
      });

      const startDate = new Date(startDateTime);
      const endDate = new Date(
        startDate.getTime() + durationMinutes * 60 * 1000,
      );

      const response = await calendar.events.patch({
        calendarId: "primary",
        eventId,
        sendUpdates: "all",
        requestBody: {
          start: {
            dateTime: startDate.toISOString(),
            timeZone: "UTC",
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: "UTC",
          },
        },
      });

      return {
        eventId: response.data.id,
        meetLink: response.data.hangoutLink,
        startTime: response.data.start?.dateTime,
        endTime: response.data.end?.dateTime,
      };
    } catch (error) {
      console.error("Calendar event update error:", error);
      throw new Error("Failed to update calendar event");
    }
  }

  async getPrimaryCalendarId(): Promise<string> {
    try {
      const calendar = google.calendar({
        version: "v3",
        auth: oauth2Client,
      });

      const response = await calendar.calendars.get({
        calendarId: "primary",
      });

      return response.data.id || "primary";
    } catch (error) {
      console.error("Get calendar ID error:", error);
      return "primary";
    }
  }
  async getUpcomingEvents(tokens: any) {
    try {
      // Set credentials for this request
      this.setCredentials(tokens);

      const calendar = google.calendar({
        version: "v3",
        auth: oauth2Client,
      });

      const now = new Date();
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(now.getMonth() + 3);

      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: now.toISOString(),
        timeMax: threeMonthsLater.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 100,
      });

      return (response.data.items || []).map((event) => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        hangoutLink: event.hangoutLink,
        htmlLink: event.htmlLink,
      }));
    } catch (error) {
      console.error("Get upcoming events error:", error);
      throw new Error("Failed to fetch calendar events");
    }
  }
}

export const calendarService = new CalendarService();
