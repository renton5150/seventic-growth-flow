
import React from "react";
import { Badge } from "@/components/ui/badge";
import { RequestStatus, WorkflowStatus } from "@/types/types";

interface RequestStatusBadgeProps {
  status: RequestStatus | WorkflowStatus;
  large?: boolean;
}

export const RequestStatusBadge: React.FC<RequestStatusBadgeProps> = ({ status, large }) => {
  // Normalize status string for comparison
  const normalizedStatus = normalizeStatus(status);
  const className = large ? "px-2 py-1 text-xs" : "";

  if (
    normalizedStatus === "completed" ||
    normalizedStatus === "done" ||
    status === "review"
  ) {
    return <Badge className={`bg-green-500 hover:bg-green-600 ${className}`}>{getStatusLabel(status)}</Badge>;
  }

  if (normalizedStatus === "in_progress" || normalizedStatus === "assigned") {
    return <Badge className={`bg-blue-500 hover:bg-blue-600 ${className}`}>{getStatusLabel(status)}</Badge>;
  }

  if (normalizedStatus === "pending" || normalizedStatus === "pending_assignment") {
    return <Badge className={`bg-yellow-500 hover:bg-yellow-600 ${className}`}>{getStatusLabel(status)}</Badge>;
  }

  if (normalizedStatus === "canceled") {
    return <Badge className={`bg-gray-500 hover:bg-gray-600 ${className}`}>{getStatusLabel(status)}</Badge>;
  }

  // Default fallback badge
  return <Badge className={className}>{getStatusLabel(status)}</Badge>;
};

// Helper function to normalize status strings
function normalizeStatus(status: string): string {
  if (status === "inprogress") return "in_progress";
  if (status === "rejected") return "canceled";
  return status;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "En attente";
    case "in_progress":
    case "inprogress":
      return "En cours";
    case "completed":
      return "Terminé";
    case "canceled":
    case "rejected":
      return "Annulé";
    case "pending_assignment":
      return "En attente d'assignation";
    case "assigned":
      return "Assigné";
    case "review":
      return "En révision";
    default:
      return status;
  }
}
