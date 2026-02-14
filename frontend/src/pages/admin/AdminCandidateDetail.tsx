import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  User as UserIcon,
  FileText,
  CheckCircle2,
  XCircle,
  MessagesSquare,
  Download,
  ExternalLink,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { mockApplications, mockUsers } from "../../lib/mockData";
import { DashboardLayout } from "../../components/DashboardLayout";

function AdminCandidateDetailContent() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();

  const candidate = mockUsers.find((u) => u.id === candidateId);

  if (!candidate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Candidate not found</p>
        <Button variant="link" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const candidateApplications = mockApplications.filter(
    (app) => app.candidateId === candidate.id,
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
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
          <Badge
            variant="secondary"
            className="px-3 py-1 uppercase tracking-wider text-[10px]"
          >
            Admin View
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Total Applications */}
          <div className="w-full bg-blue-50 border border-gray-200 rounded-lg">
            <div className="p-6 flex items-center gap-4">
              <div className="bg-blue-600 text-white p-3 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {candidateApplications.length}
                </p>
              </div>
            </div>
          </div>

          {/* Interviews */}
          <div className="w-full bg-amber-50 border border-gray-200 rounded-lg">
            <div className="p-6 flex items-center gap-4">
              <div className="bg-amber-600 text-white p-3 rounded-lg">
                <MessagesSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Interviews</p>
                <p className="text-2xl font-semibold text-amber-700">
                  {
                    candidateApplications.filter(
                      (a) => a.status === "interview",
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Hired */}
          <div className="w-full bg-emerald-50 border border-gray-200 rounded-lg">
            <div className="p-6 flex items-center gap-4">
              <div className="bg-emerald-600 text-white p-3 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hired</p>
                <p className="text-2xl font-semibold text-emerald-700">
                  {
                    candidateApplications.filter((a) => a.status === "hired")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Rejected */}
          <div className="w-full bg-rose-50 border border-gray-200 rounded-lg">
            <div className="p-6 flex items-center gap-4">
              <div className="bg-rose-600 text-white p-3 rounded-lg">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-semibold text-rose-700">
                  {
                    candidateApplications.filter((a) => a.status === "rejected")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Card */}
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

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Professional Summary</CardTitle>
                <CardDescription>
                  High-level candidate assessment based on application history.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-slate-600">
                  This candidate has shown consistent interest in the company
                  with <strong>{candidateApplications.length}</strong> total
                  applications. Currently, their primary focus appears to be in
                  departments related to the job roles they've applied for.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AdminCandidateDetail() {
  return (
    <ProtectedRoute allowedRoles={["admin"]} allowLoggedInOnly>
      <AdminCandidateDetailContent />
    </ProtectedRoute>
  );
}
