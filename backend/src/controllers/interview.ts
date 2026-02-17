import { RequestHandler } from "express";
import status from "http-status";

import InterviewModel, {
  addInterviewSchema,
  updateInterviewSchema,
  Interview,
} from "../models/Interview";
import NotificationModel from "../models/Notification";
import ApplicationModel from "../models/Application";
import JobModel from "../models/Job";
import ROUTEMAP from "../routes/ROUTEMAP";
import ResponseError from "../utils/ResponseError";
import { idValidator } from "../utils/validators";
import { calendarService } from "../utils/calendarService";
import UserModel from "../models/User";

// Get all interviews (admin only)
export const getAllInterviews: RequestHandler<{}, Interview[]> = async (
  _,
  res,
) => {
  const interviews = await InterviewModel.getInterviews();
  res.json(interviews);
};

// Get interview by id
export const getInterviewById: RequestHandler<
  Partial<typeof ROUTEMAP.interviews._params>,
  Interview
> = async (req, res) => {
  const { id } = await idValidator.parseAsync({ id: req.params.id });

  const interview = await InterviewModel.getInterviewById(id);
  if (!interview)
    throw new ResponseError("Interview not found", status.NOT_FOUND);

  res.json(interview);
};

// Get all interviews for a specific job (HR interview calendar)
export const getInterviewsByJobId: RequestHandler<
  Partial<typeof ROUTEMAP.interviews._params>,
  Interview[]
> = async (req, res) => {
  const { id: jobId } = await idValidator.parseAsync({ id: req.params.jobId });

  const interviews = await InterviewModel.getInterviewsByJobId(jobId);
  res.json(interviews);
};

// Get all interviews for a candidate
export const getInterviewsByCandidateId: RequestHandler<
  Partial<typeof ROUTEMAP.interviews._params>,
  Interview[]
> = async (req, res) => {
  const { id: candidateId } = await idValidator.parseAsync({
    id: req.params.candidateId,
  });

  const interviews =
    await InterviewModel.getInterviewsByCandidateId(candidateId);
  res.json(interviews);
};

// Get interview by application id
export const getInterviewByApplicationId: RequestHandler<
  Partial<typeof ROUTEMAP.interviews._params>,
  Interview
> = async (req, res) => {
  const { id: applicationId } = await idValidator.parseAsync({
    id: req.params.applicationId,
  });

  const interview =
    await InterviewModel.getInterviewByApplicationId(applicationId);
  if (!interview)
    throw new ResponseError("Interview not found", status.NOT_FOUND);

  res.json(interview);
};

// Create single interview
export const createInterview: RequestHandler<
  {},
  { message: string; data: Interview },
  Partial<Interview>
> = async (req, res) => {
  const user = req.user;

  if (!user)
    throw new ResponseError("You are not logged in", status.BAD_REQUEST);

  const interviewBody = req.body;
  interviewBody.interviewerId = user.id;
  interviewBody.status = "scheduled";
  interviewBody.createdAt = new Date();

  const interviewData = await addInterviewSchema.parseAsync(interviewBody);

  // Check if application exists
  const application = await ApplicationModel.getApplicationById(
    interviewData.applicationId,
  );
  if (!application)
    throw new ResponseError("Application not found", status.NOT_FOUND);

  // Get job details
  const job = await JobModel.getJobById(interviewData.jobId);

  // Get candidate details
  const candidate = await UserModel.getUserById(interviewData.candidateId);

  // Create interview
  const result = await InterviewModel.addInterview(interviewData);
  if (!result) {
    throw new ResponseError("Failed to create interview", status.BAD_REQUEST);
  }

  // Update application status to interview
  await ApplicationModel.updateApplicationStatus(
    interviewData.applicationId,
    "interview",
  );

  // Try to create Google Calendar event (don't fail if this fails)

  if (
    user.googleAccessToken &&
    user.googleRefreshToken &&
    interviewData.type === "virtual"
  ) {
    const tokens = {
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    };

    const event = await calendarService.createInterviewEvent({
      summary: `Interview: ${job?.title} - ${candidate?.name}`,
      description: `
Interview Details:
- Position: ${job?.title}
- Department: ${job?.department}
- Candidate: ${candidate?.name} (${candidate?.email})
- Interviewer: ${user.name} (${user.email})
- Duration: ${interviewData.duration} minutes
        `.trim(),
      startDateTime: interviewData.interviewDate.toISOString(),
      durationMinutes: interviewData.duration || 60,
      attendeeEmails: [candidate?.email!, user.email],
      tokens,
    });

    // Update interview with meet link and calendar event ID
    await InterviewModel.editInterview(result.id, {
      meetingLink: event.meetLink!,
      calendarEventId: event.eventId!,
    });

    // Update result with meet link
    result.meetingLink = event.meetLink!;
  } else if (!user.googleAccessToken) {
    console.log("HR has not connected Google Calendar - skipping");
  }

  // Try to create notification (don't fail if this fails)
  try {
    await NotificationModel.addNotification({
      userId: interviewData.candidateId,
      type: "interview_scheduled",
      title: "Interview Scheduled",
      message: `Your interview for ${job?.title} has been scheduled`,
      relatedEntityType: "interview",
      relatedEntityId: result.id,
      isRead: false,
      emailSent: false,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }

  res.status(201).json({
    message: "Interview scheduled successfully",
    data: result,
  });
};

// Bulk schedule interviews
export const bulkScheduleInterviews: RequestHandler<
  {},
  { message: string; data: Interview[] },
  { interviews: Partial<Interview>[] }
> = async (req, res) => {
  const user = req.user;

  if (!user)
    throw new ResponseError("You are not logged in", status.BAD_REQUEST);

  const { interviews: interviewsData } = req.body;

  if (!interviewsData || !interviewsData.length) {
    throw new ResponseError("No interviews provided", status.BAD_REQUEST);
  }

  // Prepare interview data
  const interviewsToCreate = interviewsData.map((interview) => ({
    ...interview,
    interviewerId: user.id,
    status: "scheduled" as const,
    interviewDate: new Date(interview.interviewDate!),
    createdAt: new Date(),
  }));

  // Validate all interviews
  const validatedInterviews = await Promise.all(
    interviewsToCreate.map((interview) =>
      addInterviewSchema.parseAsync(interview),
    ),
  );

  // Create interviews
  const result = await InterviewModel.bulkAddInterviews(validatedInterviews);
  if (!result || result.length === 0) {
    throw new ResponseError(
      "Failed to schedule interviews",
      status.BAD_REQUEST,
    );
  }

  // Update application statuses to interview
  const applicationIds = validatedInterviews.map((i) => i.applicationId);
  await ApplicationModel.bulkUpdateApplicationsStatus(
    applicationIds,
    "interview",
  );

  // Try to create Google Calendar events for virtual interviews
  if (user.googleAccessToken && user.googleRefreshToken) {
    const tokens = {
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    };

    await Promise.all(
      result.map(async (interview) => {
        try {
          // Only create calendar event for virtual interviews
          if (interview.type !== "virtual") return;

          const candidate = await UserModel.getUserById(interview.candidateId);
          const job = await JobModel.getJobById(interview.jobId);

          const event = await calendarService.createInterviewEvent({
            summary: `Interview: ${job?.title} - ${candidate?.name}`,
            description: `
Interview Details:
- Position: ${job?.title}
- Department: ${job?.department}
- Candidate: ${candidate?.name} (${candidate?.email})
- Interviewer: ${user.name} (${user.email})
- Duration: ${interview.duration} minutes
              `.trim(),
            startDateTime: interview.interviewDate.toISOString(),
            durationMinutes: interview.duration || 60,
            attendeeEmails: [candidate?.email!, user.email],
            tokens,
          });

          // Update interview with meet link and calendar event ID
          await InterviewModel.editInterview(interview.id, {
            meetingLink: event.meetLink!,
            calendarEventId: event.eventId!,
          });

          // Update result with meet link
          interview.meetingLink = event.meetLink!;

          console.log(
            `Calendar event created for interview ${interview.id}: ${event.eventId}`,
          );
        } catch (error) {
          console.error(
            `Failed to create calendar event for interview ${interview.id}:`,
            error,
          );
          // Don't throw - continue with other interviews
        }
      }),
    );
  } else {
    console.log("HR has not connected Google Calendar - skipping");
  }

  // Try to create notifications
  try {
    for (const interview of result) {
      const job = await JobModel.getJobById(interview.jobId);

      await NotificationModel.addNotification({
        userId: interview.candidateId,
        type: "interview_scheduled",
        title: "Interview Scheduled",
        message: `Your interview for ${job?.title} has been scheduled`,
        relatedEntityType: "interview",
        relatedEntityId: interview.id,
        isRead: false,
        emailSent: false,
      });
    }
  } catch (error) {
    console.error("Failed to create notifications:", error);
  }

  res.status(201).json({
    message: "Interviews scheduled successfully",
    data: result,
  });
};

// Update interview
export const updateInterview: RequestHandler<
  Partial<typeof ROUTEMAP.interviews._params>,
  { message: string; data: Interview },
  Partial<Interview>
> = async (req, res) => {
  const user = req.user;

  if (!user)
    throw new ResponseError("You are not logged in", status.BAD_REQUEST);

  const { id } = await idValidator.parseAsync({ id: req.params.id });

  const interviewBody = req.body;
  interviewBody.interviewDate = new Date(interviewBody.interviewDate!);
  interviewBody.createdAt = new Date();

  const dbInterview = await InterviewModel.getInterviewById(id);
  if (!dbInterview)
    throw new ResponseError("Interview not found", status.NOT_FOUND);

  const interviewData = await updateInterviewSchema.parseAsync(interviewBody);
  const result = await InterviewModel.editInterview(id, interviewData);
  if (!result) {
    throw new ResponseError("Failed to update interview", status.BAD_REQUEST);
  }

  // Try to update Google Calendar event
  if (
    user.googleAccessToken &&
    user.googleRefreshToken &&
    dbInterview.calendarEventId
  ) {
    const tokens = {
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    };

    await calendarService.updateEvent({
      eventId: dbInterview.calendarEventId,
      startDateTime: interviewData.interviewDate!.toISOString(),
      durationMinutes: interviewData.duration || 60,
      tokens,
    });

    console.log(`Calendar event updated: ${dbInterview.calendarEventId}`);
  }

  // Try to create notification
  try {
    const job = await JobModel.getJobById(dbInterview.jobId);

    await NotificationModel.addNotification({
      userId: dbInterview.candidateId,
      type: "interview_updated",
      title: "Interview Updated",
      message: `Your interview for ${job?.title} has been updated`,
      relatedEntityType: "interview",
      relatedEntityId: result.id,
      isRead: false,
      emailSent: false,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }

  res.json({
    message: "Interview updated successfully",
    data: result,
  });
};

// Update interview status
export const updateInterviewStatus: RequestHandler<
  Partial<typeof ROUTEMAP.interviews._params>,
  { message: string; data: Interview },
  { status: Interview["status"] }
> = async (req, res) => {
  const { id } = await idValidator.parseAsync({ id: req.params.id });
  const { status: newStatus } = req.body;

  const dbInterview = await InterviewModel.getInterviewById(id);
  if (!dbInterview)
    throw new ResponseError("Interview not found", status.NOT_FOUND);

  const result = await InterviewModel.updateInterviewStatus(id, newStatus);

  if (!result) {
    throw new ResponseError(
      "Failed to update interview status",
      status.BAD_REQUEST,
    );
  }

  res.json({
    message: "Interview status updated successfully",
    data: result,
  });
};

// Add preparation notes
export const addPreparationNotes: RequestHandler<
  Partial<typeof ROUTEMAP.interviews._params>,
  { message: string; data: Interview },
  { preparationNotes: string }
> = async (req, res) => {
  const { id } = await idValidator.parseAsync({ id: req.params.id });
  const { preparationNotes } = req.body;

  const dbInterview = await InterviewModel.getInterviewById(id);
  if (!dbInterview)
    throw new ResponseError("Interview not found", status.NOT_FOUND);

  const result = await InterviewModel.addPreparationNotes(id, preparationNotes);

  if (!result) {
    throw new ResponseError(
      "Failed to add preparation notes",
      status.BAD_REQUEST,
    );
  }

  res.json({
    message: "Preparation notes added successfully",
    data: result,
  });
};

// Add feedback
export const addFeedback: RequestHandler<
  Partial<typeof ROUTEMAP.interviews._params>,
  { message: string; data: Interview },
  {
    feedback: string;
    rating?: number;
    result?: "pending" | "passed" | "failed";
  }
> = async (req, res) => {
  const { id } = await idValidator.parseAsync({ id: req.params.id });
  const { feedback, rating, result: interviewResult } = req.body;

  const dbInterview = await InterviewModel.getInterviewById(id);
  if (!dbInterview)
    throw new ResponseError("Interview not found", status.NOT_FOUND);

  const result = await InterviewModel.addFeedback(id, {
    feedback,
    rating,
    result: interviewResult,
  });

  if (!result) {
    throw new ResponseError("Failed to add feedback", status.BAD_REQUEST);
  }

  // Update interview status to completed if result is provided
  if (interviewResult && interviewResult !== "pending") {
    await InterviewModel.updateInterviewStatus(id, "completed");
  }

  res.json({
    message: "Feedback added successfully",
    data: result,
  });
};

// Delete interview
export const deleteInterview: RequestHandler<
  Partial<typeof ROUTEMAP.interviews._params>,
  { message: string }
> = async (req, res) => {
  const user = req.user;

  if (!user)
    throw new ResponseError("You are not logged in", status.BAD_REQUEST);

  const { id } = await idValidator.parseAsync({ id: req.params.id });

  const dbInterview = await InterviewModel.getInterviewById(id);
  if (!dbInterview)
    throw new ResponseError("Interview not found", status.NOT_FOUND);

  if (
    user.googleAccessToken &&
    user.googleRefreshToken &&
    dbInterview.calendarEventId
  ) {
    const tokens = {
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    };

    await calendarService.deleteEvent(dbInterview.calendarEventId, tokens);
    console.log(`Calendar event deleted: ${dbInterview.calendarEventId}`);
  }

  const result = await InterviewModel.deleteInterview(id);
  if (!result) {
    throw new ResponseError("Failed to delete interview", status.BAD_REQUEST);
  }

  res.json({ message: result });
};
