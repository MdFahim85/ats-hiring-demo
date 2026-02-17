// src/pages/candidate/InterviewDetails.tsx
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatusBadge } from "../../components/StatusBadge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  MapPin,
  Briefcase,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/shared/Loading";
import { modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";
import toast from "react-hot-toast";

import type { getApplicationById } from "@backend/controllers/application";
import type { getInterviewByApplicationId } from "@backend/controllers/interview";
import type { getJobById } from "@backend/controllers/job";
import type { GetRes } from "@backend/types/req-res";

function InterviewDetailsContent() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const { data: application, isLoading: isApplicationLoading } = useQuery({
    queryKey: [
      Server_ROUTEMAP.applications.root + Server_ROUTEMAP.applications.getById,
      applicationId,
    ],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getApplicationById>>(
        Server_ROUTEMAP.applications.root +
          Server_ROUTEMAP.applications.getById.replace(
            Server_ROUTEMAP.applications._params.id,
            applicationId!,
          ),
      ),
    enabled: !!applicationId,
    retry: false,
  });

  const { data: interview, isLoading: isInterviewLoading } = useQuery({
    queryKey: [
      Server_ROUTEMAP.interviews.root +
        Server_ROUTEMAP.interviews.getByApplication,
      applicationId,
    ],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getInterviewByApplicationId>>(
        Server_ROUTEMAP.interviews.root +
          Server_ROUTEMAP.interviews.getByApplication.replace(
            Server_ROUTEMAP.interviews._params.applicationId,
            applicationId!,
          ),
      ),
    enabled: !!applicationId,
    retry: false,
  });

  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: [
      Server_ROUTEMAP.jobs.root + Server_ROUTEMAP.jobs.getById,
      application?.jobId,
    ],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getJobById>>(
        Server_ROUTEMAP.jobs.root +
          Server_ROUTEMAP.jobs.getById.replace(
            Server_ROUTEMAP.jobs._params.id,
            application!.jobId.toString(),
          ),
      ),
    enabled: !!application?.jobId,
    retry: false,
  });

  const handleCopyLink = () => {
    if (interview?.meetingLink) {
      navigator.clipboard.writeText(interview.meetingLink);
      toast.success("Meeting link copied to clipboard!");
    }
  };

  const isInterviewUpcoming = () => {
    if (!interview?.interviewDate) return false;
    const interviewDateTime = new Date(interview.interviewDate);
    const now = new Date();
    return interviewDateTime > now;
  };

  const getCountdownTime = () => {
    if (!interview?.interviewDate) return null;
    const interviewDateTime = new Date(interview.interviewDate);
    const now = new Date();
    const diff = interviewDateTime.getTime() - now.getTime();

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `in ${days} day${days !== 1 ? "s" : ""}`;
    if (hours > 0) return `in ${hours} hour${hours !== 1 ? "s" : ""}`;
    return "starting soon";
  };

  if (isApplicationLoading || isInterviewLoading || isJobLoading)
    return <Loading />;

  if (!application || !interview || !job) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Interview not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Applications
        </Button>

        <h1 className="text-3xl text-gray-900 mb-2">Interview Details</h1>
        <p className="text-gray-600">{job.title}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Information */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Job Information</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Position</p>
                  <p className="text-sm text-gray-900">{job.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Department</p>
                  <p className="text-sm text-gray-900">{job.department}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Application Status</p>
                <StatusBadge status={application.status} />
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Applied Date</p>
                <p className="text-sm text-gray-900">
                  {new Date(application.appliedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interview Details */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Interview Details</h2>
              <StatusBadge status={interview.status || "scheduled"} />
            </div>

            {/* Date and Time */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="text-gray-900">
                    {new Date(interview.interviewDate).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      },
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-gray-900">
                    {interview.duration || 60} minutes
                  </p>
                </div>
              </div>

              {isInterviewUpcoming() && (
                <div className="pt-3 border-t border-blue-200">
                  <p className="text-sm text-blue-700">
                    Starts {getCountdownTime()}
                  </p>
                </div>
              )}
            </div>

            {/* Interview Type */}
            <div className="flex items-center gap-2">
              {interview.type === "virtual" ? (
                <Video className="w-5 h-5 text-gray-600" />
              ) : (
                <MapPin className="w-5 h-5 text-gray-600" />
              )}
              <div>
                <p className="text-xs text-gray-600">Type</p>
                <p className="text-sm text-gray-900 capitalize">
                  {interview.type?.replace("_", " ")}
                </p>
              </div>
            </div>

            {/* Meeting Link */}
            {interview.type === "virtual" && interview.meetingLink && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Meeting Link</p>
                    <p className="text-sm text-gray-900 break-all">
                      {interview.meetingLink}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Join Interview Button */}
            {isInterviewUpcoming() && interview.type === "virtual" && (
              <a
                href={interview.meetingLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Video className="w-5 h-5" />
                Join Interview
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preparation Tips */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            Interview Preparation Tips
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
              <p>Review the job description and requirements thoroughly</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
              <p>
                Prepare examples of your relevant experience and achievements
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
              <p>
                Test your internet connection and equipment if it's a virtual
                interview
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
              <p>
                Prepare questions to ask the interviewer about the role and
                company
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
              <p>
                Join the meeting 5-10 minutes early to avoid any technical
                issues
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export default function InterviewDetails() {
  return (
    <ProtectedRoute allowedRoles={["candidate"]} allowLoggedInOnly>
      <InterviewDetailsContent />
    </ProtectedRoute>
  );
}
