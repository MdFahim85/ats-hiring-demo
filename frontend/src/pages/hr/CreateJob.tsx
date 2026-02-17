import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles } from "lucide-react";

import { useUserContext } from "@/contexts/UserContext";
import { DashboardLayout } from "../../components/DashboardLayout";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import Client_ROUTEMAP from "../../misc/Client_ROUTEMAP";
import { modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";

import type { createJob } from "@backend/controllers/job";
import type { generateJobDescription } from "@backend/controllers/gemini";
import type { GetReqBody, GetRes } from "@backend/types/req-res";

function CreateJobContent() {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    department: "",
    description: "",
    requirements: "",
    deadline: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const { mutate: generateDescription, isPending: isGenerating } = useMutation({
    mutationFn: () => {
      return modifiedFetch<GetRes<typeof generateJobDescription>>(
        Server_ROUTEMAP.ai.root + Server_ROUTEMAP.ai.generateDesc,
        {
          method: "post",
          body: JSON.stringify({
            title: form.title,
            department: form.department,
            description: form.description,
            requirements: form.requirements,
            deadline: new Date(form.deadline),
          } satisfies GetReqBody<typeof createJob>),
        },
      );
    },
    onSuccess: (data) => {
      if (data)
        setForm((prev) => ({
          ...prev,
          description: data,
        }));
      toast.success("AI generated job description!");
    },
    onError: () => {
      toast.error("Failed to generate description");
    },
  });

  const { mutate: createJobMutation, isPending } = useMutation({
    mutationFn: (status: "draft" | "active") => {
      return modifiedFetch<GetRes<typeof createJob>>(
        Server_ROUTEMAP.jobs.root + Server_ROUTEMAP.jobs.post,
        {
          method: "post",
          body: JSON.stringify({
            title: form.title,
            department: form.department,
            description: form.description,
            requirements: form.requirements,
            deadline: new Date(form.deadline),
            status,
            hrId: user!.id,
          } satisfies GetReqBody<typeof createJob>),
        },
      );
    },
    onSuccess: (data, status) => {
      if (data) toast.success(data.message);

      queryClient.invalidateQueries({
        queryKey: [Server_ROUTEMAP.jobs.root + Server_ROUTEMAP.jobs.get],
      });

      if (status === "draft") {
        navigate(`${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.dashboard}`);
      } else {
        navigate(
          `${Client_ROUTEMAP.public.root}/${Client_ROUTEMAP.public.jobDetails.replace(
            Client_ROUTEMAP.public._params.jobId,
            data!.data.id.toString(),
          )}`,
        );
      }
    },
    onError: (error) => {
      error.message?.split(",")?.forEach((msg: string) => toast.error(msg));
    },
  });

  const handleSaveDraft = () => {
    createJobMutation("draft");
  };

  const handlePublish = () => {
    createJobMutation("active");
  };

  const isFormValid =
    form.title &&
    form.department &&
    form.description &&
    form.requirements &&
    form.deadline;

  const canGenerateDescription =
    form.title && form.department && form.requirements && form.deadline;

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
        <h1 className="text-3xl text-gray-900 mb-2">Create New Job</h1>
        <p className="text-gray-600">
          Fill in the details to post a new job opening
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Job Title *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="e.g. Senior Frontend Developer"
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
          <Label htmlFor="requirements">Requirements *</Label>
          <Textarea
            id="requirements"
            value={form.requirements}
            onChange={(e) => handleChange("requirements", e.target.value)}
            placeholder="List the required skills, experience, and qualifications."
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Job Description *</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Describe the role, responsibilities, and what the candidate will be working on..."
            rows={6}
          />
          <Button
            type="button"
            onClick={() => generateDescription()}
            disabled={!canGenerateDescription || isGenerating}
            variant="outline"
            className="whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating description..." : "Generate with AI"}
          </Button>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="deadline"
            className="block text-sm text-gray-700 mb-2"
          >
            Application Deadline *
          </Label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            required
            value={form.deadline}
            onChange={(e) => handleChange("deadline", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
          <Button
            onClick={handleSaveDraft}
            disabled={!isFormValid || isPending}
            variant="outline"
          >
            {isPending ? "Saving..." : "Save as Draft"}
          </Button>
          <Button onClick={handlePublish} disabled={!isFormValid || isPending}>
            {isPending ? "Publishing..." : "Publish Job"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CreateJob() {
  return (
    <ProtectedRoute allowedRoles={["hr"]} allowLoggedInOnly>
      <CreateJobContent />
    </ProtectedRoute>
  );
}
