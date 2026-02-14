import { useState, useMemo } from "react";
import { Link } from "react-router";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatusBadge } from "../../components/StatusBadge";
import { mockJobs } from "../../lib/mockData";
import {
  Plus,
  Users,
  Edit,
  Eye,
  Briefcase,
  BriefcaseBusiness,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import Client_ROUTEMAP from "../../misc/Client_ROUTEMAP";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPageRange } from "@/misc";
import { useUserContext } from "@/contexts/UserContext";

const columnHelper = createColumnHelper<(typeof mockJobs)[0]>();

function JobsTable({ jobs }: { jobs: typeof mockJobs }) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Job Title",
        cell: (info) => (
          <Link
            to={`${Client_ROUTEMAP.public.root}/${Client_ROUTEMAP.public.jobDetails.replace(Client_ROUTEMAP.public._params.jobId, info.row.original.id)}`}
            className="text-gray-900 hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("department", {
        header: "Department",
        cell: (info) => (
          <span className="text-gray-600">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor("applicantCount", {
        header: "Applicants",
        cell: (info) => (
          <div className="flex items-center gap-1 text-gray-900">
            <Users className="w-4 h-4 text-gray-400" /> {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("deadline", {
        header: "Deadline",
        cell: (info) =>
          new Date(info.getValue()).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <div className="flex items-center gap-4 justify-start">
            <Link
              to={`${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.applicants.replace(Client_ROUTEMAP.hr._params.jobId, info.row.original.id)}`}
              className="text-blue-600 hover:bg-blue-50 rounded-lg transition-colors py-4"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <Link
              to={`${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.editJob.replace(Client_ROUTEMAP.hr._params.jobId, info.row.original.id)}`}
              className="text-gray-600 hover:bg-gray-100 rounded-lg transition-colors py-4"
            >
              <Edit className="w-4 h-4" />
            </Link>
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: jobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  return (
    <div className="relative">
      {jobs.length > 0 ? (
        <>
          <Card className=" bg-white p-10">
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          {/* Pagination with getPageRange */}
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
          <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg text-gray-900 mb-2">No Jobs Yet</h3>
        </div>
      )}
    </div>
  );
}

function HRDashboardContent() {
  const { user } = useUserContext();
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "closed" | "draft"
  >("all");

  const myJobs = useMemo(() => {
    if (!user) return [];

    return mockJobs
      .filter((job) => job.hrId === user.id.toString())
      .filter((job) => statusFilter === "all" || job.status === statusFilter)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [user, statusFilter]);

  const stats = useMemo(() => {
    if (!user) return { total: 0, active: 0, totalApplicants: 0 };

    const userJobs = mockJobs.filter((job) => job.hrId === user.id.toString());
    const total = userJobs.length;
    const active = userJobs.filter((job) => job.status === "active").length;
    const totalApplicants = userJobs.reduce(
      (sum, job) => sum + job.applicantCount,
      0,
    );

    return { total, active, totalApplicants };
  }, [user]);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Job Postings</h1>
          <p className="text-gray-600">
            Manage your job listings and review applicants
          </p>
        </div>
        <Link
          to={`${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.createJob}`}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Total Jobs */}
        <div className="w-full bg-blue-50 border border-gray-200 rounded-lg">
          <div className="p-6 flex items-center gap-4">
            <div className="bg-blue-600 text-white p-3 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Jobs</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="w-full bg-green-50 border border-gray-200 rounded-lg">
          <div className="p-6 flex items-center gap-4">
            <div className="bg-green-600 text-white p-3 rounded-lg">
              <BriefcaseBusiness className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Jobs</p>
              <p className="text-2xl font-semibold text-green-700">
                {stats.active}
              </p>
            </div>
          </div>
        </div>

        {/* Total Applicants */}
        <div className="w-full bg-purple-50 border border-gray-200 rounded-lg">
          <div className="p-6 flex items-center gap-4">
            <div className="bg-purple-600 text-white p-3 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Applicants</p>
              <p className="text-2xl font-semibold text-purple-700">
                {stats.totalApplicants}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 py-4">
          <span className="text-sm text-muted-foreground">
            Filter by status
          </span>

          <div className="flex flex-wrap gap-2">
            {(["all", "active", "closed", "draft"] as const).map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
                className={
                  statusFilter === status
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : ""
                }
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <JobsTable jobs={myJobs} />
    </DashboardLayout>
  );
}

export default function HRDashboard() {
  return (
    <ProtectedRoute allowedRoles={["hr"]} allowLoggedInOnly>
      <HRDashboardContent />
    </ProtectedRoute>
  );
}
