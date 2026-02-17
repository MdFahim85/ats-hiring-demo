import { useMemo, useState, useEffect, type ChangeEventHandler } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { ProtectedRoute } from "../../components/ProtectedRoute";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatusBadge } from "../../components/StatusBadge";

import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  MapPin,
  User as UserIcon,
  CheckCircle2,
  Search,
  AlertCircle,
  CheckCircle,
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
import Loading from "@/components/shared/Loading";
import { modifiedFetch, API_URL } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";

import type { getJobById } from "@backend/controllers/job";
import type { getApplicationsByJobId } from "@backend/controllers/application";
import type { getUserById } from "@backend/controllers/user";
import type { bulkScheduleInterviews } from "@backend/controllers/interview";
import type { getCalendarStatus } from "@backend/controllers/calendar";
import type { GetReqBody, GetRes } from "@backend/types/req-res";
import Client_ROUTEMAP from "@/misc/Client_ROUTEMAP";

/* -------------------------------------------------------------------------- */
/*                               INITIAL STATE                                */
/* -------------------------------------------------------------------------- */

const initialScheduleState = {
  selectedCandidates: new Set<number>(),
  searchQuery: "",
  statusFilter: "not_scheduled" as "all" | "not_scheduled" | "scheduled",
  selectedDate: new Date().toISOString().split("T")[0],
  selectedTime: "10:00",
  duration: "60",
  interviewType: "virtual" as "virtual" | "in_person",
};

type ScheduleState = typeof initialScheduleState;

/* -------------------------------------------------------------------------- */

function ScheduleInterviewsContent() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [schedule, setSchedule] = useState<ScheduleState>(initialScheduleState);

  // Check for calendar connection status from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calendarStatus = params.get("calendar");
    if (calendarStatus === "connected") {
      toast.success("Google Calendar connected successfully!");
      // Refresh calendar status
      queryClient.invalidateQueries({
        queryKey: [
          Server_ROUTEMAP.calendar.root + Server_ROUTEMAP.calendar.status,
        ],
      });
    } else if (calendarStatus === "error") {
      toast.error("Failed to connect Google Calendar. Please try again.");
    }
  }, [queryClient]);

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

  // Check Google Calendar connection status
  const { data: calendarStatus } = useQuery({
    queryKey: [Server_ROUTEMAP.calendar.root + Server_ROUTEMAP.calendar.status],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getCalendarStatus>>(
        Server_ROUTEMAP.calendar.root + Server_ROUTEMAP.calendar.status,
      ),
    retry: false,
  });

  const { data: authUrlData } = useQuery({
    queryKey: [
      Server_ROUTEMAP.calendar.root + Server_ROUTEMAP.calendar.authUrl,
    ],
    queryFn: () =>
      modifiedFetch<{ url: string }>(
        Server_ROUTEMAP.calendar.root + Server_ROUTEMAP.calendar.authUrl,
      ),
    // Only fetch if not connected
    enabled: calendarStatus?.connected === false,
    retry: false,
  });

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

  const shortlistedApplications = useMemo(() => {
    return applications?.filter((app) => app.status === "shortlisted") || [];
  }, [applications]);

  const { data: candidates } = useQuery({
    queryKey: [
      Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.getById,
      shortlistedApplications.map((a) => a.candidateId),
    ],
    queryFn: async () => {
      const candidateIds = shortlistedApplications.map((a) => a.candidateId);
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
    enabled: shortlistedApplications.length > 0,
    retry: false,
  });

  const shortlistedCandidates = useMemo(() => {
    if (!shortlistedApplications || !candidates) return [];

    return shortlistedApplications
      .map((app) => {
        const candidate = candidates.find((c) => c!.id === app.candidateId);
        return { ...app, candidate };
      })
      .filter((item) => {
        const matchesSearch =
          item.candidate?.name
            .toLowerCase()
            .includes(schedule.searchQuery.toLowerCase()) ?? false;
        return matchesSearch;
      })
      .sort(
        (a, b) =>
          new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime(),
      );
  }, [shortlistedApplications, candidates, schedule.searchQuery]);

  const { mutate: scheduleInterviews, isPending } = useMutation({
    mutationFn: () => {
      const selectedApps = shortlistedCandidates.filter((c) =>
        schedule.selectedCandidates.has(c.candidateId),
      );

      const interviewDateTime = new Date(
        `${schedule.selectedDate}T${schedule.selectedTime}`,
      );

      const interviews = selectedApps.map((app) => ({
        applicationId: app.id,
        jobId: parseInt(jobId!),
        candidateId: app.candidateId,
        interviewDate: interviewDateTime,
        duration: parseInt(schedule.duration),
        type: schedule.interviewType,
        status: "scheduled" as const,
      }));

      return modifiedFetch<GetRes<typeof bulkScheduleInterviews>>(
        Server_ROUTEMAP.interviews.root +
          Server_ROUTEMAP.interviews.bulkSchedule,
        {
          method: "post",
          body: JSON.stringify({
            interviews,
          } satisfies GetReqBody<typeof bulkScheduleInterviews>),
        },
      );
    },
    onSuccess: (data) => {
      if (data) toast.success(data.message);

      queryClient.invalidateQueries({
        queryKey: [
          Server_ROUTEMAP.applications.root +
            Server_ROUTEMAP.applications.getByJob,
          jobId,
        ],
      });

      navigate(`/hr/jobs/${jobId}/shortlisted`);
    },
    onError: (error) => {
      error.message?.split(",")?.forEach((msg: string) => toast.error(msg));
    },
  });

  if (isJobLoading || isApplicationsLoading) return <Loading />;

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

  const handleToggleCandidate = (id: number) => {
    const updated = new Set(schedule.selectedCandidates);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
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
    // Warn if virtual interviews selected but calendar not connected
    if (schedule.interviewType === "virtual" && !calendarStatus?.connected) {
      toast.error(
        "Connect Google Calendar first to generate Meet links for virtual interviews!",
      );
      return;
    }
    scheduleInterviews();
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

      {/* Google Calendar Connection Banner */}
      {calendarStatus?.connected ? (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4 flex justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Google Calendar Connected
                </p>
                <p className="text-xs text-green-600">
                  Google Meet links will be automatically generated for virtual
                  interviews and calendar invites sent to all attendees
                </p>
              </div>
            </div>
            <div className="w-fit">
              <Link
                to={`${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.calendar}`}
                className="flex items-center gap-2 px-6 py-3"
              >
                <Calendar className="w-4 h-4" />
                View Calendar
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Google Calendar Not Connected
                  </p>
                  <p className="text-xs text-orange-600">
                    Connect to automatically generate Google Meet links and send
                    calendar invites for virtual interviews
                  </p>
                </div>
              </div>
              {authUrlData?.url && (
                <Button
                  size="sm"
                  className="shrink-0 bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => (window.location.href = authUrlData.url)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Connect Calendar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                            src={
                              API_URL +
                              Server_ROUTEMAP.uploads.root +
                              Server_ROUTEMAP.uploads.images +
                              "/" +
                              item.candidate.profilePicture
                            }
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
                    min={new Date().toISOString().split("T")[0]}
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

              {/* Meeting Link Info */}
              {schedule.interviewType === "virtual" && (
                <div
                  className={`rounded-lg p-4 ${calendarStatus?.connected ? "bg-green-50" : "bg-muted"}`}
                >
                  <p className="text-sm font-medium mb-1">Meeting Link</p>
                  {calendarStatus?.connected ? (
                    <p className="text-sm text-green-700">
                      ✓ Google Meet link will be auto-generated and sent to all
                      attendees via calendar invite
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Connect Google Calendar to auto-generate Meet links
                    </p>
                  )}
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

                {/* Calendar status in preview */}
                {schedule.interviewType === "virtual" && (
                  <div className="flex justify-between text-sm">
                    <span>Meet Link:</span>
                    <span
                      className={
                        calendarStatus?.connected
                          ? "text-green-600"
                          : "text-orange-600"
                      }
                    >
                      {calendarStatus?.connected
                        ? "Auto-generated ✓"
                        : "Calendar not connected ⚠"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Button */}
          <Button
            onClick={handleScheduleAll}
            disabled={schedule.selectedCandidates.size === 0 || isPending}
            className="w-full"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {isPending ? "Scheduling..." : "Schedule"}{" "}
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
