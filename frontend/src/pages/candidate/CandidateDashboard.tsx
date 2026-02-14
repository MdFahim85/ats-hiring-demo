import { useMemo } from "react";
import { Link } from "react-router";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../contexts/AuthContext";
import { mockApplications, mockJobs } from "../../lib/mockData";
import { Calendar, Briefcase } from "lucide-react";
import Client_ROUTEMAP from "../../misc/Client_ROUTEMAP";

function CandidateDashboardContent() {
  const { user } = useAuth();

  const myApplications = useMemo(() => {
    if (!user) return [];

    return mockApplications
      .filter((app) => app.candidateId === user.id)
      .map((app) => {
        const job = mockJobs.find((j) => j.id === app.jobId);
        return { ...app, job };
      })
      .sort(
        (a, b) =>
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
      );
  }, [user]);

  const stats = useMemo(() => {
    const total = myApplications.length;
    const applied = myApplications.filter((a) => a.status === "applied").length;
    const shortlisted = myApplications.filter(
      (a) => a.status === "shortlisted",
    ).length;
    const hired = myApplications.filter((a) => a.status === "hired").length;

    return { total, applied, shortlisted, hired };
  }, [myApplications]);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">My Applications</h1>
        <p className="text-gray-600">
          Track the status of your job applications
        </p>
      </div>

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
                  <th className="text-left text-xs text-gray-600 px-6 py-4">
                    Last Updated
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

                  const updatedDate = new Date(
                    app.updatedAt,
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
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {updatedDate}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`${Client_ROUTEMAP.public.root}/${Client_ROUTEMAP.public.jobDetails.replace(
                            Client_ROUTEMAP.public._params.jobId,
                            app.job.id,
                          )}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          View Job
                        </Link>
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
