import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Download,
  ExternalLink,
  Mail,
  Phone,
  UserCheck,
  User as UserIcon,
  XCircle,
} from "lucide-react";

import Loading from "@/components/shared/Loading";
import { API_URL, modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";
import { DashboardLayout } from "../../components/DashboardLayout";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { StatusBadge } from "../../components/StatusBadge";

import type {
  getApplicationsByCandidateId,
  updateApplicationStatus,
} from "@backend/controllers/application";
import type { getJobById } from "@backend/controllers/job";
import type { getUserById } from "@backend/controllers/user";
import type { Application } from "@backend/models/Application";
import type { GetReqBody, GetRes } from "@backend/types/req-res";

function CandidateDetailContent() {
  const { candidateId: id } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: candidate, isLoading: isCandidateLoading } = useQuery({
    queryKey: [Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.getById, id],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getUserById>>(
        Server_ROUTEMAP.users.root +
          Server_ROUTEMAP.users.getById.replace(
            Server_ROUTEMAP.users._params.id,
            id!,
          ),
      ),
    enabled: !!id,
    retry: false,
  });

  const { data: applications, isLoading: isApplicationsLoading } = useQuery({
    queryKey: [
      Server_ROUTEMAP.applications.root +
        Server_ROUTEMAP.applications.getByCandidate,
      id,
    ],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getApplicationsByCandidateId>>(
        Server_ROUTEMAP.applications.root +
          Server_ROUTEMAP.applications.getByCandidate.replace(
            Server_ROUTEMAP.applications._params.candidateId,
            id!,
          ),
      ),
    enabled: !!id,
    retry: false,
  });

  const { data: jobs } = useQuery({
    queryKey: [Server_ROUTEMAP.jobs.root + Server_ROUTEMAP.jobs.get],
    queryFn: async () => {
      if (!applications || applications.length === 0) return [];

      const jobIds = [...new Set(applications.map((app) => app.jobId))];
      const jobPromises = jobIds.map((jobId) =>
        modifiedFetch<GetRes<typeof getJobById>>(
          Server_ROUTEMAP.jobs.root +
            Server_ROUTEMAP.jobs.getById.replace(
              Server_ROUTEMAP.jobs._params.id,
              jobId.toString(),
            ),
        ),
      );

      return await Promise.all(jobPromises);
    },
    enabled: !!applications && applications.length > 0,
    retry: false,
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({
      appId,
      newStatus,
    }: {
      appId: number;
      newStatus: Application["status"];
    }) => {
      return modifiedFetch<GetRes<typeof updateApplicationStatus>>(
        Server_ROUTEMAP.applications.root +
          Server_ROUTEMAP.applications.updateStatus.replace(
            Server_ROUTEMAP.applications._params.id,
            appId.toString(),
          ),
        {
          method: "put",
          body: JSON.stringify({
            status: newStatus,
          } satisfies GetReqBody<typeof updateApplicationStatus>),
        },
      );
    },
    onSuccess: (data) => {
      if (data) toast.success(data.message);

      queryClient.invalidateQueries({
        queryKey: [
          Server_ROUTEMAP.applications.root +
            Server_ROUTEMAP.applications.getByCandidate,
          id,
        ],
      });
    },
    onError: (error) => {
      error.message?.split(",")?.forEach((msg: string) => toast.error(msg));
    },
  });

  const handleStatusChange = (
    appId: number,
    newStatus: Application["status"],
  ) => {
    updateStatus({ appId, newStatus });
  };

  if (isCandidateLoading || isApplicationsLoading) return <Loading />;

  if (!candidate || candidate.role !== "candidate") {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Candidate not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const appsWithJobs =
    applications
      ?.map((app) => ({
        ...app,
        job: jobs?.find((j) => j!.id === app.jobId),
      }))
      .sort(
        (a, b) =>
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
      ) || [];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="group text-muted-foreground hover:text-foreground"
        >
          <span className="mr-2 transition-transform group-hover:-translate-x-1">
            ←
          </span>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Info */}
        <div className="lg:col-span-1">
          <Card className="lg:col-span-1 shadow-md ">
            <CardContent className="pt-8 flex flex-col items-center">
              <Avatar className="w-32 h-32 border-4 border-background shadow-xl mb-6">
                <AvatarImage
                  src={
                    API_URL +
                    Server_ROUTEMAP.uploads.root +
                    Server_ROUTEMAP.uploads.images +
                    "/" +
                    candidate.profilePicture
                  }
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <UserIcon className="w-16 h-16" />
                </AvatarFallback>
              </Avatar>

              <div className="text-center space-y-1 mb-8">
                <h2 className="text-2xl font-bold tracking-tight">
                  {candidate.name}
                </h2>
              </div>

              <div className="w-full space-y-4">
                <Separator />
                <div className="px-2 space-y-4 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </span>
                    <a
                      href={`mailto:${candidate.email}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {candidate.email}
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Phone
                    </span>
                    <span className="font-medium">
                      {candidate.phone || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="pt-6 space-y-3">
                  {candidate.cvUrl && (
                    <Button
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                      asChild
                    >
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
                      >
                        <Download className="w-4 h-4 mr-2" /> Download Resume
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full border-dashed">
                    <ExternalLink className="w-4 h-4 mr-2" /> External Portfolio
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application History</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {appsWithJobs.length > 0 ? (
                <div className="space-y-6">
                  {appsWithJobs.map((app) => {
                    if (!app.job) return null;

                    const appliedDate = new Date(
                      app.appliedAt,
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <Card key={app.id} className="bg-card">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-medium mb-1">
                                {app.job.title}
                              </h4>
                              <CardDescription>
                                {app.job.department}
                              </CardDescription>
                            </div>
                            <StatusBadge status={app.status} />
                          </div>

                          <p className="text-sm text-muted-foreground mb-4">
                            Applied on {appliedDate}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                              onClick={() =>
                                handleStatusChange(app.id, "shortlisted")
                              }
                              disabled={
                                isPending ||
                                app.status === "shortlisted" ||
                                app.status === "interview" ||
                                app.status === "hired"
                              }
                            >
                              <UserCheck className="w-4 h-4" />
                              Shortlist
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-2"
                              onClick={() =>
                                handleStatusChange(app.id, "rejected")
                              }
                              disabled={
                                isPending ||
                                app.status === "rejected" ||
                                app.status === "hired"
                              }
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>

                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white gap-2"
                              onClick={() =>
                                handleStatusChange(app.id, "hired")
                              }
                              disabled={isPending || app.status === "hired"}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Hire
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No application history
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CandidateDetail() {
  return (
    <ProtectedRoute allowedRoles={["hr"]} allowLoggedInOnly>
      <CandidateDetailContent />
    </ProtectedRoute>
  );
}
