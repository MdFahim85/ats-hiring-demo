import { useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router";
import { PublicHeader } from "../components/PublicHeader";
import { mockJobs, mockApplications } from "../lib/mockData";
import { useAuth } from "../contexts/AuthContext";
import { Calendar, Briefcase, ArrowLeft, Check, Edit } from "lucide-react";
import Client_ROUTEMAP from "../misc/Client_ROUTEMAP";
import Navbar from "../components/Navbar";
import { ShareButton } from "../components/ShareButton";

export default function JobDetail() {
  const { jobId: id } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const job = mockJobs.find((j) => j.id === id);

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

  // Check if user already applied
  const hasApplied =
    user &&
    user.role === "candidate" &&
    mockApplications.some(
      (app) => app.jobId === job.id && app.candidateId === user.id,
    );

  const handleApply = () => {
    if (!user) {
      navigate(`${Client_ROUTEMAP.auth.root}/${Client_ROUTEMAP.auth.login}`);
      return;
    }

    setIsApplying(true);
    // Simulate application submission
    setTimeout(() => {
      mockApplications.push({
        id: `app-${Date.now()}`,
        jobId: job.id,
        candidateId: user.id,
        status: "applied",
        appliedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setIsApplying(false);
      setApplied(true);
    }, 1000);
  };

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
                    job.id,
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
