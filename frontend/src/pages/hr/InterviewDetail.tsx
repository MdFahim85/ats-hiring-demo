import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatusBadge } from "../../components/StatusBadge";
import {
  mockJobs,
  mockApplications,
  mockUsers,
  mockInterviews,
} from "../../lib/mockData";
import {
  ArrowLeft,
  Download,
  Video,
  MapPin,
  Clock,
  Calendar,
  Copy,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  Star,
} from "lucide-react";

function InterviewDetailContent() {
  const { jobId, candidateId } = useParams<{
    jobId: string;
    candidateId: string;
  }>();
  const navigate = useNavigate();

  const job = mockJobs.find((j) => j.id === jobId);
  const candidate = mockUsers.find(
    (u) => u.id === candidateId && u.role === "candidate",
  );
  const application = mockApplications.find(
    (app) => app.jobId === jobId && app.candidateId === candidateId,
  );
  const interview = mockInterviews.find(
    (int) => int.jobId === jobId && int.candidateId === candidateId,
  );

  const [preparationNotes, setPreparationNotes] = useState(
    interview?.preparationNotes || "",
  );
  const [feedback, setFeedback] = useState(interview?.feedback || "");
  const [rating, setRating] = useState(interview?.rating || 0);
  const [result, setResult] = useState(interview?.result || "pending");
  const [isSaved, setIsSaved] = useState(false);

  if (!job || !candidate || !application) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Interview not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleCopyLink = () => {
    if (interview?.meetingLink) {
      navigator.clipboard.writeText(interview.meetingLink);
      alert("Meeting link copied to clipboard!");
    }
  };

  const handleSaveNotes = () => {
    // Mock save logic
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSaveEvaluation = () => {
    // Mock save logic
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleMoveToSelected = () => {
    // Mock logic - in real app, this would update the application status
    application.status = "hired";
    alert("Candidate moved to selected!");
    navigate(`/hr/jobs/${jobId}/applicants`);
  };

  const handleReject = () => {
    // Mock logic - in real app, this would update the application status
    application.status = "rejected";
    alert("Candidate has been rejected.");
    navigate(`/hr/jobs/${jobId}/applicants`);
  };

  const handleReschedule = () => {
    navigate(`/hr/jobs/${jobId}/schedule-interviews`);
  };

  const getSkills = () => {
    const skillsMap: Record<string, string[]> = {
      "candidate-1": ["React", "TypeScript", "CSS", "Node.js", "GraphQL"],
      "candidate-2": ["React", "Python", "AWS", "System Design", "PostgreSQL"],
      "candidate-3": [
        "JavaScript",
        "Vue.js",
        "TypeScript",
        "Testing",
        "Docker",
      ],
    };
    return skillsMap[candidateId || ""] || [];
  };

  const getExperience = () => {
    return "5+ years in frontend development with focus on React and TypeScript. Previously worked at tech startups building scalable web applications.";
  };

  const isInterviewUpcoming = () => {
    if (!interview?.date || !interview?.time) return false;
    const interviewDateTime = new Date(`${interview.date}T${interview.time}`);
    const now = new Date();
    return interviewDateTime > now;
  };

  const getCountdownTime = () => {
    if (!interview?.date || !interview?.time) return null;
    const interviewDateTime = new Date(`${interview.date}T${interview.time}`);
    const now = new Date();
    const diff = interviewDateTime.getTime() - now.getTime();

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `in ${days} day${days !== 1 ? "s" : ""}`;
    if (hours > 0) return `in ${hours} hour${hours !== 1 ? "s" : ""}`;
    return "starting soon";
  };

  const skills = getSkills();
  const experience = getExperience();
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
                  src={candidate.profilePicture}
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
                <p className="text-xs text-gray-600 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Experience</p>
                <p className="text-sm text-gray-900">{experience}</p>
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
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Download Resume</span>
                </button>
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

            {interview && interview.date && interview.time ? (
              <div className="space-y-6">
                {/* Date and Time */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="text-gray-900">
                        {new Date(interview.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="text-gray-900">
                        {interview.time} ({interview.duration} min)
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
                    href={interview.meetingLink}
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

                {/* Interview Type and Interviewer */}
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

                  {interview.interviewer && (
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Interviewer</p>
                        <p className="text-sm text-gray-900">
                          {interview.interviewer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleReschedule}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Reschedule
                  </button>
                  <button className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  Interview not scheduled yet
                </p>
                <button
                  onClick={handleReschedule}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Schedule Interview
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 3 - Interview Notes & Evaluation */}
        <div className="space-y-6">
          {/* Preparation Notes */}
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
              className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isSaved ? "Saved!" : "Save Notes"}
            </button>
          </div>

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
                  onChange={(e) => setResult(e.target.value as typeof result)}
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
                className="w-full mb-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isSaved ? "Saved!" : "Save Evaluation"}
              </button>

              {/* Final Decision Actions */}
              {result === "passed" && (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <button
                    // eslint-disable-next-line react-hooks/immutability
                    onClick={handleMoveToSelected}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Move to Selected
                  </button>
                  <button
                    // eslint-disable-next-line react-hooks/immutability
                    onClick={handleReject}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}

              {result === "failed" && (
                <button
                  // eslint-disable-next-line react-hooks/immutability
                  onClick={handleReject}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
