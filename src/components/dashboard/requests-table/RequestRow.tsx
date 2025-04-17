
import { useNavigate } from "react-router-dom";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal, Users, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Request } from "@/types/types";
import { RequestTypeIcon } from "./RequestTypeIcon";
import { RequestStatusBadge } from "./RequestStatusBadge";

interface RequestRowProps {
  request: Request;
  missionView?: boolean;
  showSdr?: boolean;
  onRequestDeleted?: () => void;
}

export const RequestRow = ({ 
  request, 
  missionView = false,
  showSdr = false,
  onRequestDeleted
}: RequestRowProps) => {
  const navigate = useNavigate();
  
  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMM yyyy", { locale: fr });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "email":
        return "Campagne Email";
      case "database":
        return "Base de données";
      case "linkedin":
        return "Scraping LinkedIn";
      default:
        return type;
    }
  };

  return (
    <TableRow className={request.isLate ? "bg-red-50" : ""}>
      <TableCell className="text-center">
        <RequestTypeIcon type={request.type} />
      </TableCell>
      <TableCell>
        <div className="font-medium">{request.title}</div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-gray-100">
          {getTypeLabel(request.type)}
        </Badge>
      </TableCell>
      {!missionView && (
        <TableCell>
          {request.missionName || "Sans mission"}
        </TableCell>
      )}
      {showSdr && (
        <TableCell>
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            {request.sdrName || "Non assigné"}
          </div>
        </TableCell>
      )}
      <TableCell>{formatDate(request.dueDate)}</TableCell>
      <TableCell>
        <RequestStatusBadge status={request.status} workflow_status={request.workflow_status} isLate={request.isLate} />
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <User className="mr-2 h-4 w-4 text-muted-foreground" />
          {request.assignedToName || "Non assigné"}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/requests/${request.type}/${request.id}`)}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Voir les détails</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Plus d'actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigate(`/requests/${request.type}/${request.id}/edit`)}
              >
                Modifier
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};
