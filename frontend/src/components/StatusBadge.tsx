import type { Application } from "@backend/models/Application";
import type { Interview } from "@backend/models/Interview";
import type { Job } from "@backend/models/Job";

type StatusBadgeProps = {
  status: Application["status"] | Job["status"] | Interview["status"];
};

export function StatusBadge({ status }: StatusBadgeProps) {
  // Mapping of Tailwind classes for each status
  const styles: Record<StatusBadgeProps["status"], string> = {
    applied: "bg-blue-100 text-blue-700",
    shortlisted: "bg-purple-100 text-purple-700",
    interview: "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
    hired: "bg-green-100 text-green-700",
    draft: "bg-gray-100 text-gray-700",
    active: "bg-emerald-100 text-emerald-700",
    closed: "bg-slate-200 text-slate-700",
    // New statuses added below
    not_scheduled: "bg-orange-100 text-orange-700",
    scheduled: "bg-indigo-100 text-indigo-700",
    completed: "bg-teal-100 text-teal-700",
  };

  // Human-readable labels
  const labels: Record<StatusBadgeProps["status"], string> = {
    applied: "Applied",
    shortlisted: "Shortlisted",
    interview: "Interview",
    rejected: "Rejected",
    hired: "Hired",
    draft: "Draft",
    active: "Active",
    closed: "Closed",
    // New labels added below
    not_scheduled: "Not Scheduled",
    scheduled: "Scheduled",
    completed: "Completed",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
