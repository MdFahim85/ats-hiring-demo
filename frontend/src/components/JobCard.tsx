import { Link } from "react-router";
import type { Job } from "../types";
import { Calendar, Briefcase } from "lucide-react";
import Client_ROUTEMAP from "../misc/Client_ROUTEMAP";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const deadlineDate = new Date(job.deadline);
  const formattedDeadline = deadlineDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="hover:border-blue-300 hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-900">{job.title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" />
            <span>{job.department}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Apply by {formattedDeadline}</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
      </CardContent>

      <CardFooter>
        <Link
          to={`${Client_ROUTEMAP.public.root}/${Client_ROUTEMAP.public.jobDetails.replace(
            Client_ROUTEMAP.public._params.jobId,
            job.id,
          )}`}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          View Details & Apply →
        </Link>
      </CardFooter>
    </Card>
  );
}
