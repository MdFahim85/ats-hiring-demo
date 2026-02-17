import { useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { PublicHeader } from "../components/PublicHeader";
import { Calendar, Briefcase, ArrowLeft, Check, Edit } from "lucide-react";
import Client_ROUTEMAP from "../misc/Client_ROUTEMAP";
import Navbar from "../components/Navbar";
import { ShareButton } from "../components/ShareButton";
import { useUserContext } from "@/contexts/UserContext";
import Loading from "@/components/shared/Loading";
import { modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";

import type { getPublicJobById } from "@backend/controllers/job";
import type { createApplication } from "@backend/controllers/application";
import type { getApplicationsByCandidateId } from "@backend/controllers/application";
import type { GetReqBody, GetRes } from "@backend/types/req-res";

export default function JobDetail() {
  const { jobId: id } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserContext();
  const queryClient = useQueryClient();
  const [applied, setApplied] = useState(false);

  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: [
      Server_ROUTEMAP.jobs.root + Server_ROUTEMAP.jobs.getPublicById,
      id,
    ],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getPublicJobById>>(
        Server_ROUTEMAP.jobs.root +
          Server_ROUTEMAP.jobs.getPublicById.replace(
            Server_ROUTEMAP.jobs._params.id,
            id!,
          ),
      ),
    enabled: !!id,
    retry: false,
  });

  const { data: candidateApplications } = useQuery({
    queryKey: [
      Server_ROUTEMAP.applications.root +
        Server_ROUTEMAP.applications.getByCandidate,
      user?.id,
    ],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getApplicationsByCandidateId>>(
        Server_ROUTEMAP.applications.root +
          Server_ROUTEMAP.applications.getByCandidate.replace(
            Server_ROUTEMAP.applications._params.candidateId,
            user!.id.toString(),
          ),
      ),
    enabled: !!user && user.role === "candidate",
    retry: false,
  });

  const { mutate: submitApplication, isPending: isApplying } = useMutation({
    mutationFn: () => {
      return modifiedFetch<GetRes<typeof createApplication>>(
        Server_ROUTEMAP.applications.root + Server_ROUTEMAP.applications.post,
        {
          method: "post",
          body: JSON.stringify({
            jobId: parseInt(id!),
            candidateId: user!.id,
            status: "applied",
          } satisfies GetReqBody<typeof createApplication>),
        },
      );
    },
    onSuccess: (data) => {
      if (data) toast.success(data.message);

      queryClient.invalidateQueries({
        queryKey: [
          Server_ROUTEMAP.applications.root +
            Server_ROUTEMAP.applications.getByCandidate,
          user?.id,
        ],
      });

      setApplied(true);
    },
    onError: (error) => {
      error.message?.split(",")?.forEach((msg: string) => toast.error(msg));
    },
  });

  const handleApply = () => {
    if (!user) {
      navigate(`${Client_ROUTEMAP.auth.root}/${Client_ROUTEMAP.auth.login}`);
      return;
    }

    submitApplication();
  };

  if (isJobLoading) return <Loading />;

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        {user ? <Navbar /> : <PublicHeader />}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600">Job not found</p>
          <Link
            to={Client_ROUTEMAP._.root}
            className="text-blue-600 hover:text-blue-700 mt-4 inline-block"
          >
            Back to job board
          </Link>
        </div>
      </div>
    );
  }

  const deadlineDate = new Date(job.deadline);
  const formattedDeadline = deadlineDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const hasApplied = candidateApplications?.some(
    (app) => app.jobId === parseInt(id!),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? <Navbar /> : <PublicHeader />}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(Client_ROUTEMAP._.root)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all jobs
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {/* Header */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl text-gray-900 mb-4">{job.title}</h1>
              {user && job.hrId === user.id && (
                <Link
                  to={`${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.editJob.replace(
                    Client_ROUTEMAP.hr._params.jobId,
                    job.id.toString(),
                  )}`}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit Job"
                >
                  <Edit className="size-5" />
                </Link>
              )}
            </div>

            <div className="flex items-center gap-6 text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                <span>{job.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>Apply by {formattedDeadline}</span>
              </div>
            </div>

            {/* Apply Button */}
            {!user || user?.role === "candidate" ? (
              job.status === "active" && !hasApplied && !applied ? (
                <button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                >
                  {isApplying ? "Submitting..." : "Apply Now"}
                </button>
              ) : hasApplied || applied ? (
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 rounded-lg">
                  <Check className="w-5 h-5" />
                  Application Submitted
                </div>
              ) : (
                <div className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-600 rounded-lg">
                  This position is closed
                </div>
              )
            ) : null}

            <ShareButton
              url={location.pathname}
              title={`Checkout this job: ${job.title}`}
            />
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl text-gray-900 mb-4">About the Role</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          <div>
            <h2 className="text-xl text-gray-900 mb-4">Requirements</h2>
            <div className="text-gray-700 whitespace-pre-line">
              {job.requirements}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
