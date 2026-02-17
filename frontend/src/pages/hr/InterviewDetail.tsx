import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  MapPin,
  Star,
  User as UserIcon,
  Video,
  XCircle,
} from "lucide-react";

import Loading from "@/components/shared/Loading";
import { API_URL, modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";
import { DashboardLayout } from "../../components/DashboardLayout";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { StatusBadge } from "../../components/StatusBadge";

import type {
  getApplicationsByJobId,
  updateApplicationStatus,
} from "@backend/controllers/application";
import type {
  addFeedback,
  addPreparationNotes,
  getInterviewByApplicationId,
} from "@backend/controllers/interview";
import type { getJobById } from "@backend/controllers/job";
import type { getUserById } from "@backend/controllers/user";
import type { GetReqBody, GetRes } from "@backend/types/req-res";

function InterviewDetailContent() {
  const { jobId, candidateId } = useParams<{
    jobId: string;
    candidateId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [preparationNotes, setPreparationNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [result, setResult] = useState<"pending" | "passed" | "failed">(
    "pending",
  );

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

  const { data: candidate, isLoading: isCandidateLoading } = useQuery({
    queryKey: [
      Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.getById,
      candidateId,
    ],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getUserById>>(
        Server_ROUTEMAP.users.root +
          Server_ROUTEMAP.users.getById.replace(
            Server_ROUTEMAP.users._params.id,
            candidateId!,
          ),
      ),
    enabled: !!candidateId,
    retry: false,
  });

  // First find the application
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

  const application = applications?.find(
    (app) => app.candidateId === parseInt(candidateId!),
  );

  const { data: interview, isLoading: isInterviewLoading } = useQuery({
    queryKey: [
      Server_ROUTEMAP.interviews.root +
        Server_ROUTEMAP.interviews.getByApplication,
      application?.id,
    ],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getInterviewByApplicationId>>(
        Server_ROUTEMAP.interviews.root +
          Server_ROUTEMAP.interviews.getByApplication.replace(
            Server_ROUTEMAP.interviews._params.applicationId,
            application!.id.toString(),
          ),
      ),
    enabled: !!application?.id,
    retry: false,
  });

  useEffect(() => {
    if (interview) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreparationNotes(interview.preparationNotes || "");
      setFeedback(interview.feedback || "");
      setRating(interview.rating || 0);
      setResult(interview.result || "pending");
    }
  }, [interview]);

  const { mutate: savePreparationNotes, isPending: isSavingNotes } =
    useMutation({
      mutationFn: () => {
        return modifiedFetch<GetRes<typeof addPreparationNotes>>(
          Server_ROUTEMAP.interviews.root +
            Server_ROUTEMAP.interviews.addPreparationNotes.replace(
              Server_ROUTEMAP.interviews._params.id,
              interview!.id.toString(),
            ),
          {
            method: "put",
            body: JSON.stringify({
              preparationNotes,
            } satisfies GetReqBody<typeof addPreparationNotes>),
          },
        );
      },
      onSuccess: (data) => {
        if (data) toast.success("Notes saved successfully");

        queryClient.invalidateQueries({
          queryKey: [
            Server_ROUTEMAP.interviews.root +
              Server_ROUTEMAP.interviews.getByApplication,
            application?.id,
          ],
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const { mutate: saveEvaluation, isPending: isSavingEvaluation } = useMutation(
    {
      mutationFn: () => {
        return modifiedFetch<GetRes<typeof addFeedback>>(
          Server_ROUTEMAP.interviews.root +
            Server_ROUTEMAP.interviews.addFeedback.replace(
              Server_ROUTEMAP.interviews._params.id,
              interview!.id.toString(),
            ),
          {
            method: "put",
            body: JSON.stringify({
              feedback,
              rating,
              result,
            } satisfies GetReqBody<typeof addFeedback>),
          },
        );
      },
      onSuccess: (data) => {
        if (data) toast.success("Evaluation saved successfully");

        queryClient.invalidateQueries({
          queryKey: [
            Server_ROUTEMAP.interviews.root +
              Server_ROUTEMAP.interviews.getByApplication,
            application?.id,
          ],
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    },
  );

  const { mutate: updateStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: (newStatus: "hired" | "rejected") => {
      return modifiedFetch<GetRes<typeof updateApplicationStatus>>(
        Server_ROUTEMAP.applications.root +
          Server_ROUTEMAP.applications.updateStatus.replace(
            Server_ROUTEMAP.applications._params.id,
            application!.id.toString(),
          ),
        {
          method: "put",
          body: JSON.stringify({
            status: newStatus,
          } satisfies GetReqBody<typeof updateApplicationStatus>),
        },
      );
    },
    onSuccess: (data, newStatus) => {
      if (data) toast.success(data.message);

      queryClient.invalidateQueries({
        queryKey: [
          Server_ROUTEMAP.applications.root +
            Server_ROUTEMAP.applications.getByJob,
          jobId,
        ],
      });

      if (newStatus === "hired") {
        toast.success("Candidate moved to selected!");
      } else {
        toast.success("Candidate has been rejected");
      }

      navigate(`/hr/jobs/${jobId}/applicants`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCopyLink = () => {
    if (interview?.meetingLink) {
      navigator.clipboard.writeText(interview.meetingLink);
      toast.success("Meeting link copied to clipboard!");
    }
  };

  const handleSaveNotes = () => {
    savePreparationNotes();
  };

  const handleSaveEvaluation = () => {
    saveEvaluation();
  };

  const handleMoveToSelected = () => {
    updateStatus("hired");
  };

  const handleReject = () => {
    updateStatus("rejected");
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

  if (
    isJobLoading ||
    isCandidateLoading ||
    isApplicationsLoading ||
    isInterviewLoading
  )
    return <Loading />;

  if (!job || !candidate || !application) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Interview not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const interviewStatus = interview?.status || "not_scheduled";

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/hr/jobs/${jobId}/shortlisted`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shortlisted Candidates
        </button>
        <h1 className="text-3xl text-gray-900 mb-2">Interview Management</h1>
        <p className="text-gray-600">{job.title}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1 - Candidate Profile */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg text-gray-900 mb-4">Candidate Profile</h2>

            <div className="flex flex-col items-center text-center mb-6">
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
                  className="w-24 h-24 rounded-full object-cover mb-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <UserIcon className="w-12 h-12 text-blue-600" />
                </div>
              )}
              <h3 className="text-xl text-gray-900 mb-1">{candidate.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{candidate.email}</p>
              <StatusBadge status={application.status} />
            </div>

            <div className="space-y-4 border-t border-gray-200 pt-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Contact</p>
                <p className="text-sm text-gray-900">
                  {candidate.phone || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Application Date</p>
                <p className="text-sm text-gray-900">
                  {new Date(application.appliedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              {candidate.cvUrl && (
                <a
                  href={
                    API_URL +
                    Server_ROUTEMAP.uploads.root +
                    Server_ROUTEMAP.uploads.cv +
                    "/" +
                    candidate.cvUrl
                  }
                  download
                  target="_blank"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Resume</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Section 2 - Interview Details & Join */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-gray-900">Interview Details</h2>
              <StatusBadge status={interviewStatus && "active"} />
            </div>

            {interview && interview.interviewDate && (
              <div className="space-y-6">
                {/* Date and Time */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
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
                        {interview.duration || 60} min
                      </p>
                    </div>
                  </div>
                  {isInterviewUpcoming() && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-sm text-blue-700">
                        Starts {getCountdownTime()}
                      </p>
                    </div>
                  )}
                </div>

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

                {/* Meeting Link */}
                {interview.type === "virtual" && interview.meetingLink && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1">
                          Meeting Link
                        </p>
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

                {/* Interview Type */}
                <div className="space-y-3">
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
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3 - Interview Notes & Evaluation */}
        <div className="space-y-6">
          {/* Preparation Notes */}
          {interview && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg text-gray-900 mb-4">Preparation Notes</h2>
              <p className="text-sm text-gray-600 mb-3">
                Add notes to prepare for the interview
              </p>
              <textarea
                value={preparationNotes}
                onChange={(e) => setPreparationNotes(e.target.value)}
                placeholder="What topics to cover, specific questions to ask, areas to focus on..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={6}
              />
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isSavingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>
          )}

          {/* Interview Feedback & Evaluation */}
          {interview && interview.status !== "not_scheduled" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg text-gray-900 mb-4">
                Interview Evaluation
              </h2>

              {/* Rating */}
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2">
                  Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Technical skills, communication, problem-solving, cultural fit..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={6}
                />
              </div>

              {/* Result */}
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={result}
                  onChange={(e) =>
                    setResult(e.target.value as "pending" | "passed" | "failed")
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Save Evaluation */}
              <button
                onClick={handleSaveEvaluation}
                disabled={isSavingEvaluation}
                className="w-full mb-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isSavingEvaluation ? "Saving..." : "Save Evaluation"}
              </button>

              {/* Final Decision Actions */}
              {result === "passed" && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <button
                    onClick={handleMoveToSelected}
                    disabled={isUpdatingStatus}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Move to Selected
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isUpdatingStatus}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}

              {result === "failed" && (
                <button
                  onClick={handleReject}
                  disabled={isUpdatingStatus}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Candidate
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function InterviewDetail() {
  return (
    <ProtectedRoute allowedRoles={["hr"]} allowLoggedInOnly>
      <InterviewDetailContent />
    </ProtectedRoute>
  );
}
