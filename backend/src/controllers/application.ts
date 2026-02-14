import { RequestHandler } from "express";
import status from "http-status";

import { db } from "../config/database";
import ApplicationModel, {
  addApplicationSchema,
  updateApplicationSchema,
  Application,
} from "../models/Application";
import NotificationModel from "../models/Notification";
import JobModel from "../models/Job";
import ROUTEMAP from "../routes/ROUTEMAP";
import ResponseError from "../utils/ResponseError";
import { idValidator } from "../utils/validators";

// Get all applications (admin only)
export const getAllApplications: RequestHandler<{}, Application[]> = async (
  _,
  res,
) => {
  const applications = await ApplicationModel.getApplications();
  res.json(applications);
};

// Get application by id
export const getApplicationById: RequestHandler<
  Partial<typeof ROUTEMAP.applications._params>,
  Application
> = async (req, res) => {
  const { id } = await idValidator.parseAsync(req.params);

  const application = await ApplicationModel.getApplicationById(id);
  if (!application)
    throw new ResponseError("Application not found", status.NOT_FOUND);

  res.json(application);
};

// Get all applications for a specific job (HR views applicants)
export const getApplicationsByJobId: RequestHandler<
  Partial<typeof ROUTEMAP.applications._params>,
  Application[]
> = async (req, res) => {
  const { id: jobId } = await idValidator.parseAsync(req.params);

  const applications = await ApplicationModel.getApplicationsByJobId(jobId);
  res.json(applications);
};

// Get all applications by a candidate (candidate dashboard)
export const getApplicationsByCandidateId: RequestHandler<
  Partial<typeof ROUTEMAP.applications._params>,
  Application[]
> = async (req, res) => {
  const { id: candidateId } = await idValidator.parseAsync(req.params);

  const applications =
    await ApplicationModel.getApplicationsByCandidateId(candidateId);
  res.json(applications);
};

// Create new application (candidate applies to job)
export const createApplication: RequestHandler<
  {},
  { message: string; data: Application },
  Partial<Application>
> = async (req, res) => {
  const user = req.user;

  if (!user)
    throw new ResponseError("You are not logged in", status.BAD_REQUEST);

  const applicationBody = req.body;
  applicationBody.candidateId = user.id;
  applicationBody.status = "applied";
  applicationBody.appliedAt = new Date();

  const applicationData =
    await addApplicationSchema.parseAsync(applicationBody);

  // Check if candidate already applied to this job
  const existingApplication =
    await ApplicationModel.getApplicationByJobAndCandidate(
      applicationData.jobId,
      applicationData.candidateId,
    );

  if (existingApplication) {
    throw new ResponseError(
      "You have already applied to this job",
      status.CONFLICT,
    );
  }

  // Check if job exists and is active
  const job = await JobModel.getJobById(applicationData.jobId);
  if (!job) throw new ResponseError("Job not found", status.NOT_FOUND);
  if (job.status !== "active") {
    throw new ResponseError("This job is no longer active", status.BAD_REQUEST);
  }

  // Create application
  const result = await ApplicationModel.addApplication(applicationData);

  if (!result) {
    throw new ResponseError("Failed to create application", status.BAD_REQUEST);
  }

  // Try to create notification (don't fail if this fails)
  try {
    await NotificationModel.addNotification({
      userId: job.hrId,
      type: "application_received",
      title: "New Application Received",
      message: `${user.name} has applied for ${job.title}`,
      relatedEntityType: "application",
      relatedEntityId: result.id,
      isRead: false,
      emailSent: false,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }

  res.status(201).json({
    message: "Application submitted successfully",
    data: result,
  });
};

// Update application status (HR changes status)
export const updateApplicationStatus: RequestHandler<
  Partial<typeof ROUTEMAP.applications._params>,
  { message: string; data: Application },
  { status: Application["status"] }
> = async (req, res) => {
  const { id } = await idValidator.parseAsync(req.params);
  const { status: newStatus } = req.body;

  const dbApplication = await ApplicationModel.getApplicationById(id);
  if (!dbApplication)
    throw new ResponseError("Application not found", status.NOT_FOUND);

  // Get job details for notification
  const job = await JobModel.getJobById(dbApplication.jobId);

  // Update application status
  const result = await ApplicationModel.updateApplicationStatus(id, newStatus);

  if (!result) {
    throw new ResponseError(
      "Failed to update application status",
      status.BAD_REQUEST,
    );
  }

  // Create notification for candidate (don't fail if this fails)
  try {
    let notificationMessage = "";
    let notificationTitle = "";

    switch (newStatus) {
      case "shortlisted":
        notificationTitle = "Application Shortlisted";
        notificationMessage = `Your application for ${job?.title} has been shortlisted`;
        break;
      case "interview":
        notificationTitle = "Interview Scheduled";
        notificationMessage = `Interview scheduled for ${job?.title}`;
        break;
      case "rejected":
        notificationTitle = "Application Update";
        notificationMessage = `Your application for ${job?.title} has been updated`;
        break;
      case "hired":
        notificationTitle = "Congratulations!";
        notificationMessage = `You have been selected for ${job?.title}`;
        break;
    }

    await NotificationModel.addNotification({
      userId: dbApplication.candidateId,
      type: "application_status_updated",
      title: notificationTitle,
      message: notificationMessage,
      relatedEntityType: "application",
      relatedEntityId: result.id,
      isRead: false,
      emailSent: false,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }

  // If hired, auto-reject other candidates and close job
  if (newStatus === "hired") {
    const otherApplications =
      await ApplicationModel.getApplicationsByJobIdExcluding(
        dbApplication.jobId,
        id,
      );

    const otherApplicationIds = otherApplications.map((app) => app.id);

    if (otherApplicationIds.length > 0) {
      await ApplicationModel.bulkUpdateApplicationsStatus(
        otherApplicationIds,
        "rejected",
      );

      // Notify rejected candidates (don't fail if this fails)
      try {
        for (const app of otherApplications) {
          await NotificationModel.addNotification({
            userId: app.candidateId,
            type: "application_status_updated",
            title: "Application Update",
            message: `Your application for ${job?.title} has been updated`,
            relatedEntityType: "application",
            relatedEntityId: app.id,
            isRead: false,
            emailSent: false,
          });
        }
      } catch (error) {
        console.error(
          "Failed to create notifications for rejected candidates:",
          error,
        );
      }
    }

    // Close the job
    await JobModel.closeJob(dbApplication.jobId);
  }

  res.json({
    message: "Application status updated successfully",
    data: result,
  });
};

// Add notes to application (HR adds internal notes)
export const addApplicationNotes: RequestHandler<
  Partial<typeof ROUTEMAP.applications._params>,
  { message: string; data: Application },
  { notes: string }
> = async (req, res) => {
  const { id } = await idValidator.parseAsync(req.params);
  const { notes } = req.body;

  const dbApplication = await ApplicationModel.getApplicationById(id);
  if (!dbApplication)
    throw new ResponseError("Application not found", status.NOT_FOUND);

  const result = await ApplicationModel.addApplicationNotes(id, notes);

  if (!result) {
    throw new ResponseError("Failed to add notes", status.BAD_REQUEST);
  }

  res.json({
    message: "Notes added successfully",
    data: result,
  });
};

// Delete application
export const deleteApplication: RequestHandler<
  Partial<typeof ROUTEMAP.applications._params>,
  { message: string }
> = async (req, res) => {
  const { id } = await idValidator.parseAsync(req.params);

  const dbApplication = await ApplicationModel.getApplicationById(id);
  if (!dbApplication)
    throw new ResponseError("Application not found", status.NOT_FOUND);

  const result = await ApplicationModel.deleteApplication(id);
  if (!result) {
    throw new ResponseError("Failed to delete application", status.BAD_REQUEST);
  }

  res.json({ message: result });
};
