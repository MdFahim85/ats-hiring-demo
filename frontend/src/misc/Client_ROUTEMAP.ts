export default {
  _: { root: "/" },

  public: {
    _params: { jobId: ":jobId" },
    root: "/jobs",
    index: "",
    jobDetails: ":jobId",
  },

  auth: {
    root: "/auth",
    index: "",
    login: "login",
    register: "register",
    logout: "logout",
  },

  candidate: {
    _params: { applicationId: ":applicationId" },
    root: "/candidate",
    index: "dashboard",
    dashboard: "dashboard",
    profile: "profile",
    applications: "applications",
    interviewDetail: "interviews/:applicationId",
    applicationDetails: "applications/:applicationId",
  },

  hr: {
    _params: { jobId: ":jobId", candidateId: ":candidateId" },
    root: "/hr",
    index: "dashboard",
    dashboard: "dashboard",
    jobs: "jobs",
    createJob: "jobs/create",
    editJob: "jobs/:jobId/edit",
    applicants: "jobs/:jobId/applicants",
    candidateDetails: "jobs/:jobId/applicants/:candidateId",
    shortListed: "jobs/:jobId/shortlisted",
    interviews: "jobs/:jobId/schedule-interviews",
    interviewDetails: "jobs/:jobId/interviews/:candidateId",
    calendar: "calendar",
  },

  admin: {
    _params: { hrId: ":hrId", candidateId: ":candidateId" },
    root: "/admin",
    index: "dashboard",
    dashboard: "dashboard",
    hrUsers: "hr-users",
    createHR: "hr-users/create",
    editHR: "hr-users/:hrId/edit",
    jobs: "jobs",
    candidates: "candidates",
    candidateDetails: "candidates/:candidateId",
  },

  utility: {
    root: "/",
    unauthorized: "unauthorized",
    notFound: "*",
  },
} as const;
