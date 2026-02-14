import { useMemo, useState, type ChangeEventHandler } from "react";
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
  Calendar,
  Clock,
  Video,
  MapPin,
  User as UserIcon,
  CheckCircle2,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

/* -------------------------------------------------------------------------- */
/*                               INITIAL STATE                                */
/* -------------------------------------------------------------------------- */

const initialScheduleState = {
  selectedCandidates: new Set<string>(),
  searchQuery: "",
  statusFilter: "not_scheduled" as "all" | "not_scheduled" | "scheduled",
  selectedDate: "2026-02-20",
  selectedTime: "10:00",
  duration: "60",
  interviewType: "virtual" as "virtual" | "in_person",
  interviewer: "Sarah Williams",
};

type ScheduleState = typeof initialScheduleState;

/* -------------------------------------------------------------------------- */

function ScheduleInterviewsContent() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState<ScheduleState>(initialScheduleState);

  /* ---------------------------- Helper onChange ---------------------------- */

  const onChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value },
  }) =>
    setSchedule((prev) => ({
      ...prev,
      [id]: value,
    }));

  const updateField = <K extends keyof ScheduleState>(
    key: K,
    value: ScheduleState[K],
  ) =>
    setSchedule((prev) => ({
      ...prev,
      [key]: value,
    }));

  /* ---------------------------- Data -------------------------------------- */

  const job = mockJobs.find((j) => j.id === jobId);

  const shortlistedCandidates = useMemo(() => {
    if (!job) return [];

    return mockApplications
      .filter((app) => app.jobId === job.id && app.status === "shortlisted")
      .map((app) => {
        const candidate = mockUsers.find((u) => u.id === app.candidateId);
        const interview = mockInterviews.find(
          (i) => i.applicationId === app.id,
        );
        return { ...app, candidate, interview };
      })
      .filter((item) => {
        const matchesSearch = item.candidate?.name
          .toLowerCase()
          .includes(schedule.searchQuery.toLowerCase());

        const matchesStatus =
          schedule.statusFilter === "all" ||
          (schedule.statusFilter === "not_scheduled" &&
            (!item.interview || item.interview.status === "not_scheduled")) ||
          (schedule.statusFilter === "scheduled" &&
            item.interview?.status === "scheduled");

        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime(),
      );
  }, [job, schedule.searchQuery, schedule.statusFilter]);

  if (!job) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Job not found</p>
        </div>
      </DashboardLayout>
    );
  }

  /* ---------------------------- Selection Logic --------------------------- */

  const handleToggleCandidate = (id: string) => {
    const updated = new Set(schedule.selectedCandidates);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    updated.has(id) ? updated.delete(id) : updated.add(id);
    updateField("selectedCandidates", updated);
  };

  const handleSelectAll = () => {
    if (schedule.selectedCandidates.size === shortlistedCandidates.length) {
      updateField("selectedCandidates", new Set());
    } else {
      updateField(
        "selectedCandidates",
        new Set(shortlistedCandidates.map((c) => c.candidateId)),
      );
    }
  };

  const handleScheduleAll = () => {
    alert(
      `Successfully scheduled ${schedule.selectedCandidates.size} interview(s)!`,
    );
    navigate(`/hr/jobs/${jobId}/shortlisted`);
  };

  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/hr/jobs/${jobId}/shortlisted`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shortlisted Candidates
        </Button>

        <h1 className="text-3xl mb-2">Schedule Interviews</h1>
        <p className="text-muted-foreground">{job.title}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT PANEL */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg">Select Candidates</h2>
                <span className="text-sm text-muted-foreground">
                  {schedule.selectedCandidates.size} selected
                </span>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="searchQuery"
                  value={schedule.searchQuery}
                  onChange={onChange}
                  placeholder="Search candidates..."
                  className="pl-10"
                />
              </div>

              {/* Status Filter Row Buttons */}
              <div className="flex gap-2 mb-4">
                {[
                  { value: "not_scheduled", label: "Not Scheduled" },
                  { value: "scheduled", label: "Scheduled" },
                  { value: "all", label: "All" },
                ].map((filter) => (
                  <Button
                    key={filter.value}
                    size="sm"
                    variant={
                      schedule.statusFilter === filter.value
                        ? "default"
                        : "secondary"
                    }
                    onClick={() =>
                      updateField(
                        "statusFilter",
                        filter.value as ScheduleState["statusFilter"],
                      )
                    }
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              {/* Select All */}
              <Label className="flex items-center gap-3 mb-2 cursor-pointer">
                <Input
                  type="checkbox"
                  checked={
                    schedule.selectedCandidates.size ===
                      shortlistedCandidates.length &&
                    shortlistedCandidates.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4"
                />
                <span className="text-sm">Select All</span>
              </Label>

              <div className="border-t pt-2" />

              {/* Candidate List */}
              <div className="space-y-2 max-h-125 overflow-y-auto">
                {shortlistedCandidates.map((item) => {
                  if (!item.candidate) return null;

                  const appliedDate = new Date(
                    item.appliedAt,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <Label
                      key={item.id}
                      className="flex items-start gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer"
                    >
                      <Input
                        type="checkbox"
                        checked={schedule.selectedCandidates.has(
                          item.candidateId,
                        )}
                        onChange={() => handleToggleCandidate(item.candidateId)}
                        className="w-4 h-4 mt-1"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        {item.candidate.profilePicture ? (
                          <img
                            src={item.candidate.profilePicture}
                            alt={item.candidate.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                          </div>
                        )}

                        <div className="flex-1">
                          <p className="text-sm truncate">
                            {item.candidate.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {appliedDate}
                            </p>
                            <StatusBadge status="active" />
                          </div>
                        </div>
                      </div>
                    </Label>
                  );
                })}

                {shortlistedCandidates.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No candidates found
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg">Interview Details</h2>

              {/* Date */}
              <div>
                <Label htmlFor="selectedDate">Date</Label>
                <div className="relative mt-2">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="selectedDate"
                    type="date"
                    value={schedule.selectedDate}
                    onChange={onChange}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Time */}
              <div>
                <Label className="mb-2 block">Time</Label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      size="sm"
                      variant={
                        schedule.selectedTime === time ? "default" : "secondary"
                      }
                      onClick={() => updateField("selectedTime", time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <Label className="mb-2 block">Duration</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Select
                    value={schedule.duration}
                    onValueChange={(v: string) => updateField("duration", v)}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Interview Type */}
              <div>
                <Label className="mb-2 block">Interview Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={
                      schedule.interviewType === "virtual"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => updateField("interviewType", "virtual")}
                  >
                    <Video className="w-5 h-5 mr-2" />
                    Virtual
                  </Button>

                  <Button
                    variant={
                      schedule.interviewType === "in_person"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => updateField("interviewType", "in_person")}
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    In-Person
                  </Button>
                </div>
              </div>

              {/* Interviewer */}
              <div>
                <Label className="mb-2 block">Interviewer</Label>
                <Select
                  value={schedule.interviewer}
                  onValueChange={(v: string) => updateField("interviewer", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sarah Williams">
                      Sarah Williams
                    </SelectItem>
                    <SelectItem value="Mark Thompson">Mark Thompson</SelectItem>
                    <SelectItem value="Lisa Chen">Lisa Chen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Meeting Link */}
              {schedule.interviewType === "virtual" && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    Meeting Link
                  </p>
                  <p className="text-sm">
                    https://meet.example.com/auto-generated-link
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    A unique link will be generated for each interview
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          {schedule.selectedCandidates.size > 0 && (
            <Card>
              <CardContent className="p-6 space-y-3">
                <h2 className="text-lg">Interview Preview</h2>

                <div className="flex justify-between text-sm">
                  <span>Candidates:</span>
                  <span>{schedule.selectedCandidates.size}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Date:</span>
                  <span>
                    {new Date(schedule.selectedDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Time:</span>
                  <span>{schedule.selectedTime}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Duration:</span>
                  <span>{schedule.duration} minutes</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Type:</span>
                  <span className="capitalize">
                    {schedule.interviewType.replace("_", " ")}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Interviewer:</span>
                  <span>{schedule.interviewer}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Button */}
          <Button
            onClick={handleScheduleAll}
            disabled={schedule.selectedCandidates.size === 0}
            className="w-full"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Schedule{" "}
            {schedule.selectedCandidates.size > 0
              ? `${schedule.selectedCandidates.size} `
              : ""}
            Interview
            {schedule.selectedCandidates.size !== 1 && "s"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* -------------------------------------------------------------------------- */

export default function ScheduleInterviews() {
  return (
    <ProtectedRoute allowedRoles={["hr"]} allowLoggedInOnly>
      <ScheduleInterviewsContent />
    </ProtectedRoute>
  );
}
