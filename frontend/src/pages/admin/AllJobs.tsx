import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatusBadge } from "../../components/StatusBadge";
import { Users, ArrowLeft, ArrowRight, Plus } from "lucide-react";
import Client_ROUTEMAP from "../../misc/Client_ROUTEMAP";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { getPageRange } from "@/misc";
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import Loading from "@/components/shared/Loading";
import { modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";

import type { getAllJobs } from "@backend/controllers/job";
import type { getAllApplications } from "@backend/controllers/application";
import type { Job } from "@backend/models/Job";
import type { GetRes } from "@backend/types/req-res";

type JobWithCount = Job & { applicantCount: number };

const columnHelper = createColumnHelper<JobWithCount>();

function JobsTable({ jobs }: { jobs: JobWithCount[] }) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Job Title",
        cell: (info) => (
          <Link
            to={`${Client_ROUTEMAP.public.root}/${Client_ROUTEMAP.public.jobDetails.replace(Client_ROUTEMAP.public._params.jobId, info.row.original.id.toString())}`}
            className="text-gray-900 hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("department", {
        header: "Department",
        cell: (info) => (
          <span className="text-gray-600 space-y-4">{info.getValue()}</span>
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
            <Table className="border-separate border-spacing-y-4 [&_tr]:border-0">
              <TableHeader className="bg-neutral-50">
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

function AllJobsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "closed" | "draft"
  >("all");

  const { data: jobs, isLoading: isJobsLoading } = useQuery({
    queryKey: [Server_ROUTEMAP.jobs.root + Server_ROUTEMAP.jobs.get],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getAllJobs>>(
        Server_ROUTEMAP.jobs.root + Server_ROUTEMAP.jobs.get,
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

  const jobsWithCount = useMemo(() => {
    if (!jobs || !applications) return [];

    return jobs.map((job) => ({
      ...job,
      applicantCount: applications.filter((app) => app.jobId === job.id).length,
    }));
  }, [jobs, applications]);

  const filteredJobs = useMemo(() => {
    return jobsWithCount
      .filter((job) => {
        const matchesSearch =
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.department.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || job.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [jobsWithCount, searchTerm, statusFilter]);

  if (isJobsLoading || isApplicationsLoading) return <Loading />;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">All Jobs</h1>
          <p className="text-gray-600">
            Complete list of job postings across all HR users
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 py-4">
          <Input
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-1/3"
          />

          <div className="flex flex-wrap gap-2">
            {(["all", "active", "closed", "draft"] as const).map((status) => (
              <Button
                key={status}
                size="sm"
                variant={statusFilter === status ? "default" : "outline"}
                className={
                  statusFilter === status
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : ""
                }
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <JobsTable jobs={filteredJobs} />
    </DashboardLayout>
  );
}

export default function AllJobs() {
  return (
    <ProtectedRoute allowedRoles={["admin"]} allowLoggedInOnly>
      <AllJobsContent />
    </ProtectedRoute>
  );
}
