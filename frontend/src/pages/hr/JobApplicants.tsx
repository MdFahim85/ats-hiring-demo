import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatusBadge } from "../../components/StatusBadge";
import { mockJobs, mockApplications, mockUsers } from "../../lib/mockData";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  User as UserIcon,
  Users,
} from "lucide-react";
import Client_ROUTEMAP from "../../misc/Client_ROUTEMAP";
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
import type { ApplicationStatus } from "../../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const columnHelper = createColumnHelper<any>();

function ApplicantsTable({ applicants }: { applicants: any[] }) {
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
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.display({
        id: "changeStatus",
        header: "Change Status",
        cell: (info) => {
          const row = info.row.original;
          return (
            <Select
              value={row.status}
              onValueChange={(value: string) =>
                row.onStatusChange(value as ApplicationStatus)
              }
            >
              <SelectTrigger className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
              </SelectContent>
            </Select>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex justify-center gap-2">
              <Link
                to={`${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.candidateDetails
                  .replace(Client_ROUTEMAP.hr._params.jobId, row.jobId)
                  .replace(
                    Client_ROUTEMAP.hr._params.candidateId,
                    row.candidate.id,
                  )}`}
                className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View Profile
              </Link>
              {row.candidate.cvUrl && (
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: applicants,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  return applicants.length > 0 ? (
    <>
      <Card className="bg-white p-6">
        <Table className="[&_tr]:border-0">
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
  ) : (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg text-gray-900 mb-2">No Applicants Yet</h3>
      <p className="text-gray-600">Check back later for new applications</p>
    </div>
  );
}

function JobApplicantsContent() {
  const { jobId: id } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatus>(
    "all",
  );

  const [apps, setApps] = useState(mockApplications);

  const job = mockJobs.find((j) => j.id === id);

  const applicants = useMemo(() => {
    if (!job) return [];
    return apps
      .filter((a) => a.jobId === job.id)
      .filter((a) => statusFilter === "all" || a.status === statusFilter)
      .map((app) => {
        const candidate = mockUsers.find((u) => u.id === app.candidateId);
        return {
          ...app,
          candidate,
          onStatusChange: (newStatus: ApplicationStatus) => {
            setApps((prevApps) =>
              prevApps.map((a) =>
                a.id === app.id ? { ...a, status: newStatus } : a,
              ),
            );
          },
        };
      })
      .sort(
        (a, b) =>
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
      );
  }, [job, statusFilter, apps]);

  const shortlistedCount = useMemo(() => {
    if (!job) return 0;
    return mockApplications.filter(
      (app) => app.jobId === job.id && app.status === "shortlisted",
    ).length;
  }, [job]);

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() =>
              navigate(
                `${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.dashboard}`,
              )
            }
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl text-gray-900">{job.title}</h1>
          <p className="text-gray-600">{applicants.length} applicants</p>
        </div>
        <div>
          {shortlistedCount > 0 && (
            <Link
              to={`${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.shortListed.replace(Client_ROUTEMAP.hr._params.jobId, job.id)}`}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Users className="w-5 h-5" />
              Shortlisted Candidates
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap gap-2 py-4 items-center">
          <span className="text-sm text-muted-foreground">
            Filter by status:
          </span>
          {(
            [
              "all",
              "applied",
              "shortlisted",
              "interview",
              "rejected",
              "hired",
            ] as const
          ).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
              className={
                statusFilter === status
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : ""
              }
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Applicants Table */}
      <ApplicantsTable applicants={applicants} />
    </DashboardLayout>
  );
}

export default function JobApplicants() {
  return (
    <ProtectedRoute allowedRoles={["hr"]} allowLoggedInOnly>
      <JobApplicantsContent />
    </ProtectedRoute>
  );
}
