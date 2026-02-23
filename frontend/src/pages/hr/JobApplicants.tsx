import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Download,
  User as UserIcon,
  Users,
} from "lucide-react";

import Loading from "@/components/shared/Loading";
import { getPageRange } from "@/misc";
import { API_URL, modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";
import { DashboardLayout } from "../../components/DashboardLayout";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { StatusBadge } from "../../components/StatusBadge";
import Client_ROUTEMAP from "../../misc/Client_ROUTEMAP";
import { RankedCandidates } from "./RankedCandidates";

import type {
  getApplicationsByJobId,
  updateApplicationStatus,
} from "@backend/controllers/application";
import type { getJobById } from "@backend/controllers/job";
import type { getUserById } from "@backend/controllers/user";
import type { Application } from "@backend/models/Application";
import type { UserWithOutPassword } from "@backend/models/User";
import type { GetReqBody, GetRes } from "@backend/types/req-res";

type ApplicantWithCandidate = Application & {
  candidate?: UserWithOutPassword;
};

const columnHelper = createColumnHelper<ApplicantWithCandidate>();

function ApplicantsTable({
  applicants,
  onStatusChange,
  isPending,
}: {
  applicants: ApplicantWithCandidate[];
  onStatusChange: (appId: number, newStatus: Application["status"]) => void;
  isPending: boolean;
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
                onStatusChange(row.id, value as Application["status"])
              }
              disabled={isPending || row.status === "hired"}
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
                  .replace(
                    Client_ROUTEMAP.hr._params.jobId,
                    row.jobId.toString(),
                  )
                  .replace(
                    Client_ROUTEMAP.hr._params.candidateId,
                    row.candidateId.toString(),
                  )}`}
                className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View Profile
              </Link>
              {row.candidate?.cvUrl && (
                <a
                  href={
                    API_URL +
                    Server_ROUTEMAP.uploads.root +
                    Server_ROUTEMAP.uploads.cv +
                    "/" +
                    row.candidate.cvUrl
                  }
                  download
                  target="_blank"
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}
            </div>
          );
        },
      }),
    ],
    [onStatusChange, isPending],
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
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<
    "all" | Application["status"]
  >("all");

  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: [Server_ROUTEMAP.jobs.root + Server_ROUTEMAP.jobs.getById, id],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getJobById>>(
        Server_ROUTEMAP.jobs.root +
          Server_ROUTEMAP.jobs.getById.replace(
            Server_ROUTEMAP.jobs._params.id,
            id!,
          ),
      ),
    enabled: !!id,
    retry: false,
  });

  const { data: applications, isLoading: isApplicationsLoading } = useQuery({
    queryKey: [
      Server_ROUTEMAP.applications.root + Server_ROUTEMAP.applications.getByJob,
      id,
    ],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getApplicationsByJobId>>(
        Server_ROUTEMAP.applications.root +
          Server_ROUTEMAP.applications.getByJob.replace(
            Server_ROUTEMAP.applications._params.jobId,
            id!,
          ),
      ),
    enabled: !!id,
    retry: false,
  });

  const { data: candidates } = useQuery({
    queryKey: [
      Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.getById,
      applications?.map((a) => a.candidateId),
    ],
    queryFn: async () => {
      const candidateIds = applications?.map((a) => a.candidateId) || [];
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
    enabled: !!applications && applications.length > 0,
    retry: false,
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({
      appId,
      newStatus,
    }: {
      appId: number;
      newStatus: Application["status"];
    }) => {
      return modifiedFetch<GetRes<typeof updateApplicationStatus>>(
        Server_ROUTEMAP.applications.root +
          Server_ROUTEMAP.applications.updateStatus.replace(
            Server_ROUTEMAP.applications._params.id,
            appId.toString(),
          ),
        {
          method: "put",
          body: JSON.stringify({
            status: newStatus,
          } satisfies GetReqBody<typeof updateApplicationStatus>),
        },
      );
    },
    onSuccess: (data) => {
      if (data) toast.success(data.message);

      queryClient.invalidateQueries({
        queryKey: [
          Server_ROUTEMAP.applications.root +
            Server_ROUTEMAP.applications.getByJob,
          id,
        ],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const applicants = useMemo(() => {
    if (!applications || !candidates) return [];

    return applications
      .filter((a) => statusFilter === "all" || a.status === statusFilter)
      .map((app) => ({
        ...app,
        candidate: candidates.find((c) => c!.id === app.candidateId),
      }))
      .sort(
        (a, b) =>
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
      );
  }, [applications, candidates, statusFilter]);

  const handleStatusChange = (
    appId: number,
    newStatus: Application["status"],
  ) => {
    updateStatus({ appId, newStatus });
  };

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
          <Link
            to={`${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.shortListed.replace(Client_ROUTEMAP.hr._params.jobId, job.id.toString())}`}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Users className="w-5 h-5" />
            Shortlisted Candidates
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-2">
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
      <p className={`${candidates?.length === 0 ? "hidden" : ""} py-4`}>
        <RankedCandidates jobId={job.id} />
      </p>

      {/* Applicants Table */}
      <ApplicantsTable
        applicants={applicants}
        onStatusChange={handleStatusChange}
        isPending={isPending}
      />
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
