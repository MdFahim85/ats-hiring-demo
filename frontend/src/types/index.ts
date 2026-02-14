export type UserRole = "candidate" | "hr" | "admin";

export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "interview"
  | "rejected"
  | "hired";

export type InterviewStatus = "not_scheduled" | "scheduled" | "completed";

export type InterviewType = "virtual" | "in_person";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  department?: string;
  profilePicture?: string;
  cvUrl?: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: string;
  deadline: string;
  status: "draft" | "active" | "closed";
  hrId: string;
  createdAt: string;
  applicantCount: number;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  notes?: string;
}

export interface HRUser {
  id: string;
  name: string;
  email: string;
  department: string;
  status: "active" | "draft";
  createdAt: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  date?: string;
  time?: string;
  duration?: number; // in minutes
  type?: InterviewType;
  interviewer?: string;
  meetingLink?: string;
  status: InterviewStatus;
  preparationNotes?: string;
  feedback?: string;
  rating?: number; // 1-5
  result?: "pending" | "passed" | "failed";
  createdAt: string;
  updatedAt: string;
}
