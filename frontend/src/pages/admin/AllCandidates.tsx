import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { DashboardLayout } from "../../components/DashboardLayout";
import { Search, Mail, User as UserIcon } from "lucide-react";
import Client_ROUTEMAP from "../../misc/Client_ROUTEMAP";
import Loading from "@/components/shared/Loading";
import { modifiedFetch, API_URL } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";

import type { getAllUsers } from "@backend/controllers/user";
import type { getAllApplications } from "@backend/controllers/application";
import type { GetRes } from "@backend/types/req-res";

function AllCandidatesContent() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allUsers, isLoading: isUsersLoading } = useQuery({
    queryKey: [Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.get],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getAllUsers>>(
        Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.get,
      ),
    retry: false,
  });

  const { data: applications, isLoading: isApplicationsLoading } = useQuery({
    queryKey: [
      Server_ROUTEMAP.applications.root + Server_ROUTEMAP.applications.get,
    ],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getAllApplications>>(
        Server_ROUTEMAP.applications.root + Server_ROUTEMAP.applications.get,
      ),
    retry: false,
  });

  const candidates = useMemo(() => {
    if (!allUsers || !applications) return [];

    return allUsers
      .filter((u) => u.role === "candidate")
      .filter((candidate) => {
        const matchesSearch =
          candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      })
      .map((candidate) => {
        const candidateApplications = applications.filter(
          (app) => app.candidateId === candidate.id,
        );
        const applicationCount = candidateApplications.length;
        const hiredCount = candidateApplications.filter(
          (app) => app.status === "hired",
        ).length;
        return { ...candidate, applicationCount, hiredCount };
      });
  }, [allUsers, applications, searchTerm]);

  if (isUsersLoading || isApplicationsLoading) return <Loading />;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-gray-900 mb-2">All Candidates</h1>
        <p className="text-gray-600">Complete list of registered candidates</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search candidates by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {candidates.length}{" "}
          {candidates.length === 1 ? "candidate" : "candidates"} found
        </p>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs text-gray-600 px-6 py-4">
                  Candidate
                </th>
                <th className="text-left text-xs text-gray-600 px-6 py-4">
                  Email
                </th>
                <th className="text-left text-xs text-gray-600 px-6 py-4">
                  Phone
                </th>
                <th className="text-left text-xs text-gray-600 px-6 py-4">
                  Applications
                </th>
                <th className="text-left text-xs text-gray-600 px-6 py-4">
                  Hired
                </th>
                <th className="text-right text-xs text-gray-600 px-6 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {candidate.profilePicture ? (
                        <img
                          src={
                            API_URL +
                            Server_ROUTEMAP.uploads.root +
                            Server_ROUTEMAP.uploads.images +
                            "/" +
                            candidate.profilePicture
                          }
                          alt={candidate.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                      <span className="text-gray-900">{candidate.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={`mailto:${candidate.email}`}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{candidate.email}</span>
                    </a>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {candidate.phone || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {candidate.applicationCount}
                  </td>
                  <td className="px-6 py-4">
                    {candidate.hiredCount > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                        {candidate.hiredCount}{" "}
                        {candidate.hiredCount === 1 ? "position" : "positions"}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`${Client_ROUTEMAP.admin.root}/${Client_ROUTEMAP.admin.candidateDetails.replace(
                        Client_ROUTEMAP.admin._params.candidateId,
                        candidate.id.toString(),
                      )}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AllCandidates() {
  return (
    <ProtectedRoute allowedRoles={["admin"]} allowLoggedInOnly>
      <AllCandidatesContent />
    </ProtectedRoute>
  );
}
