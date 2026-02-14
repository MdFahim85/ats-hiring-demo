import { RequestHandler } from "express";
import status from "http-status";

import { db } from "../config/database";
import JobModel, { addJobSchema, updateJobSchema, Job } from "../models/Job";
import ROUTEMAP from "../routes/ROUTEMAP";
import ResponseError from "../utils/ResponseError";
import { idValidator } from "../utils/validators";

// Get all jobs (for admin or HR to see their own jobs)
export const getAllJobs: RequestHandler<{}, Job[]> = async (req, res) => {
  res.json(await JobModel.getJobs());
};

// Get all public/active jobs (for candidates)
export const getPublicJobs: RequestHandler<{}, Job[]> = async (_, res) => {
  const jobs = await JobModel.getPublicJobs();
  res.json(jobs);
};

// Get job by id
export const getJobById: RequestHandler<
  Partial<typeof ROUTEMAP.jobs._params>,
  Job
> = async (req, res) => {
  const { id } = await idValidator.parseAsync(req.params);

  const job = await JobModel.getJobById(id);
  if (!job) throw new ResponseError("Job not found", status.NOT_FOUND);

  res.json(job);
};

// Get public job by id (for candidates viewing job details)
export const getPublicJobById: RequestHandler<
  Partial<typeof ROUTEMAP.jobs._params>,
  Job
> = async (req, res) => {
  const { id } = await idValidator.parseAsync(req.params);

  const job = await JobModel.getJobById(id);
  if (!job) throw new ResponseError("Job not found", status.NOT_FOUND);

  // Only return if job is active
  if (job.status !== "active") {
    throw new ResponseError("Job is not available", status.NOT_FOUND);
  }

  res.json(job);
};

// Get jobs by HR id
export const getJobsByHrId: RequestHandler<
  Partial<typeof ROUTEMAP.jobs._params>,
  Job[]
> = async (req, res) => {
  const { id: hrId } = await idValidator.parseAsync(req.params);

  const jobs = await JobModel.getJobsByHrId(hrId);
  res.json(jobs);
};

// Create new job
export const createJob: RequestHandler<
  {},
  { message: string; data: Job },
  Partial<Job>
> = async (req, res) => {
  const user = req.user;

  if (!user)
    throw new ResponseError("You are not logged in", status.BAD_REQUEST);

  const jobBody = req.body;
  jobBody.hrId = user.id;
  jobBody.createdAt = new Date();

  const jobData = await addJobSchema.parseAsync(jobBody);

  const job = await db.transaction(async (tx) => {
    const result = await JobModel.addJob(jobData, tx);

    if (!result) {
      tx.rollback();
      throw new ResponseError("Failed to create job", status.BAD_REQUEST);
    }

    return result;
  });

  res.status(201).json({
    message: "Job has been created successfully",
    data: job,
  });
};

// Update job
export const updateJob: RequestHandler<
  Partial<typeof ROUTEMAP.jobs._params>,
  { message: string; data: Job },
  Partial<Job>
> = async (req, res) => {
  const { id } = await idValidator.parseAsync(req.params);
  const user = req.user;

  if (!user)
    throw new ResponseError("You are not logged in", status.BAD_REQUEST);

  const jobBody = req.body;
  jobBody.createdAt = new Date();

  const job = await db.transaction(async (tx) => {
    const dbJob = await JobModel.getJobById(id, tx);
    if (!dbJob) throw new ResponseError("Job not found", status.NOT_FOUND);

    // Check if user is the HR who created this job or admin
    if (dbJob.hrId !== user.id) {
      throw new ResponseError(
        "You can only edit your own jobs",
        status.FORBIDDEN,
      );
    }

    const jobData = await updateJobSchema.parseAsync(jobBody);
    const result = await JobModel.editJob(id, jobData, tx);

    if (!result) {
      tx.rollback();
      throw new ResponseError("Failed to update job", status.BAD_REQUEST);
    }

    return result;
  });

  res.json({
    message: "Job has been updated successfully",
    data: job,
  });
};

// Close job
export const closeJob: RequestHandler<
  Partial<typeof ROUTEMAP.jobs._params>,
  { message: string; data: Job }
> = async (req, res) => {
  const { id } = await idValidator.parseAsync(req.params);
  const user = req.user;

  if (!user)
    throw new ResponseError("You are not logged in", status.BAD_REQUEST);

  const job = await db.transaction(async (tx) => {
    const dbJob = await JobModel.getJobById(id, tx);
    if (!dbJob) throw new ResponseError("Job not found", status.NOT_FOUND);

    // Check if user is the HR who created this job or admin
    if (dbJob.hrId !== user.id) {
      throw new ResponseError(
        "You can only close your own jobs",
        status.FORBIDDEN,
      );
    }

    const result = await JobModel.closeJob(id, tx);

    if (!result) {
      tx.rollback();
      throw new ResponseError("Failed to close job", status.BAD_REQUEST);
    }

    return result;
  });

  res.json({
    message: "Job has been closed successfully",
    data: job,
  });
};

// Delete job
export const deleteJob: RequestHandler<
  Partial<typeof ROUTEMAP.jobs._params>,
  { message: string }
> = async (req, res) => {
  const { id } = await idValidator.parseAsync(req.params);
  const user = req.user;

  if (!user)
    throw new ResponseError("You are not logged in", status.BAD_REQUEST);

  const dbJob = await JobModel.getJobById(id);
  if (!dbJob) throw new ResponseError("Job not found", status.NOT_FOUND);

  // Check if user is the HR who created this job or admin
  if (dbJob.hrId !== user.id) {
    throw new ResponseError(
      "You can only delete your own jobs",
      status.FORBIDDEN,
    );
  }

  const result = await JobModel.deleteJob(id);
  if (!result) {
    throw new ResponseError("Failed to delete job", status.BAD_REQUEST);
  }

  res.json({ message: result });
};
