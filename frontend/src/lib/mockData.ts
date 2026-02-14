import type { User, Job, Application, HRUser, Interview } from "../types";

// Mock users for authentication
export const mockUsers: User[] = [
  {
    id: "candidate-1",
    email: "john.doe@example.com",
    role: "candidate",
    name: "John Doe",
    phone: "+1 (555) 123-4567",
    profilePicture:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    cvUrl: "/mock-cv.pdf",
  },
  {
    id: "candidate-2",
    email: "jane.smith@example.com",
    role: "candidate",
    name: "Jane Smith",
    phone: "+1 (555) 234-5678",
    profilePicture:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    cvUrl: "/mock-cv.pdf",
  },
  {
    id: "candidate-3",
    email: "mike.johnson@example.com",
    role: "candidate",
    name: "Mike Johnson",
    phone: "+1 (555) 345-6789",
    profilePicture:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    cvUrl: "/mock-cv.pdf",
  },
  {
    id: "hr-1",
    email: "sarah.hr@company.com",
    role: "hr",
    name: "Sarah Williams",
    department: "Engineering",
  },
  {
    id: "hr-2",
    email: "mark.hr@company.com",
    role: "hr",
    name: "Mark Thompson",
    department: "Marketing",
  },
  {
    id: "admin-1",
    email: "admin@company.com",
    role: "admin",
    name: "Admin User",
  },
];

export const mockJobs: Job[] = [
  {
    id: "job-1",
    title: "Senior Frontend Developer",
    department: "Engineering",
    description:
      "We are looking for an experienced frontend developer to join our engineering team. You will be responsible for building scalable, maintainable web applications using modern JavaScript frameworks.",
    requirements:
      "• 5+ years of experience with React\n• Strong understanding of TypeScript\n• Experience with modern CSS frameworks\n• Excellent problem-solving skills\n• Strong communication skills",
    deadline: "2026-03-15",
    status: "active",
    hrId: "hr-1",
    createdAt: "2026-01-15",
    applicantCount: 10,
  },
  {
    id: "job-2",
    title: "Product Designer",
    department: "Design",
    description:
      "Join our design team to create beautiful, intuitive user experiences. You will work closely with product managers and engineers to design and ship new features.",
    requirements:
      "• 3+ years of product design experience\n• Proficiency in Figma\n• Strong portfolio demonstrating UX/UI work\n• Understanding of design systems\n• Excellent collaboration skills",
    deadline: "2026-03-20",
    status: "active",
    hrId: "hr-1",
    createdAt: "2026-01-20",
    applicantCount: 2,
  },
  {
    id: "job-3",
    title: "Marketing Manager",
    department: "Marketing",
    description:
      "Lead our marketing initiatives and develop strategies to grow our brand. You will manage campaigns, analyze metrics, and work with cross-functional teams.",
    requirements:
      "• 5+ years of marketing experience\n• Proven track record of successful campaigns\n• Strong analytical skills\n• Experience with digital marketing tools\n• Leadership experience",
    deadline: "2026-03-10",
    status: "active",
    hrId: "hr-2",
    createdAt: "2026-01-10",
    applicantCount: 15,
  },
  {
    id: "job-4",
    title: "Backend Engineer",
    department: "Engineering",
    description:
      "Build robust, scalable backend systems that power our platform. Work with databases, APIs, and cloud infrastructure.",
    requirements:
      "• 4+ years backend development experience\n• Proficiency in Node.js or Python\n• Experience with SQL and NoSQL databases\n• Knowledge of cloud platforms (AWS/GCP)\n• Strong understanding of system design",
    deadline: "2026-03-25",
    status: "active",
    hrId: "hr-1",
    createdAt: "2026-01-25",
    applicantCount: 0,
  },
  {
    id: "job-5",
    title: "Data Analyst",
    department: "Analytics",
    description:
      "Turn data into actionable insights. Work with large datasets to identify trends and help drive business decisions.",
    requirements:
      "• 3+ years of data analysis experience\n• Proficiency in SQL\n• Experience with Python or R\n• Strong visualization skills (Tableau, Power BI)\n• Excellent communication skills",
    deadline: "2026-02-28",
    status: "closed",
    hrId: "hr-2",
    createdAt: "2026-01-05",
    applicantCount: 20,
  },
];

export const mockApplications: Application[] = [
  {
    id: "app-1",
    jobId: "job-1",
    candidateId: "candidate-1",
    status: "shortlisted",
    appliedAt: "2026-01-20T10:00:00Z",
    updatedAt: "2026-01-25T14:30:00Z",
  },
  {
    id: "app-2",
    jobId: "job-2",
    candidateId: "candidate-1",
    status: "applied",
    appliedAt: "2026-01-22T09:15:00Z",
    updatedAt: "2026-01-22T09:15:00Z",
  },
  {
    id: "app-3",
    jobId: "job-3",
    candidateId: "candidate-1",
    status: "rejected",
    appliedAt: "2026-01-18T11:30:00Z",
    updatedAt: "2026-01-28T16:00:00Z",
  },
  {
    id: "app-4",
    jobId: "job-1",
    candidateId: "candidate-2",
    status: "hired",
    appliedAt: "2026-01-16T14:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "app-5",
    jobId: "job-2",
    candidateId: "candidate-2",
    status: "applied",
    appliedAt: "2026-01-23T15:45:00Z",
    updatedAt: "2026-01-23T15:45:00Z",
  },
  {
    id: "app-6",
    jobId: "job-1",
    candidateId: "candidate-3",
    status: "shortlisted",
    appliedAt: "2026-01-21T08:30:00Z",
    updatedAt: "2026-01-26T11:00:00Z",
  },
];

export const mockHRUsers: HRUser[] = [
  {
    id: "hr-1",
    name: "Sarah Williams",
    email: "sarah.hr@company.com",
    department: "Engineering",
    status: "active",
    createdAt: "2025-06-01",
  },
  {
    id: "hr-2",
    name: "Mark Thompson",
    email: "mark.hr@company.com",
    department: "Marketing",
    status: "active",
    createdAt: "2025-07-15",
  },
  {
    id: "hr-3",
    name: "Lisa Chen",
    email: "lisa.hr@company.com",
    department: "Design",
    status: "draft",
    createdAt: "2025-08-20",
  },
];

export const mockInterviews: Interview[] = [
  {
    id: "int-1",
    applicationId: "app-1",
    jobId: "job-1",
    candidateId: "candidate-1",
    date: "2026-02-20",
    time: "10:00",
    duration: 60,
    type: "virtual",
    interviewer: "Sarah Williams",
    meetingLink: "https://meet.example.com/abc-def-ghi",
    status: "scheduled",
    preparationNotes: "Review candidate's React portfolio projects.",
    createdAt: "2026-02-10T10:00:00Z",
    updatedAt: "2026-02-10T10:00:00Z",
  },
  {
    id: "int-2",
    applicationId: "app-6",
    jobId: "job-1",
    candidateId: "candidate-3",
    status: "not_scheduled",
    createdAt: "2026-02-05T10:00:00Z",
    updatedAt: "2026-02-05T10:00:00Z",
  },
  {
    id: "int-3",
    applicationId: "app-4",
    jobId: "job-1",
    candidateId: "candidate-2",
    date: "2026-01-28",
    time: "14:00",
    duration: 60,
    type: "virtual",
    interviewer: "Sarah Williams",
    meetingLink: "https://meet.example.com/xyz-123-456",
    status: "completed",
    preparationNotes: "Focus on system design experience.",
    feedback:
      "Excellent technical skills and communication. Strong problem-solving abilities. Recommended for hire.",
    rating: 5,
    result: "passed",
    createdAt: "2026-01-20T10:00:00Z",
    updatedAt: "2026-01-28T15:30:00Z",
  },
];

// Default password for all mock users: "password123"
export const MOCK_PASSWORD = "password123";
