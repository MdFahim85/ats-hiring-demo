import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Client_ROUTEMAP from "./misc/Client_ROUTEMAP";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Loading from "./components/shared/Loading";

/* ===== Lazy Imports ===== */
const RootLazy = lazy(() => import("./pages/Root"));

/* Public */
const PublicJobBoardLazy = lazy(() => import("./pages/PublicJobBoard"));
const JobDetailLazy = lazy(() => import("./pages/JobDetail"));

/* Auth */
const LoginLazy = lazy(() => import("./pages/auth/Login"));
const CandidateRegisterLazy = lazy(() => import("./pages/auth/Register"));

/* Candidate */
const CandidateDashboardLazy = lazy(
  () => import("./pages/candidate/CandidateDashboard"),
);
const CandidateInterviewLazy = lazy(
  () => import("./pages/candidate/InterviewDetails"),
);

/* HR */
const HRDashboardLazy = lazy(() => import("./pages/hr/HRDashboard"));
const CreateJobLazy = lazy(() => import("./pages/hr/CreateJob"));
const EditJobLazy = lazy(() => import("./pages/hr/EditJob"));
const JobApplicantsLazy = lazy(() => import("./pages/hr/JobApplicants"));
const CandidateDetailLazy = lazy(() => import("./pages/hr/CandidateDetail"));
const ShortlistedCandidatesLazy = lazy(
  () => import("./pages/hr/ShortlistedCandidates"),
);
const ScheduleInterviewsLazy = lazy(
  () => import("./pages/hr/InterviewSchedule"),
);
const InterviewDetailLazy = lazy(() => import("./pages/hr/InterviewDetail"));

/* Admin */
const AdminDashboardLazy = lazy(() => import("./pages/admin/AdminDashboard"));
const HRManagementLazy = lazy(() => import("./pages/admin/HRManagement"));
const AllJobsLazy = lazy(() => import("./pages/admin/AllJobs"));
const AllCandidatesLazy = lazy(() => import("./pages/admin/AllCandidates"));
const AdminCandidateDetailLazy = lazy(
  () => import("./pages/admin/AdminCandidateDetail"),
);

const RouteComponent = () => (
  <Suspense fallback={<Loading />}>
    <Routes>
      {/* Root */}
      <Route path={Client_ROUTEMAP._.root} element={<RootLazy />}>
        {/* Default */}
        <Route index element={<PublicJobBoardLazy />} />

        {/* Public */}
        <Route path={Client_ROUTEMAP.public.root}>
          <Route index element={<PublicJobBoardLazy />} />
          <Route
            path={Client_ROUTEMAP.public.jobDetails}
            element={<JobDetailLazy />}
          />
        </Route>

        {/* Auth */}
        <Route path={Client_ROUTEMAP.auth.root}>
          <Route
            path={Client_ROUTEMAP.auth.login}
            element={
              <ProtectedRoute allowLoggedOutOnly>
                <LoginLazy />
              </ProtectedRoute>
            }
          />
          <Route
            path={Client_ROUTEMAP.auth.register}
            element={
              <ProtectedRoute allowLoggedOutOnly>
                <CandidateRegisterLazy />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Candidate */}
        <Route path={Client_ROUTEMAP.candidate.root}>
          <Route
            path={Client_ROUTEMAP.candidate.index}
            element={
              <ProtectedRoute allowLoggedInOnly allowedRoles={["candidate"]}>
                <CandidateDashboardLazy />
              </ProtectedRoute>
            }
          />
          <Route
            path={Client_ROUTEMAP.candidate.interviewDetail}
            element={
              <ProtectedRoute allowLoggedInOnly allowedRoles={["candidate"]}>
                <CandidateInterviewLazy />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* HR */}
        <Route path={Client_ROUTEMAP.hr.root}>
          <Route
            path={Client_ROUTEMAP.hr.index}
            element={
              <ProtectedRoute allowLoggedInOnly allowedRoles={["hr"]}>
                <HRDashboardLazy />
              </ProtectedRoute>
            }
          />
          <Route
            path={Client_ROUTEMAP.hr.createJob}
            element={
              <ProtectedRoute allowLoggedInOnly allowedRoles={["hr"]}>
                <CreateJobLazy />
              </ProtectedRoute>
            }
          />
          <Route
            path={Client_ROUTEMAP.hr.editJob}
            element={
              <ProtectedRoute allowLoggedInOnly allowedRoles={["hr"]}>
                <EditJobLazy />
              </ProtectedRoute>
            }
          />
          <Route
            path={Client_ROUTEMAP.hr.applicants}
            element={
              <ProtectedRoute allowLoggedInOnly allowedRoles={["hr"]}>
                <JobApplicantsLazy />
              </ProtectedRoute>
            }
          />
          <Route
            path={Client_ROUTEMAP.hr.candidateDetails}
            element={
              <ProtectedRoute allowLoggedInOnly allowedRoles={["hr"]}>
                <CandidateDetailLazy />
              </ProtectedRoute>
            }
          />
          <Route
            path={Client_ROUTEMAP.hr.shortListed}
            element={
              <ProtectedRoute allowLoggedInOnly allowedRoles={["hr"]}>
                <ShortlistedCandidatesLazy />
              </ProtectedRoute>
            }
          />
          <Route
            path={Client_ROUTEMAP.hr.interviews}
            element={
              <ProtectedRoute allowLoggedInOnly allowedRoles={["hr"]}>
                <ScheduleInterviewsLazy />
              </ProtectedRoute>
            }
          />
          <Route
            path={Client_ROUTEMAP.hr.interviewDetails}
            element={
              <ProtectedRoute allowLoggedInOnly allowedRoles={["hr"]}>
                <InterviewDetailLazy />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin */}
        <Route path={Client_ROUTEMAP.admin.root}>
          <Route
            path={Client_ROUTEMAP.admin.index}
            element={
              <ProtectedRoute allowLoggedInOnly allowedRoles={["admin"]}>
                <AdminDashboardLazy />
              </ProtectedRoute>
            }
          />
          <Route
            path={Client_ROUTEMAP.admin.hrUsers}
            element={
              <ProtectedRoute allowLoggedInOnly allowedRoles={["admin"]}>
                <HRManagementLazy />
              </ProtectedRoute>
            }
          />
          <Route
            path={Client_ROUTEMAP.admin.jobs}
            element={
              <ProtectedRoute allowLoggedInOnly allowedRoles={["admin"]}>
                <AllJobsLazy />
              </ProtectedRoute>
            }
          />
          <Route
            path={Client_ROUTEMAP.admin.candidates}
            element={
              <ProtectedRoute allowLoggedInOnly allowedRoles={["admin"]}>
                <AllCandidatesLazy />
              </ProtectedRoute>
            }
          />
          <Route
            path={Client_ROUTEMAP.admin.candidateDetails}
            element={
              <ProtectedRoute allowLoggedInOnly allowedRoles={["admin"]}>
                <AdminCandidateDetailLazy />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Unauthorized */}
        <Route
          path={Client_ROUTEMAP.utility.unauthorized}
          element={<Unauthorized />}
        />

        {/* Not Found */}
        <Route path={Client_ROUTEMAP.utility.notFound} element={<NotFound />} />

        <Route
          path="*"
          element={<Navigate to={Client_ROUTEMAP.utility.notFound} />}
        />
      </Route>
    </Routes>
  </Suspense>
);

export default RouteComponent;
