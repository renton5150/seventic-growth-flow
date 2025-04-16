
import { useNavigate } from "react-router-dom";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Eye, MoreHorizontal, Users, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Request } from "@/types/types";
import { RequestTypeIcon } from "./RequestTypeIcon";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { useState } from "react";
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
  
  const handleDeleteRequest = () => {
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (isDeleting) return; // Éviter les clics multiples
    
    try {
      setIsDeleting(true);
      console.log(`Confirmation de suppression pour la demande ${request.id}`);
      
      const success = await deleteRequest(request.id);
      
      if (success) {
        console.log("Suppression réussie, notification de mise à jour");
        // Notification au parent pour rafraîchir les données
        if (onRequestDeleted) {
          onRequestDeleted();
        }
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <TableRow className={request.isLate ? "bg-red-50" : ""}>
        <TableCell className="text-center">
          <RequestTypeIcon type={request.type} />
        </TableCell>
        <TableCell>
          <div className="font-medium">{request.title}</div>
          <div className="text-xs text-muted-foreground">{getTypeLabel(request.type)}</div>
        </TableCell>
        {!missionView && (
          <TableCell>{request.missionName || request.missionId}</TableCell>
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
            >
              <Eye size={16} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                >
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => viewRequest(request)}>
                  Voir les détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editRequest(request)}>Modifier</DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={handleDeleteRequest}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation de suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la demande "{request.title}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
