import { useParams, useNavigate } from "react-router";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { DashboardLayout } from "../../components/DashboardLayout";
import { StatusBadge } from "../../components/StatusBadge";
import { mockUsers, mockApplications, mockJobs } from "../../lib/mockData";
import {
  Mail,
  Phone,
  Download,
  User as UserIcon,
  CheckCircle,
  XCircle,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import type { ApplicationStatus } from "../../types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

function CandidateDetailContent() {
  const { candidateId: id } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();

  const candidate = mockUsers.find(
    (u) => u.id === id && u.role === "candidate",
  );

  const [appsState, setAppsState] = useState(() =>
    mockApplications
      .filter((app) => app.candidateId === id)
      .map((app) => ({
        ...app,
        job: mockJobs.find((j) => j.id === app.jobId),
      }))
      .sort(
        (a, b) =>
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
      ),
  );

  const handleStatusChange = (appId: string, newStatus: ApplicationStatus) => {
    setAppsState((prev) =>
      prev.map((app) =>
        app.id === appId
          ? { ...app, status: newStatus, updatedAt: new Date().toISOString() }
          : app,
      ),
    );
  };

  if (!candidate) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Candidate not found</p>
        </div>
      </DashboardLayout>
    );
  }

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
                  src={candidate.profilePicture}
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
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg">
                      <Download className="w-4 h-4 mr-2" /> Download Resume
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
              {appsState.length > 0 ? (
                <div className="space-y-6">
                  {appsState.map((app) => {
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
                              disabled={app.status === "hired"}
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
