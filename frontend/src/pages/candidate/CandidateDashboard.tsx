import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatusBadge } from "../../components/StatusBadge";
import { Calendar, Briefcase, Sparkles, Target } from "lucide-react";
import Client_ROUTEMAP from "../../misc/Client_ROUTEMAP";
import { useUserContext } from "@/contexts/UserContext";
import Loading from "@/components/shared/Loading";
import { modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";

import type { getApplicationsByCandidateId } from "@backend/controllers/application";
import type { getJobById } from "@backend/controllers/job";
import type { GetRes } from "@backend/types/req-res";
import type { findMatchingJobs } from "@backend/controllers/ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function CandidateDashboardContent() {
  const { user } = useUserContext();
  const navigate = useNavigate();

  const [showMatches, setShowMatches] = useState(false);

  const { data: matchedJobs, isLoading: isMatchLoading } = useQuery({
    queryKey: [Server_ROUTEMAP.ai.root + Server_ROUTEMAP.ai.matchJobs],
    queryFn: () =>
      modifiedFetch<GetRes<typeof findMatchingJobs>>(
        Server_ROUTEMAP.ai.root + Server_ROUTEMAP.ai.matchJobs,
      ),
    enabled: showMatches,
    retry: false,
  });

  const { data: applications, isLoading: isApplicationsLoading } = useQuery({
    queryKey: [
      Server_ROUTEMAP.applications.root +
        Server_ROUTEMAP.applications.getByCandidate,
      user?.id,
    ],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getApplicationsByCandidateId>>(
        Server_ROUTEMAP.applications.root +
          Server_ROUTEMAP.applications.getByCandidate.replace(
            Server_ROUTEMAP.applications._params.candidateId,
            user!.id.toString(),
          ),
      ),
    enabled: !!user?.id,
    retry: false,
  });

  const { data: jobs, isLoading: isJobsLoading } = useQuery({
    queryKey: [Server_ROUTEMAP.jobs.root + Server_ROUTEMAP.jobs.get],
    queryFn: async () => {
      if (!applications || applications.length === 0) return [];

      const jobIds = [...new Set(applications.map((app) => app.jobId))];
      const jobPromises = jobIds.map((jobId) =>
        modifiedFetch<GetRes<typeof getJobById>>(
          Server_ROUTEMAP.jobs.root +
            Server_ROUTEMAP.jobs.getById.replace(
              Server_ROUTEMAP.jobs._params.id,
              jobId.toString(),
            ),
        ),
      );

      return await Promise.all(jobPromises);
    },
    enabled: !!applications && applications.length > 0,
    retry: false,
  });

  const myApplications = useMemo(() => {
    if (!applications || !jobs) return [];

    return applications
      .map((app) => {
        const job = jobs.find((j) => j?.id === app.jobId);
        return { ...app, job };
      })
      .sort(
        (a, b) =>
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
      );
  }, [applications, jobs]);

  const stats = useMemo(() => {
    if (!applications) {
      return { total: 0, applied: 0, shortlisted: 0, hired: 0 };
    }

    const total = applications.length;
    const applied = applications.filter((a) => a.status === "applied").length;
    const shortlisted = applications.filter(
      (a) => a.status === "shortlisted",
    ).length;
    const hired = applications.filter((a) => a.status === "hired").length;

    return { total, applied, shortlisted, hired };
  }, [applications]);

  if (isApplicationsLoading || isJobsLoading) return <Loading />;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">My Applications</h1>
          <p className="text-gray-600">
            Track the status of your job applications
          </p>
        </div>
        <div className="space-y-2">
          <div>
            <h3 className="text-lg font-semibold mb-1">AI Job Matching</h3>
            <p className="text-sm text-muted-foreground">
              Let AI find the best jobs based on your resume
            </p>
          </div>
          <Button
            onClick={() => setShowMatches(true)}
            disabled={isMatchLoading || !jobs?.length}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isMatchLoading ? "Finding..." : "Find My Matches"}
          </Button>
        </div>
      </div>

      {showMatches && matchedJobs?.length && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Best Matches</h2>
          <div className="space-y-3">
            {matchedJobs.map((match) => (
              <Card
                key={match.jobId}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{match.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-green-600">
                        {match.matchScore}% Match
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {match.matchReason}
                  </p>

                  {match.missingSkills.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Skills to develop: {match.missingSkills.join(", ")}
                      </p>
                    </div>
                  )}

                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate(`/jobs/${match.jobId}`)}
                  >
                    View Job
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Total Applications</p>
          <p className="text-3xl text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Under Review</p>
          <p className="text-3xl text-blue-600">{stats.applied}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Shortlisted</p>
          <p className="text-3xl text-purple-600">{stats.shortlisted}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Hired</p>
          <p className="text-3xl text-green-600">{stats.hired}</p>
        </div>
      </div>

      {/* Applications List */}
      {myApplications.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs text-gray-600 px-6 py-4">
                    Job Title
                  </th>
                  <th className="text-left text-xs text-gray-600 px-6 py-4">
                    Department
                  </th>
                  <th className="text-left text-xs text-gray-600 px-6 py-4">
                    Applied Date
                  </th>
                  <th className="text-left text-xs text-gray-600 px-6 py-4">
                    Status
                  </th>
                  <th className="text-right text-xs text-gray-600 px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {myApplications.map((app) => {
                  if (!app.job) return null;

                  const appliedDate = new Date(
                    app.appliedAt,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={app.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{app.job.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {app.job.department}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{appliedDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-6 py-4 text-right flex gap-4 justify-end">
                        <Link
                          to={`${Client_ROUTEMAP.public.root}/${Client_ROUTEMAP.public.jobDetails.replace(
                            Client_ROUTEMAP.public._params.jobId,
                            app.job.id.toString(),
                          )}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          View Job
                        </Link>
                        {app.status === "interview" && (
                          <Link
                            to={`${Client_ROUTEMAP.candidate.root}/${Client_ROUTEMAP.candidate.interviewDetail.replace(
                              Client_ROUTEMAP.candidate._params.applicationId,
                              app.id.toString(),
                            )}`}
                            className="text-sm text-purple-600 hover:text-purple-700"
                          >
                            View Interview
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg text-gray-900 mb-2">No Applications Yet</h3>
          <p className="text-gray-600 mb-6">
            Start your job search by browsing available positions
          </p>
          <Link
            to={Client_ROUTEMAP._.root}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function CandidateDashboard() {
  return (
    <ProtectedRoute allowedRoles={["candidate"]} allowLoggedInOnly>
      <CandidateDashboardContent />
    </ProtectedRoute>
  );
}
