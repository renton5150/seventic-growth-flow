
import { useNavigate } from "react-router-dom";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { deleteRequest } from "@/services/requests/deleteRequestService";

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
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isOwner = user?.id === request.createdBy;

  // Ajouter un log pour voir la valeur de missionName
  console.log("Requête dans RequestRow:", request.id, "Mission name:", request.missionName);

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
  
  const handleDeleteRequest = async () => {
    try {
      // Confirmer avant suppression
      if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la demande "${request.title}" ?`)) {
        return;
      }
      
      const success = await deleteRequest(request.id);
      
      if (success) {
        toast.success("La demande a été supprimée avec succès");
        if (onRequestDeleted) {
          onRequestDeleted();
        }
      } else {
        toast.error("Erreur lors de la suppression de la demande");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la demande:", error);
      toast.error("Une erreur s'est produite lors de la suppression");
    }
  };

  return (
    <TableRow className={request.isLate ? "bg-red-50" : ""}>
      <TableCell className="text-center">
        <RequestTypeIcon type={request.type} />
      </TableCell>
      <TableCell>
        <div className="font-medium">{request.title}</div>
        <div className="text-xs text-muted-foreground">{getTypeLabel(request.type)}</div>
      </TableCell>
      {!missionView && (
        <TableCell>
          {request.missionName || "Mission sans nom"}
        </TableCell>
      )}
      {showSdr && (
        <TableCell>
          <div className="flex items-center">
            <Users className={`mr-2 h-4 w-4 ${isAdmin ? "text-blue-500" : "text-muted-foreground"}`} />
            {request.sdrName || "Non assigné"}
          </div>
        </TableCell>
      )}
      <TableCell>
        {formatDate(request.dueDate)}
      </TableCell>
      <TableCell>
        <RequestStatusBadge status={request.status} workflow_status={request.workflow_status} isLate={request.isLate} />
      </TableCell>
      <TableCell>
        {request.assignedToName ? (
          <div className="flex items-center">
            <User className="mr-2 h-4 w-4 text-green-500" />
            {request.assignedToName}
          </div>
        ) : (
          <div className="text-gray-400 text-sm italic">Non assigné</div>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => viewRequest(request)}
            className={isAdmin ? "hover:bg-blue-100" : ""}
          >
            <Eye size={16} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={isAdmin ? "hover:bg-blue-100" : ""}
              >
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={isAdmin ? "border-blue-200" : ""}>
              <DropdownMenuItem onClick={() => viewRequest(request)}>
                Voir les détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editRequest(request)}>Modifier</DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={handleDeleteRequest}
              >
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
