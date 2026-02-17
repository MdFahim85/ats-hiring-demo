import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

import { DashboardLayout } from "../../components/DashboardLayout";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import Client_ROUTEMAP from "../../misc/Client_ROUTEMAP";
import Loading from "@/components/shared/Loading";
import { modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";

import type { getJobById } from "@backend/controllers/job";
import type { updateJob } from "@backend/controllers/job";
import type { GetReqBody, GetRes } from "@backend/types/req-res";

function EditJobContent() {
  const { jobId: id } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    department: "",
    description: "",
    requirements: "",
    deadline: "",
    status: "active" as "active" | "closed" | "draft",
  });

  const { data: job, isLoading } = useQuery({
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

  useEffect(() => {
    if (job) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        title: job.title,
        department: job.department,
        description: job.description,
        requirements: job.requirements,
        deadline: job.deadline.toISOString(),
        status: job.status,
      });
    }
  }, [job]);

  const { mutate: updateJobMutation, isPending } = useMutation({
    mutationFn: () => {
      return modifiedFetch<GetRes<typeof updateJob>>(
        Server_ROUTEMAP.jobs.root +
          Server_ROUTEMAP.jobs.put.replace(
            Server_ROUTEMAP.jobs._params.id,
            id!,
          ),
        {
          method: "put",
          body: JSON.stringify({
            title: form.title,
            department: form.department,
            description: form.description,
            requirements: form.requirements,
            deadline: new Date(form.deadline),
            status: form.status,
          } satisfies GetReqBody<typeof updateJob>),
        },
      );
    },
    onSuccess: (data) => {
      if (data) toast.success(data.message);

      queryClient.invalidateQueries({
        queryKey: [Server_ROUTEMAP.jobs.root + Server_ROUTEMAP.jobs.get],
      });

      navigate(`${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.dashboard}`);
    },
    onError: (error) => {
      error.message?.split(",")?.forEach((msg: string) => toast.error(msg));
    },
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    updateJobMutation();
  };

  if (isLoading) return <Loading />;

  const isFormValid =
    form.title &&
    form.department &&
    form.description &&
    form.requirements &&
    form.deadline;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="link"
          onClick={() =>
            navigate(
              `${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.dashboard}`,
            )
          }
          className="flex items-center gap-2 text-gray-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl text-gray-900 mb-2">Edit Job</h1>
        <p className="text-gray-600">Update job posting details</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Job Title *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Select
            value={form.department}
            onValueChange={(value: string) => handleChange("department", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a department" />
            </SelectTrigger>
            <SelectContent>
              {[
                "Engineering",
                "Design",
                "Marketing",
                "Sales",
                "Product",
                "Analytics",
                "Operations",
              ].map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={form.status}
            onValueChange={(value: string) => handleChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {["draft", "active", "closed"].map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Job Description *</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="requirements">Requirements *</Label>
          <Textarea
            id="requirements"
            value={form.requirements}
            onChange={(e) => handleChange("requirements", e.target.value)}
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline">Application Deadline *</Label>
          <Input
            id="deadline"
            type="date"
            value={form.deadline}
            onChange={(e) => handleChange("deadline", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
          <Button
            onClick={() =>
              navigate(
                `${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.dashboard}`,
              )
            }
            variant="outline"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid || isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function EditJob() {
  return (
    <ProtectedRoute allowedRoles={["hr"]} allowLoggedInOnly>
      <EditJobContent />
    </ProtectedRoute>
  );
}
