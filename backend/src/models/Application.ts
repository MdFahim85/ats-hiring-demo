import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";

import { job } from "./Job";
import { user } from "./User";
import { and, eq, inArray, InferSelectModel, ne } from "drizzle-orm";
import { db } from "../config/database";

export const applicationStatusEnum = pgEnum("applicationStatus", [
  "applied",
  "shortlisted",
  "interview",
  "rejected",
  "hired",
]);

// Application Schema
export const application = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    jobId: integer("job_id")
      .notNull()
      .references(() => job.id, { onDelete: "cascade" }),
    candidateId: integer("candidate_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: applicationStatusEnum("status").notNull().default("applied"),
    coverLetter: text("cover_letter"),
    notes: text("notes"),
    appliedAt: timestamp("applied_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueJobCandidate: unique().on(table.jobId, table.candidateId),
  }),
);

export const addApplicationSchema = createInsertSchema(application, {
  id: (schema) => schema.transform(() => undefined),
  jobId: () => z.coerce.number().int().gt(0),
  candidateId: () => z.coerce.number().int().gt(0),
  status: () =>
    z.enum(["applied", "shortlisted", "interview", "rejected", "hired"]),
  coverLetter: (schema) => schema.nullable(),
  notes: (schema) => schema.nullable(),
  appliedAt: (schema) => schema,
});

export const updateApplicationSchema = createUpdateSchema(application, {
  id: (schema) => schema.transform(() => undefined),
  jobId: () => z.coerce.number().int().gt(0),
  candidateId: () => z.coerce.number().int().gt(0),
  status: () =>
    z.enum(["applied", "shortlisted", "interview", "rejected", "hired"]),
  coverLetter: (schema) => schema.nullable(),
  notes: (schema) => schema.nullable(),
  appliedAt: (schema) => schema,
});

export type Application = InferSelectModel<typeof application>;

export default class ApplicationModel {
  // Get all applications
  static getApplications = async (dbOrTx: DbOrTx = db) => {
    return await dbOrTx.select().from(application);
  };

  // Get application by id
  static getApplicationById = async (id: number, dbOrTx: DbOrTx = db) => {
    const applications = await dbOrTx
      .select()
      .from(application)
      .where(eq(application.id, id))
      .limit(1);
    return applications[0];
  };

  // Get all applications for a specific job
  static getApplicationsByJobId = async (
    jobId: number,
    dbOrTx: DbOrTx = db,
  ) => {
    return await dbOrTx
      .select()
      .from(application)
      .where(eq(application.jobId, jobId));
  };

  // Get all applications by a specific candidate
  static getApplicationsByCandidateId = async (
    candidateId: number,
    dbOrTx: DbOrTx = db,
  ) => {
    return await dbOrTx
      .select()
      .from(application)
      .where(eq(application.candidateId, candidateId));
  };

  // Get applications by status
  static getApplicationsByStatus = async (
    status: "applied" | "shortlisted" | "interview" | "rejected" | "hired",
    dbOrTx: DbOrTx = db,
  ) => {
    return await dbOrTx
      .select()
      .from(application)
      .where(eq(application.status, status));
  };

  // Get applications by job id and status (for HR filtering)
  static getApplicationsByJobIdAndStatus = async (
    jobId: number,
    status: "applied" | "shortlisted" | "interview" | "rejected" | "hired",
    dbOrTx: DbOrTx = db,
  ) => {
    return await dbOrTx
      .select()
      .from(application)
      .where(and(eq(application.jobId, jobId), eq(application.status, status)));
  };

  // Check if candidate already applied to a job
  static getApplicationByJobAndCandidate = async (
    jobId: number,
    candidateId: number,
    dbOrTx: DbOrTx = db,
  ) => {
    const applications = await dbOrTx
      .select()
      .from(application)
      .where(
        and(
          eq(application.jobId, jobId),
          eq(application.candidateId, candidateId),
        ),
      )
      .limit(1);
    return applications[0];
  };

  // Add a new application
  static addApplication = async (
    applicationData: InsertModel<Application>,
    dbOrTx: DbOrTx = db,
  ) => {
    const [newApplication] = await dbOrTx
      .insert(application)
      .values(applicationData)
      .returning();
    if (!newApplication) return undefined;
    return newApplication satisfies Application;
  };

  // Edit application
  static editApplication = async (
    id: number,
    applicationData: Partial<Application>,
    dbOrTx: DbOrTx = db,
  ) => {
    const [updatedApplication] = await dbOrTx
      .update(application)
      .set(applicationData)
      .where(eq(application.id, id))
      .returning();
    return updatedApplication;
  };

  // Update application status
  static updateApplicationStatus = async (
    id: number,
    status: "applied" | "shortlisted" | "interview" | "rejected" | "hired",
    dbOrTx: DbOrTx = db,
  ) => {
    const [updatedApplication] = await dbOrTx
      .update(application)
      .set({ status })
      .where(eq(application.id, id))
      .returning();
    return updatedApplication;
  };

  // Add notes to application
  static addApplicationNotes = async (
    id: number,
    notes: string,
    dbOrTx: DbOrTx = db,
  ) => {
    const [updatedApplication] = await dbOrTx
      .update(application)
      .set({ notes })
      .where(eq(application.id, id))
      .returning();
    return updatedApplication;
  };

  // Delete application
  static deleteApplication = async (id: number, dbOrTx: DbOrTx = db) => {
    const result = await dbOrTx
      .delete(application)
      .where(eq(application.id, id));
    if (!result.rowCount) return undefined;
    return "Application has been deleted successfully";
  };

  // Bulk get applications by ids
  static getApplicationsByIds = async (ids: number[], dbOrTx: DbOrTx = db) => {
    return dbOrTx
      .select()
      .from(application)
      .where(inArray(application.id, ids));
  };

  // Bulk update applications status (for auto-reject when someone is hired)
  static bulkUpdateApplicationsStatus = async (
    ids: number[],
    status: "applied" | "shortlisted" | "interview" | "rejected" | "hired",
    dbOrTx: DbOrTx = db,
  ) => {
    if (!ids.length) return 0;

    const result = await dbOrTx
      .update(application)
      .set({ status })
      .where(inArray(application.id, ids));

    return result.rowCount ?? 0;
  };

  // Get all applications for a job excluding specific application (for auto-reject)
  static getApplicationsByJobIdExcluding = async (
    jobId: number,
    excludeId: number,
    dbOrTx: DbOrTx = db,
  ) => {
    return await dbOrTx
      .select()
      .from(application)
      .where(and(eq(application.jobId, jobId), ne(application.id, excludeId)));
  };
}
