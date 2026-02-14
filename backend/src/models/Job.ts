import { and, eq, inArray, InferSelectModel } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";

import { user } from "./User";
import { db } from "../config/database";

export const jobStatusEnum = pgEnum("jobStatus", ["draft", "active", "closed"]);

// Job Schema
export const job = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  salaryRange: varchar("salary_range", { length: 100 }),
  jobType: varchar("job_type", { length: 50 }),
  deadline: timestamp("deadline", {
    mode: "date",
    withTimezone: true,
  }).notNull(),

  status: jobStatusEnum("status").notNull().default("draft"),
  hrId: integer("hr_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

// Job Schema Validators
export const addJobSchema = createInsertSchema(job, {
  id: (schema) => schema.transform(() => undefined),
  title: (schema) => schema.min(1).max(255),
  department: (schema) => schema.min(1).max(100),
  description: (schema) => schema.min(1),
  requirements: (schema) => schema.min(1),
  salaryRange: (schema) => schema.max(100).nullable(),
  jobType: (schema) => schema.max(50).nullable(),
  status: () => z.enum(["draft", "active", "closed"]),
  hrId: () => z.coerce.number().int().gt(0),
  createdAt: (schema) => schema.transform(() => undefined),
});

export const updateJobSchema = createUpdateSchema(job, {
  id: (schema) => schema.transform(() => undefined),
  title: (schema) => schema.min(1).max(255),
  department: (schema) => schema.min(1).max(100),
  description: (schema) => schema.min(1),
  requirements: (schema) => schema.min(1),
  salaryRange: (schema) => schema.max(100).nullable(),
  jobType: (schema) => schema.max(50).nullable(),
  status: () => z.enum(["draft", "active", "closed"]),
  hrId: () => z.coerce.number().int().gt(0),
  createdAt: (schema) => schema.transform(() => undefined),
});

export type Job = InferSelectModel<typeof job>;

export default class JobModel {
  // Get all jobs
  static getJobs = async (dbOrTx: DbOrTx = db) => {
    return await dbOrTx.select().from(job);
  };

  // Get all active/public jobs (for candidate job board)
  static getPublicJobs = async (dbOrTx: DbOrTx = db) => {
    return await dbOrTx.select().from(job).where(eq(job.status, "active"));
  };

  // Get job by id
  static getJobById = async (id: number, dbOrTx: DbOrTx = db) => {
    const jobs = await dbOrTx.select().from(job).where(eq(job.id, id)).limit(1);
    return jobs[0];
  };

  // Get jobs by HR id (for HR dashboard)
  static getJobsByHrId = async (hrId: number, dbOrTx: DbOrTx = db) => {
    return await dbOrTx.select().from(job).where(eq(job.hrId, hrId));
  };

  // Get jobs by status
  static getJobsByStatus = async (
    status: "draft" | "active" | "closed",
    dbOrTx: DbOrTx = db,
  ) => {
    return await dbOrTx.select().from(job).where(eq(job.status, status));
  };

  // Get jobs by HR id and status
  static getJobsByHrIdAndStatus = async (
    hrId: number,
    status: "draft" | "active" | "closed",
    dbOrTx: DbOrTx = db,
  ) => {
    return await dbOrTx
      .select()
      .from(job)
      .where(and(eq(job.hrId, hrId), eq(job.status, status)));
  };

  // Add a new job
  static addJob = async (jobData: InsertModel<Job>, dbOrTx: DbOrTx = db) => {
    const [newJob] = await dbOrTx.insert(job).values(jobData).returning();
    if (!newJob) return undefined;
    return newJob satisfies Job;
  };

  // Edit job
  static editJob = async (
    id: number,
    jobData: Partial<Job>,
    dbOrTx: DbOrTx = db,
  ) => {
    const [updatedJob] = await dbOrTx
      .update(job)
      .set(jobData)
      .where(eq(job.id, id))
      .returning();
    return updatedJob;
  };

  // Close job (set status to closed)
  static closeJob = async (id: number, dbOrTx: DbOrTx = db) => {
    const [closedJob] = await dbOrTx
      .update(job)
      .set({ status: "closed" })
      .where(eq(job.id, id))
      .returning();
    return closedJob;
  };

  // Delete job
  static deleteJob = async (id: number, dbOrTx: DbOrTx = db) => {
    const result = await dbOrTx.delete(job).where(eq(job.id, id));
    if (!result.rowCount) return undefined;
    return "Job has been deleted successfully";
  };

  // Bulk get jobs by ids
  static getJobsByIds = async (ids: number[], dbOrTx: DbOrTx = db) => {
    return dbOrTx.select().from(job).where(inArray(job.id, ids));
  };
}
