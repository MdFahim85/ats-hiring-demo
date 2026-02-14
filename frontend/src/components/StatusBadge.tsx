import type { ApplicationStatus } from "@/types";

interface StatusBadgeProps {
  status: ApplicationStatus | "draft" | "active" | "closed";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    applied: "bg-blue-100 text-blue-700",
    shortlisted: "bg-purple-100 text-purple-700",
    interview: "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
    hired: "bg-green-100 text-green-700",
    draft: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-700",
  };

  const labels = {
    applied: "Applied",
    shortlisted: "Shortlisted",
    interview: "Interview",
    rejected: "Rejected",
    hired: "Hired",
    draft: "Draft",
    active: "Active",
    closed: "Closed",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
