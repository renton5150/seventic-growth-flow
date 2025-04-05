
import { useNavigate } from "react-router-dom";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Request } from "@/types/types";
import { RequestTypeIcon } from "./RequestTypeIcon";
import { RequestStatusBadge } from "./RequestStatusBadge";

interface RequestRowProps {
  request: Request;
  missionView?: boolean;
  showSdr?: boolean;
}

export const RequestRow = ({ request, missionView = false, showSdr = false }: RequestRowProps) => {
  const navigate = useNavigate();

  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMM yyyy", { locale: fr });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "email":
        return "Emailing";
      case "database":
        return "Base de données";
      case "linkedin":
        return "LinkedIn";
      default:
        return type;
    }
  };

  const viewRequest = (request: Request) => {
    navigate(`/requests/${request.type}/${request.id}`);
  };

  const editRequest = (request: Request) => {
    navigate(`/requests/${request.type}/${request.id}/edit`);
  };

  return (
    <TableRow>
      <TableCell className="text-center">
        <RequestTypeIcon type={request.type} />
      </TableCell>
      <TableCell>
        <div className="font-medium">{request.title}</div>
        <div className="text-xs text-muted-foreground">{getTypeLabel(request.type)}</div>
      </TableCell>
      {!missionView && (
        <TableCell>Mission {request.missionId}</TableCell>
      )}
      {showSdr && (
        <TableCell>
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            {request.sdrName || "Non assigné"}
          </div>
        </TableCell>
      )}
      <TableCell>
        {formatDate(request.dueDate)}
      </TableCell>
      <TableCell>
        <RequestStatusBadge status={request.status} isLate={request.isLate} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" onClick={() => viewRequest(request)}>
            <Eye size={16} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => viewRequest(request)}>
                Voir les détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editRequest(request)}>Modifier</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};
