
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, ArrowRightLeft, XCircle } from "lucide-react";

interface GrowthRequestStatusBadgeProps {
  status: string;
  isLate?: boolean;
}

export function GrowthRequestStatusBadge({ status, isLate }: GrowthRequestStatusBadgeProps) {
  if (isLate && (status === "pending_assignment" || status === "in_progress")) {
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
          <CheckCircle size={14} /> Terminée
        </Badge>
      );
    case "canceled":
      return (
        <Badge variant="outline" className="bg-gray-500 text-white flex gap-1 items-center">
          <XCircle size={14} /> Annulée
        </Badge>
      );
    default:
      return null;
  }
}
