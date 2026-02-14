import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatusBadge } from "../../components/StatusBadge";
import { Plus, ArrowLeft, ArrowRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { getPageRange } from "@/misc";
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { AddHRUserModal } from "@/components/admin/AddHrUserModal";
import { EditHRUserModal } from "@/components/admin/EditHrUserModal";
import { DeleteHRUserModal } from "@/components/admin/DeleteHrUserModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Loading from "@/components/shared/Loading";
import { modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";

import type { getAllUsers } from "@backend/controllers/user";
import type { User } from "@backend/models/User";
import type { GetRes } from "@backend/types/req-res";

const columnHelper = createColumnHelper<User>();

function HRTable({
  hrUsers,
  onToggleStatus,
}: {
  hrUsers: User[];
  onToggleStatus: (hrId: number) => void;
}) {
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => (
          <span className="text-gray-900">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => (
          <span className="text-gray-600">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("department", {
        header: "Department",
        cell: (info) => (
          <span className="text-gray-600">{info.getValue() || "-"}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        cell: (info) =>
          new Date(info.getValue()).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-left">Actions</div>,
        cell: (info) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-md p-2 hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start">
              {/* Edit HR User */}
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <EditHRUserModal hrId={info.row.original.id} />
              </DropdownMenuItem>

              {/* Activate / Deactivate */}
              <DropdownMenuItem
                className={
                  info.row.original.status === "active"
                    ? "text-orange-500 hover:bg-orange-100"
                    : "text-green-500 hover:bg-green-100"
                }
                onSelect={() => {
                  onToggleStatus(info.row.original.id);
                }}
              >
                {info.row.original.status === "active"
                  ? "Deactivate"
                  : "Activate"}
              </DropdownMenuItem>

              {/* Delete HR User */}
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <DeleteHRUserModal hrId={info.row.original.id} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    [onToggleStatus],
  );

  const table = useReactTable({
    data: hrUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  return (
    <div className="relative">
      {hrUsers.length > 0 ? (
        <>
          <Card className="bg-white p-10">
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
          <h3 className="text-lg text-gray-900 mb-2">No HR Users Yet</h3>
        </div>
      )}
    </div>
  );
}

function HRManagementContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">(
    "all",
  );

  const { data: allUsers, isLoading } = useQuery({
    queryKey: [Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.get],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getAllUsers>>(
        Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.get,
      ),
    retry: false,
  });

  const hrUsers = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter((u) => u.role === "hr") as User[];
  }, [allUsers]);

  const filteredHRUsers = useMemo(() => {
    return hrUsers
      .filter((hr) => {
        const matchesSearch =
          hr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          hr.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (hr.department &&
            hr.department.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus =
          statusFilter === "all" || hr.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [hrUsers, searchTerm, statusFilter]);

  const handleToggleStatus = (hrId: number) => {
    // This will be handled by the mutation in the modal/action
    console.log("Toggle status for HR:", hrId);
  };

  if (isLoading) return <Loading />;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">HR User Management</h1>
          <p className="text-gray-600">Manage HR users and their access</p>
        </div>
        <AddHRUserModal />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 py-4">
          <Input
            placeholder="Search HR users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-1/3"
          />

          <div className="flex flex-wrap gap-2">
            {(["all", "active", "closed"] as const).map((status) => (
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

      {/* HR Users Table */}
      <HRTable hrUsers={filteredHRUsers} onToggleStatus={handleToggleStatus} />
    </DashboardLayout>
  );
}

export default function HRManagement() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <HRManagementContent />
    </ProtectedRoute>
  );
}
