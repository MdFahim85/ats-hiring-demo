CREATE TYPE "public"."applicationStatus" AS ENUM('applied', 'shortlisted', 'interview', 'rejected', 'hired');--> statement-breakpoint
CREATE TYPE "public"."interviewResult" AS ENUM('pending', 'passed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."interviewStatus" AS ENUM('not_scheduled', 'scheduled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."interviewType" AS ENUM('virtual', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."jobStatus" AS ENUM('draft', 'active', 'closed');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"status" "applicationStatus" DEFAULT 'applied' NOT NULL,
	"cover_letter" text,
	"notes" text,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_job_id_candidate_id_unique" UNIQUE("job_id","candidate_id")
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"interview_date" timestamp with time zone NOT NULL,
	"duration" integer,
	"type" "interviewType",
	"interviewer_id" integer,
	"meeting_link" text,
	"status" "interviewStatus" DEFAULT 'not_scheduled' NOT NULL,
	"preparation_notes" text,
	"feedback" text,
	"rating" integer,
	"result" "interviewResult",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interviews_application_id_unique" UNIQUE("application_id")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"department" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"requirements" text NOT NULL,
	"salary_range" varchar(100),
	"job_type" varchar(50),
	"deadline" timestamp with time zone NOT NULL,
	"status" "jobStatus" DEFAULT 'draft' NOT NULL,
	"hr_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"related_entity_type" varchar(50),
	"related_entity_id" integer,
	"is_read" boolean DEFAULT false NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_users_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_candidate_id_users_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_interviewer_id_users_id_fk" FOREIGN KEY ("interviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_hr_id_users_id_fk" FOREIGN KEY ("hr_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;