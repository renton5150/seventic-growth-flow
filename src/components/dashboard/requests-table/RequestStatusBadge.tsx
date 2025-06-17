
import { CheckCircle2, Clock, AlertCircle, ArrowRightLeft, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RequestStatus, WorkflowStatus } from "@/types/types";

interface RequestStatusBadgeProps {
  status?: RequestStatus | WorkflowStatus;
  isLate?: boolean;
}

export const RequestStatusBadge = ({ status, isLate }: RequestStatusBadgeProps) => {
  // Si on est en retard et que le statut est en attente ou en cours
  if (isLate && (status === "pending_assignment" || status === "in_progress" || status === "pending" || status === "in progress")) {
    return (
      <Badge variant="outline" className="bg-red-500 text-white flex gap-1 items-center">
        <AlertCircle size={14} /> En retard
      </Badge>
    );
  }

  switch (status) {
    case "pending_assignment":
      return (
        <Badge variant="outline" className="bg-orange-500 text-white flex gap-1 items-center">
          <Clock size={14} /> En attente d'affectation
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="outline" className="bg-blue-500 text-white flex gap-1 items-center">
          <ArrowRightLeft size={14} /> En cours
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="outline" className="bg-green-500 text-white flex gap-1 items-center">
          <CheckCircle2 size={14} /> Terminée
        </Badge>
      );
    case "canceled":
      return (
        <Badge variant="outline" className="bg-gray-500 text-white flex gap-1 items-center">
          <XCircle size={14} /> Annulée
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="bg-orange-500 text-white flex gap-1 items-center">
          <Clock size={14} /> En attente
        </Badge>
      );
    case "in progress":
      return (
        <Badge variant="outline" className="bg-blue-500 text-white flex gap-1 items-center">
          <ArrowRightLeft size={14} /> En cours
        </Badge>
      );
    default:
      return null;
  }
};
