import { createBrowserRouter } from "react-router";
import Client_ROUTEMAP from "./misc/Client_ROUTEMAP";

import Root from "./pages/Root";

/* ===== Public ===== */
import PublicJobBoard from "./pages/PublicJobBoard";
import JobDetail from "./pages/JobDetail";

/* ===== Auth ===== */
import Login from "./pages/auth/Login";
import CandidateRegister from "./pages/auth/Register";

/* ===== Candidate ===== */
import CandidateDashboard from "./pages/candidate/CandidateDashboard";

/* ===== HR ===== */
import HRDashboard from "./pages/hr/HRDashboard";
import CreateJob from "./pages/hr/CreateJob";
import EditJob from "./pages/hr/EditJob";
import JobApplicants from "./pages/hr/JobApplicants";
import CandidateDetail from "./pages/hr/CandidateDetail";

/* ===== Admin ===== */
import AdminDashboard from "./pages/admin/AdminDashboard";
import HRManagement from "./pages/admin/HRManagement";
import AllJobs from "./pages/admin/AllJobs";
import AllCandidates from "./pages/admin/AllCandidates";

/* ===== Utility ===== */
import Unauthorized from "./pages/NotFound";
import NotFound from "./pages/NotFound";
import AdminCandidateDetail from "./pages/admin/AdminCandidateDetail";
import ShortlistedCandidates from "./pages/hr/ShortlistedCandidates";
import ScheduleInterviews from "./pages/hr/InterviewSchedule";
import InterviewDetail from "./pages/hr/InterviewDetail";

export const router = createBrowserRouter([
  {
    path: Client_ROUTEMAP._.root,
    Component: Root,
    children: [
      {
        index: true,
        Component: PublicJobBoard,
      },

      {
        path: Client_ROUTEMAP.public.root,
        children: [
          {
            index: true,
            Component: PublicJobBoard,
          },
          {
            path: Client_ROUTEMAP.public.jobDetails,
            Component: JobDetail,
          },
        ],
      },

      {
        path: Client_ROUTEMAP.auth.root,
        children: [
          {
            index: true,
            Component: Login,
          },
          {
            path: Client_ROUTEMAP.auth.login,
            Component: Login,
          },
          {
            path: Client_ROUTEMAP.auth.register,
            Component: CandidateRegister,
          },
        ],
      },

      {
        path: Client_ROUTEMAP.candidate.root,
        children: [
          {
            path: Client_ROUTEMAP.candidate.index,
            Component: CandidateDashboard,
          },
        ],
      },

      {
        path: Client_ROUTEMAP.hr.root,
        children: [
          {
            path: Client_ROUTEMAP.hr.index,
            Component: HRDashboard,
          },
          {
            path: Client_ROUTEMAP.hr.createJob,
            Component: CreateJob,
          },
          {
            path: Client_ROUTEMAP.hr.editJob,
            Component: EditJob,
          },
          {
            path: Client_ROUTEMAP.hr.applicants,
            Component: JobApplicants,
          },
          {
            path: Client_ROUTEMAP.hr.candidateDetails,
            Component: CandidateDetail,
          },
          {
            path: Client_ROUTEMAP.hr.shortListed,
            Component: ShortlistedCandidates,
          },
          {
            path: Client_ROUTEMAP.hr.interviews,
            Component: ScheduleInterviews,
          },
          {
            path: Client_ROUTEMAP.hr.interviewDetails,
            Component: InterviewDetail,
          },
        ],
      },

      {
        path: Client_ROUTEMAP.admin.root,
        children: [
          {
            path: Client_ROUTEMAP.admin.index,
            Component: AdminDashboard,
          },
          {
            path: Client_ROUTEMAP.admin.hrUsers,
            Component: HRManagement,
          },
          {
            path: Client_ROUTEMAP.admin.jobs,
            Component: AllJobs,
          },
          {
            path: Client_ROUTEMAP.admin.candidates,
            Component: AllCandidates,
          },
          {
            path: Client_ROUTEMAP.admin.candidateDetails,
            Component: AdminCandidateDetail,
          },
        ],
      },

      {
        path: Client_ROUTEMAP.utility.unauthorized,
        Component: Unauthorized,
      },
      {
        path: Client_ROUTEMAP.utility.notFound,
        Component: NotFound,
      },
    ],
  },
]);
