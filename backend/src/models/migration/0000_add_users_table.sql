CREATE TYPE "public"."userRole" AS ENUM('candidate', 'hr', 'admin');--> statement-breakpoint
CREATE TYPE "public"."userStatus" AS ENUM('active', 'closed');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "userRole" NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"department" varchar(100),
	"profile_picture" text NOT NULL,
	"cv_url" text,
	"status" "userStatus" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
