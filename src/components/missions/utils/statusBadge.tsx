
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle } from "lucide-react";

export const renderMissionStatusBadge = (status: "En cours" | "Fin") => {
  switch (status) {
    case "En cours":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-600 flex items-center gap-1">
          <Clock size={14} /> En cours
        </Badge>
      );
    case "Fin":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-600 flex items-center gap-1">
          <CheckCircle size={14} /> Terminée
        </Badge>
      );
    default:
      return null;
  }
};
