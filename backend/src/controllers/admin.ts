import { RequestHandler } from "express";
import status from "http-status";

import { db } from "../config/database";
import UserModel, {
  addUserSchema,
  updateUserSchema,
  User,
} from "../models/User";
import JobModel from "../models/Job";
import ApplicationModel from "../models/Application";
import ROUTEMAP from "../routes/ROUTEMAP";
import ResponseError from "../utils/ResponseError";
import { idValidator } from "../utils/validators";
import { passwordHash } from "../utils";

// Get dashboard metrics
export const getDashboardMetrics: RequestHandler<
  {},
  {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    totalHires: number;
    activeHRUsers: number;
    totalCandidates: number;
  }
> = async (_, res) => {
  const jobs = await JobModel.getJobs();
  const applications = await ApplicationModel.getApplications();
  const users = await UserModel.getUsers();

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === "active").length;
  const totalApplications = applications.length;
  const totalHires = applications.filter((a) => a.status === "hired").length;
  const hrUsers = users.filter((u) => u.role === "hr");
  const activeHRUsers = hrUsers.filter((hr) => hr.status === "active").length;
  const totalCandidates = users.filter((u) => u.role === "candidate").length;

  res.json({
    totalJobs,
    activeJobs,
    totalApplications,
    totalHires,
    activeHRUsers,
    totalCandidates,
  });
};

// Get all HR users
export const getHrUsers: RequestHandler<{}, User[]> = async (_, res) => {
  const allUsers = await UserModel.getAllUsers();
  const hrUsers = allUsers.filter((u) => u.role === "hr");
  res.json(hrUsers);
};

// Get HR user by id
export const getHrById: RequestHandler<
  Partial<typeof ROUTEMAP.admin._params>,
  User
> = async (req, res) => {
  const { id: hrId } = await idValidator.parseAsync(req.params);

  const hrUser = await UserModel.getUserById(hrId);
  if (!hrUser) throw new ResponseError("HR user not found", status.NOT_FOUND);

  if (hrUser.role !== "hr") {
    throw new ResponseError("User is not an HR", status.BAD_REQUEST);
  }

  res.json(hrUser);
};

// Create HR user (Admin only)
export const createHr: RequestHandler<
  {},
  { message: string; data: User },
  Partial<User>
> = async (req, res) => {
  const hrData = req.body;
  hrData.role = "hr";
  hrData.status = "active";
  hrData.createdAt = new Date();

  const userData = await addUserSchema.parseAsync(hrData);

  // Hash password
  const hashedPassword = await passwordHash(userData.password!);
  userData.password = hashedPassword;

  const hr = await db.transaction(async (tx) => {
    const result = await UserModel.addUser(userData, tx);

    if (!result) {
      tx.rollback();
      throw new ResponseError("Failed to create HR user", status.BAD_REQUEST);
    }

    return result;
  });

  res.status(201).json({
    message: "HR user created successfully",
    data: hr,
  });
};

// Update HR user
export const updateHr: RequestHandler<
  Partial<typeof ROUTEMAP.admin._params>,
  { message: string; data: User },
  Partial<User>
> = async (req, res) => {
  const { id: hrId } = await idValidator.parseAsync(req.params);

  const hrData = req.body;
  hrData.createdAt = new Date();

  const hr = await db.transaction(async (tx) => {
    const dbHr = await UserModel.getUserById(hrId, tx);
    if (!dbHr) throw new ResponseError("HR user not found", status.NOT_FOUND);

    if (dbHr.role !== "hr") {
      throw new ResponseError("User is not an HR", status.BAD_REQUEST);
    }

    const userData = await updateUserSchema.parseAsync(hrData);
    const result = await UserModel.editUser(hrId, userData, tx);

    if (!result) {
      tx.rollback();
      throw new ResponseError("Failed to update HR user", status.BAD_REQUEST);
    }

    return result;
  });

  res.json({
    message: "HR user updated successfully",
    data: hr,
  });
};

// Delete HR user
export const deleteHr: RequestHandler<
  Partial<typeof ROUTEMAP.admin._params>,
  { message: string }
> = async (req, res) => {
  const { id: hrId } = await idValidator.parseAsync(req.params);

  const dbHr = await UserModel.getUserById(hrId);
  if (!dbHr) throw new ResponseError("HR user not found", status.NOT_FOUND);

  if (dbHr.role !== "hr") {
    throw new ResponseError("User is not an HR", status.BAD_REQUEST);
  }

  const result = await UserModel.deleteUser(hrId);
  if (!result) {
    throw new ResponseError("Failed to delete HR user", status.BAD_REQUEST);
  }

  res.json({ message: result });
};

// Get all jobs (admin view)
export const getAllJobs: RequestHandler<{}, any[]> = async (_, res) => {
  const jobs = await JobModel.getJobs();
  res.json(jobs);
};

// Get all candidates (admin view)
export const getAllCandidates: RequestHandler<{}, User[]> = async (_, res) => {
  const allUsers = await UserModel.getAllUsers();
  const candidates = allUsers.filter((u) => u.role === "candidate");
  res.json(candidates);
};
