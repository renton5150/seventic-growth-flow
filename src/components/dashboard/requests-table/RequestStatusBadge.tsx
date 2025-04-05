
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RequestStatus } from "@/types/types";

interface RequestStatusBadgeProps {
  status: RequestStatus;
  isLate?: boolean;
}

export const RequestStatusBadge = ({ status, isLate }: RequestStatusBadgeProps) => {
  if (isLate && status === "pending") {
    return (
      <Badge variant="outline" className="bg-status-late text-white flex gap-1 items-center">
        <AlertCircle size={14} /> En retard
      </Badge>
    );
  }

  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="bg-status-pending text-white flex gap-1 items-center">
          <Clock size={14} /> En attente
        </Badge>
      );
    case "inprogress":
      return (
        <Badge variant="outline" className="bg-status-inprogress text-white flex gap-1 items-center">
          <Clock size={14} /> En cours
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="outline" className="bg-status-completed text-white flex gap-1 items-center">
          <CheckCircle2 size={14} /> Terminé
        </Badge>
      );
    default:
      return null;
  }
};
