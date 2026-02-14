import { useMemo } from "react";
import { Link } from "react-router";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { DashboardLayout } from "../../components/DashboardLayout";
import {
  mockJobs,
  mockApplications,
  mockUsers,
  mockHRUsers,
} from "../../lib/mockData";
import { Briefcase, Users, UserCheck, TrendingUp, Clock } from "lucide-react";
import Client_ROUTEMAP from "../../misc/Client_ROUTEMAP";

function AdminDashboardContent() {
  const stats = useMemo(() => {
    const totalJobs = mockJobs.length;
    const activeJobs = mockJobs.filter((j) => j.status === "active").length;
    const totalApplications = mockApplications.length;
    const totalHires = mockApplications.filter(
      (a) => a.status === "hired",
    ).length;
    const activeHRUsers = mockHRUsers.filter(
      (hr) => hr.status === "active",
    ).length;
    const totalCandidates = mockUsers.filter(
      (u) => u.role === "candidate",
    ).length;

    return {
      totalJobs,
      activeJobs,
      totalApplications,
      totalHires,
      activeHRUsers,
      totalCandidates,
    };
  }, []);

  const recentActivity = useMemo(() => {
    // Get recent jobs and applications
    const recentJobs = mockJobs
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5)
      .map((job) => {
        const hr = mockUsers.find((u) => u.id === job.hrId);
        return {
          type: "job" as const,
          title: job.title,
          description: `Posted by ${hr?.name || "Unknown"}`,
          date: job.createdAt,
        };
      });

    const recentApps = mockApplications
      .sort(
        (a, b) =>
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
      )
      .slice(0, 5)
      .map((app) => {
        const candidate = mockUsers.find((u) => u.id === app.candidateId);
        const job = mockJobs.find((j) => j.id === app.jobId);
        return {
          type: "application" as const,
          title: `${candidate?.name || "Unknown"} applied`,
          description: `For ${job?.title || "Unknown Position"}`,
          date: app.appliedAt.split("T")[0],
        };
      });

    return [...recentJobs, ...recentApps]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, []);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">System overview and metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link
          to={`${Client_ROUTEMAP.admin.root}/${Client_ROUTEMAP.admin.jobs}`}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-blue-600">View All →</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Jobs</p>
          <p className="text-3xl text-gray-900">{stats.totalJobs}</p>
          <p className="text-sm text-gray-500 mt-2">
            {stats.activeJobs} active
          </p>
        </Link>

        <Link
          to={`${Client_ROUTEMAP.admin.root}/${Client_ROUTEMAP.admin.candidates}`}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-purple-600">View All →</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Candidates</p>
          <p className="text-3xl text-gray-900">{stats.totalCandidates}</p>
          <p className="text-sm text-gray-500 mt-2">
            {stats.totalApplications} applications
          </p>
        </Link>

        <Link
          to={`${Client_ROUTEMAP.admin.root}/${Client_ROUTEMAP.admin.hrUsers}`}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-green-600">Manage →</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">HR Users</p>
          <p className="text-3xl text-gray-900">{mockHRUsers.length}</p>
          <p className="text-sm text-gray-500 mt-2">
            {stats.activeHRUsers} active
          </p>
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Applications</p>
          <p className="text-3xl text-gray-900">{stats.totalApplications}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <UserCheck className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Hires</p>
          <p className="text-3xl text-gray-900">{stats.totalHires}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Pending Reviews</p>
          <p className="text-3xl text-gray-900">
            {mockApplications.filter((a) => a.status === "applied").length}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const date = new Date(activity.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={index}
                  className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === "job" ? "bg-blue-100" : "bg-purple-100"
                    }`}
                  >
                    {activity.type === "job" ? (
                      <Briefcase
                        className={`w-5 h-5 ${activity.type === "job" ? "text-blue-600" : "text-purple-600"}`}
                      />
                    ) : (
                      <Users
                        className={`w-5 h-5 ${activity.type === "application" ? "text-blue-600" : "text-purple-600"}`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">{date}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["admin"]} allowLoggedInOnly>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
