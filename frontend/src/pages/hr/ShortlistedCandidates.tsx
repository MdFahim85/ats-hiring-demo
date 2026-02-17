import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  User as UserIcon,
  Users,
} from "lucide-react";

import Loading from "@/components/shared/Loading";
import { getPageRange } from "@/misc";
import Client_ROUTEMAP from "@/misc/Client_ROUTEMAP";
import { API_URL, modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";
import { DashboardLayout } from "../../components/DashboardLayout";
import { ProtectedRoute } from "../../components/ProtectedRoute";

import type { getApplicationsByJobId } from "@backend/controllers/application";
import type { getInterviewsByJobId } from "@backend/controllers/interview";
import type { getJobById } from "@backend/controllers/job";
import type { getUserById } from "@backend/controllers/user";
import type { Application } from "@backend/models/Application";
import type { Interview } from "@backend/models/Interview";
import type { UserWithOutPassword } from "@backend/models/User";
import type { GetRes } from "@backend/types/req-res";

type ShortlistedWithDetails = Application & {
  candidate?: UserWithOutPassword;
  interview?: Interview;
  interviewStatus: Interview["status"];
};

const columnHelper = createColumnHelper<ShortlistedWithDetails>();

function ShortlistedTable({
  data,
  jobId,
}: {
  data: ShortlistedWithDetails[];
  jobId: string;
}) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("candidate", {
        header: "Candidate",
        cell: (info) => {
          const candidate = info.getValue();
          if (!candidate) return null;
          return (
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
              <div>
                <p className="text-gray-900">{candidate.name}</p>
                <p className="text-sm text-gray-500">{candidate.email}</p>
              </div>
            </div>
          );
        },
      }),

      columnHelper.accessor("appliedAt", {
        header: "Applied Date",
        cell: (info) =>
          new Date(info.getValue()).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
      }),

      columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex justify-end">
              <Link
                to={
                  row.interview
                    ? `/hr/jobs/${jobId}/interviews/${row.candidateId}`
                    : `/hr/jobs/${jobId}/schedule-interviews`
                }
                className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {row.interviewStatus === "not_scheduled"
                  ? "Schedule"
                  : "View Details"}
              </Link>
            </div>
          );
        },
      }),
    ],
    [jobId],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  return (
    <>
      {/* Table */}
      <Card className="bg-white p-6">
        <Table className="[&_tr]:border-0 gap-4">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <Card className="bg-white p-4 mt-4">
        <div className="flex justify-between items-center">
          <Button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ArrowLeft /> Prev
          </Button>

          <div className="flex gap-1">
            {getPageRange(
              table.getState().pagination.pageIndex + 1,
              table.getPageCount(),
            ).map((page, idx) =>
              page === "..." ? (
                <span key={idx} className="px-2 text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={page}
                  size="sm"
                  variant={
                    table.getState().pagination.pageIndex === page - 1
                      ? "outline"
                      : "ghost"
                  }
                  onClick={() => table.setPageIndex(page - 1)}
                >
                  {page}
                </Button>
              ),
            )}
          </div>

          <Button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next <ArrowRight />
          </Button>
        </div>
      </Card>
    </>
  );
}

function ShortlistedCandidatesContent() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [interviewFilter, setInterviewFilter] = useState<
    "all" | Interview["status"]
  >("all");

  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: [Server_ROUTEMAP.jobs.root + Server_ROUTEMAP.jobs.getById, jobId],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getJobById>>(
        Server_ROUTEMAP.jobs.root +
          Server_ROUTEMAP.jobs.getById.replace(
            Server_ROUTEMAP.jobs._params.id,
            jobId!,
          ),
      ),
    enabled: !!jobId,
    retry: false,
  });

  const { data: interviews } = useQuery({
    queryKey: [
      Server_ROUTEMAP.interviews.root + Server_ROUTEMAP.interviews.getByJob,
      jobId,
    ],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getInterviewsByJobId>>(
        Server_ROUTEMAP.interviews.root +
          Server_ROUTEMAP.interviews.getByJob.replace(
            Server_ROUTEMAP.interviews._params.jobId,
            jobId!,
          ),
      ),
    enabled: !!jobId,
    retry: false,
  });

  const { data: applications, isLoading: isApplicationsLoading } = useQuery({
    queryKey: [
      Server_ROUTEMAP.applications.root + Server_ROUTEMAP.applications.getByJob,
      jobId,
    ],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getApplicationsByJobId>>(
        Server_ROUTEMAP.applications.root +
          Server_ROUTEMAP.applications.getByJob.replace(
            Server_ROUTEMAP.applications._params.jobId,
            jobId!,
          ),
      ),
    enabled: !!jobId,
    retry: false,
  });

  // Filter for shortlisted applications
  const shortlistedApplications = useMemo(() => {
    return (
      applications?.filter(
        (app) => app.status === "shortlisted" || app.status === "interview",
      ) || []
    );
  }, [applications]);

  const { data: candidates } = useQuery({
    queryKey: [
      Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.getById,
      shortlistedApplications?.map((a) => a.candidateId),
    ],
    queryFn: async () => {
      const candidateIds =
        shortlistedApplications?.map((a) => a.candidateId) || [];
      if (candidateIds.length === 0) return [];

      const candidatePromises = candidateIds.map((id) =>
        modifiedFetch<GetRes<typeof getUserById>>(
          Server_ROUTEMAP.users.root +
            Server_ROUTEMAP.users.getById.replace(
              Server_ROUTEMAP.users._params.id,
              id.toString(),
            ),
        ),
      );

      return await Promise.all(candidatePromises);
    },
    enabled: shortlistedApplications.length > 0,
    retry: false,
  });

  const shortlistedCandidates = useMemo(() => {
    if (!shortlistedApplications || !candidates) return [];

    return shortlistedApplications
      .map((app) => {
        const candidate = candidates.find((c) => c!.id === app.candidateId);
        const interview = interviews?.find((i) => i.applicationId === app.id);

        return {
          ...app,
          candidate,
          interview,
          interviewStatus: interview?.status as Interview["status"],
        };
      })
      .filter(
        (item) =>
          interviewFilter === "all" || item.interviewStatus === interviewFilter,
      )
      .sort(
        (a, b) =>
          new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime(),
      );
  }, [shortlistedApplications, candidates, interviews, interviewFilter]);

  if (isJobLoading || isApplicationsLoading) return <Loading />;

  if (!job) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Job not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/hr/jobs/${jobId}/applicants`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Applicants
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">
              Shortlisted Candidates
            </h1>
            <p className="text-gray-600">
              {job.title} · {shortlistedCandidates.length} candidate
              {shortlistedCandidates.length !== 1 ? "s" : ""}
            </p>
          </div>

          <Link
            to={`/hr/jobs/${jobId}/schedule-interviews`}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Schedule Interviews
          </Link>
        </div>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap gap-2 py-4 items-center">
          <span className="text-sm text-muted-foreground">
            Filter by interview status:
          </span>

          {(["all", "not_scheduled", "scheduled", "completed"] as const).map(
            (status) => (
              <Button
                key={status}
                size="sm"
                variant={interviewFilter === status ? "default" : "outline"}
                onClick={() => setInterviewFilter(status)}
                className={
                  interviewFilter === status
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : ""
                }
              >
                {status
                  .replace("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </Button>
            ),
          )}
        </CardContent>
      </Card>

      {/* Table */}
      {shortlistedCandidates.length > 0 ? (
        <ShortlistedTable data={shortlistedCandidates} jobId={jobId!} />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg text-gray-900 mb-2">
            No Shortlisted Candidates
          </h3>
          <p className="text-gray-600 mb-6">
            {interviewFilter === "all"
              ? "Start shortlisting candidates from the applicants list"
              : `No candidates with "${interviewFilter.replace("_", " ")}" status`}
          </p>
          <Link
            to={`${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.applicants.replace(Client_ROUTEMAP.hr._params.jobId, job.id.toString())}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Applicants
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function ShortlistedCandidates() {
  return (
    <ProtectedRoute allowedRoles={["hr"]} allowLoggedInOnly>
      <ShortlistedCandidatesContent />
    </ProtectedRoute>
  );
}
