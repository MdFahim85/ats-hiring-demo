import { useParams, useNavigate, Link } from "react-router";
import { useMemo, useState } from "react";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { DashboardLayout } from "../../components/DashboardLayout";
import {
  mockJobs,
  mockApplications,
  mockUsers,
  mockInterviews,
} from "../../lib/mockData";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  User as UserIcon,
  Users,
} from "lucide-react";
import type { InterviewStatus } from "../../types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPageRange } from "@/misc";
import Client_ROUTEMAP from "@/misc/Client_ROUTEMAP";

const columnHelper = createColumnHelper<any>();

function ShortlistedTable({ data, jobId }: { data: any[]; jobId: string }) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("candidate", {
        header: "Candidate",
        cell: (info) => {
          const candidate = info.getValue();
          return (
            <div className="flex items-center gap-3">
              {candidate.profilePicture ? (
                <img
                  src={candidate.profilePicture}
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
                    ? `/hr/jobs/${jobId}/interviews/${row.candidate.id}`
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
    "all" | InterviewStatus
  >("all");

  const job = mockJobs.find((j) => j.id === jobId);

  const shortlistedCandidates = useMemo(() => {
    if (!job) return [];

    return mockApplications
      .filter((app) => app.jobId === job.id && app.status === "shortlisted")
      .map((app) => {
        const candidate = mockUsers.find((u) => u.id === app.candidateId);
        const interview = mockInterviews.find(
          (i) => i.applicationId === app.id,
        );

        return {
          ...app,
          candidate,
          interview,
          interviewStatus: interview?.status || "not_scheduled",
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
  }, [job, interviewFilter]);

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

          {shortlistedCandidates.length > 0 && (
            <Link
              to={`/hr/jobs/${jobId}/schedule-interviews`}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              Schedule Interviews
            </Link>
          )}
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
            to={`${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.applicants.replace(Client_ROUTEMAP.hr._params.jobId, job.id)}`}
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
