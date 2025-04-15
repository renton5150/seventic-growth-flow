
import { CheckCircle2, Clock, AlertCircle, ArrowRightLeft, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RequestStatus } from "@/types/types";

interface RequestStatusBadgeProps {
  status?: RequestStatus;
  workflow_status?: string;
  isLate?: boolean;
}

export const RequestStatusBadge = ({ status, workflow_status, isLate }: RequestStatusBadgeProps) => {
  // Si on a un workflow_status, on l'utilise en priorité
  if (workflow_status) {
    if (isLate && (workflow_status === "pending_assignment" || workflow_status === "in_progress")) {
      return (
        <Badge variant="outline" className="bg-red-500 text-white flex gap-1 items-center">
          <AlertCircle size={14} /> En retard
        </Badge>
      );
    }

    switch (workflow_status) {
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
    }
  }

  // Ancien système de statut s'il n'y a pas de workflow_status
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
          <ArrowRightLeft size={14} /> En cours
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
