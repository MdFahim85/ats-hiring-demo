import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";

import { application } from "./Application";
import { job } from "./Job";
import { user } from "./User";
import { and, eq, inArray, InferSelectModel } from "drizzle-orm";
import { db } from "../config/database";

export const interviewStatusEnum = pgEnum("interviewStatus", [
  "not_scheduled",
  "scheduled",
  "completed",
]);

export const interviewTypeEnum = pgEnum("interviewType", [
  "virtual",
  "in_person",
]);

export const interviewResultEnum = pgEnum("interviewResult", [
  "pending",
  "passed",
  "failed",
]);

// Interview Schema
export const interview = pgTable("interviews", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id")
    .notNull()
    .unique()
    .references(() => application.id, { onDelete: "cascade" }),
  jobId: integer("job_id")
    .notNull()
    .references(() => job.id, { onDelete: "cascade" }),
  candidateId: integer("candidate_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  interviewDate: timestamp("interview_date", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  duration: integer("duration"),
  type: interviewTypeEnum("type"),
  interviewerId: integer("interviewer_id").references(() => user.id, {
    onDelete: "set null",
  }),
  meetingLink: text("meeting_link"),
  status: interviewStatusEnum("status").notNull().default("not_scheduled"),
  preparationNotes: text("preparation_notes"),
  feedback: text("feedback"),
  rating: integer("rating"),
  result: interviewResultEnum("result"),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  calendarEventId: text("calendar_event_id"),
});

export const addInterviewSchema = createInsertSchema(interview, {
  id: (schema) => schema.transform(() => undefined),
  applicationId: () => z.coerce.number().int().gt(0),
  jobId: () => z.coerce.number().int().gt(0),
  candidateId: () => z.coerce.number().int().gt(0),
  interviewDate: (schema) => schema,
  duration: (schema) => schema.nullable(),
  type: () => z.enum(["virtual", "in_person"]).nullable(),
  interviewerId: () => z.coerce.number().int().gt(0).nullable(),
  meetingLink: (schema) => schema.nullable(),
  status: () => z.enum(["not_scheduled", "scheduled", "completed"]),
  preparationNotes: (schema) => schema.nullable(),
  feedback: (schema) => schema.nullable(),
  rating: (schema) => schema.nullable(),
  result: () => z.enum(["pending", "passed", "failed"]).nullable(),
  createdAt: (schema) => schema.transform(() => undefined),
  calendarEventId: (schema) => schema.nullable().transform(() => null),
});

export const updateInterviewSchema = createUpdateSchema(interview, {
  id: (schema) => schema.transform(() => undefined),
  applicationId: () => z.coerce.number().int().gt(0),
  jobId: () => z.coerce.number().int().gt(0),
  candidateId: () => z.coerce.number().int().gt(0),
  interviewDate: (schema) => schema,
  duration: (schema) => schema.nullable(),
  type: () => z.enum(["virtual", "in_person"]).nullable(),
  interviewerId: () => z.coerce.number().int().gt(0).nullable(),
  meetingLink: (schema) => schema.nullable(),
  status: () => z.enum(["not_scheduled", "scheduled", "completed"]),
  preparationNotes: (schema) => schema.nullable(),
  feedback: (schema) => schema.nullable(),
  rating: (schema) => schema.nullable(),
  result: () => z.enum(["pending", "passed", "failed"]).nullable(),
  createdAt: (schema) => schema.transform(() => undefined),
});

export type Interview = InferSelectModel<typeof interview>;

export default class InterviewModel {
  // Get all interviews
  static getInterviews = async (dbOrTx: DbOrTx = db) => {
    return await dbOrTx.select().from(interview);
  };

  // Get interview by id
  static getInterviewById = async (id: number, dbOrTx: DbOrTx = db) => {
    const interviews = await dbOrTx
      .select()
      .from(interview)
      .where(eq(interview.id, id))
      .limit(1);
    return interviews[0];
  };

  // Get interview by application id
  static getInterviewByApplicationId = async (
    applicationId: number,
    dbOrTx: DbOrTx = db,
  ) => {
    const interviews = await dbOrTx
      .select()
      .from(interview)
      .where(eq(interview.applicationId, applicationId))
      .limit(1);
    return interviews[0];
  };

  // Get all interviews for a specific job
  static getInterviewsByJobId = async (jobId: number, dbOrTx: DbOrTx = db) => {
    return await dbOrTx
      .select()
      .from(interview)
      .where(eq(interview.jobId, jobId));
  };

  // Get all interviews for a specific candidate
  static getInterviewsByCandidateId = async (
    candidateId: number,
    dbOrTx: DbOrTx = db,
  ) => {
    return await dbOrTx
      .select()
      .from(interview)
      .where(eq(interview.candidateId, candidateId));
  };

  // Get interviews by status
  static getInterviewsByStatus = async (
    status: "not_scheduled" | "scheduled" | "completed",
    dbOrTx: DbOrTx = db,
  ) => {
    return await dbOrTx
      .select()
      .from(interview)
      .where(eq(interview.status, status));
  };

  // Get interviews by job id and status
  static getInterviewsByJobIdAndStatus = async (
    jobId: number,
    status: "not_scheduled" | "scheduled" | "completed",
    dbOrTx: DbOrTx = db,
  ) => {
    return await dbOrTx
      .select()
      .from(interview)
      .where(and(eq(interview.jobId, jobId), eq(interview.status, status)));
  };

  // Add a new interview
  static addInterview = async (
    interviewData: InsertModel<Interview>,
    dbOrTx: DbOrTx = db,
  ) => {
    const [newInterview] = await dbOrTx
      .insert(interview)
      .values(interviewData)
      .returning();
    if (!newInterview) return undefined;
    return newInterview satisfies Interview;
  };

  // Bulk add interviews (for bulk scheduling)
  static bulkAddInterviews = async (
    interviewsData: InsertModel<Interview>[],
    dbOrTx: DbOrTx = db,
  ) => {
    if (!interviewsData.length) return [];
    const newInterviews = await dbOrTx
      .insert(interview)
      .values(interviewsData)
      .returning();
    return newInterviews;
  };

  // Edit interview
  static editInterview = async (
    id: number,
    interviewData: Partial<Interview>,
    dbOrTx: DbOrTx = db,
  ) => {
    const [updatedInterview] = await dbOrTx
      .update(interview)
      .set(interviewData)
      .where(eq(interview.id, id))
      .returning();
    return updatedInterview;
  };

  // Update interview status
  static updateInterviewStatus = async (
    id: number,
    status: "not_scheduled" | "scheduled" | "completed",
    dbOrTx: DbOrTx = db,
  ) => {
    const [updatedInterview] = await dbOrTx
      .update(interview)
      .set({ status })
      .where(eq(interview.id, id))
      .returning();
    return updatedInterview;
  };

  // Add preparation notes
  static addPreparationNotes = async (
    id: number,
    preparationNotes: string,
    dbOrTx: DbOrTx = db,
  ) => {
    const [updatedInterview] = await dbOrTx
      .update(interview)
      .set({ preparationNotes })
      .where(eq(interview.id, id))
      .returning();
    return updatedInterview;
  };

  // Add feedback and rating
  static addFeedback = async (
    id: number,
    feedbackData: {
      feedback: string;
      rating?: number;
      result?: "pending" | "passed" | "failed";
    },
    dbOrTx: DbOrTx = db,
  ) => {
    const [updatedInterview] = await dbOrTx
      .update(interview)
      .set(feedbackData)
      .where(eq(interview.id, id))
      .returning();
    return updatedInterview;
  };

  // Delete interview
  static deleteInterview = async (id: number, dbOrTx: DbOrTx = db) => {
    const result = await dbOrTx.delete(interview).where(eq(interview.id, id));
    if (!result.rowCount) return undefined;
    return "Interview has been deleted successfully";
  };

  // Bulk get interviews by ids
  static getInterviewsByIds = async (ids: number[], dbOrTx: DbOrTx = db) => {
    return dbOrTx.select().from(interview).where(inArray(interview.id, ids));
  };
}
