
import { Button } from "@/components/ui/button";
import { ChevronLeft, PenSquare, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GrowthRequestStatusBadge } from "@/components/growth/table/GrowthRequestStatusBadge";
import { Request } from "@/types/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import { deleteRequest } from "@/services/requests/deleteRequestService";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface RequestHeaderProps {
  request: Request;
  onBack: () => void;
  onEdit: () => void;
  canEdit: boolean;
}

export const RequestHeader = ({ request, onBack, onEdit, canEdit }: RequestHeaderProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Déterminer la page de redirection après suppression basée sur l'URL actuelle
  const getRedirectPath = () => {
    // Si l'utilisateur vient de /growth ou de sous-pages de growth, rediriger vers /growth
    if (location.pathname.includes('/growth')) {
      return '/growth';
    }
    // Si venant de mission ou d'une page spécifique, rediriger vers celle-ci
    if (location.state && location.state.from) {
      return location.state.from;
    }
    // Par défaut, rediriger vers dashboard
    return '/dashboard';
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const success = await deleteRequest(request.id);
      
      if (success) {
        toast.success("Demande supprimée avec succès");
        
        // Force refresh all queries before redirecting
        await queryClient.invalidateQueries({ queryKey: ['growth-requests-to-assign'] });
        await queryClient.invalidateQueries({ queryKey: ['growth-requests-my-assignments'] });
        await queryClient.invalidateQueries({ queryKey: ['growth-all-requests'] });
        await queryClient.invalidateQueries({ queryKey: ['dashboard-requests-with-missions'] });
        
        // Rediriger vers la page appropriée
        navigate(getRedirectPath());
      } else {
        toast.error("Erreur lors de la suppression de la demande");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de la demande");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{request?.title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button 
              variant="default"
              onClick={onEdit}
              className="flex items-center gap-2"
            >
              <PenSquare className="h-4 w-4" />
              Modifier la demande
            </Button>
          )}
          
          <Button 
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className="px-2 py-1">
          {request?.type === "email"
            ? "Campagne Email"
            : request?.type === "database"
            ? "Base de données"
            : "Scraping LinkedIn"}
        </Badge>
        {request && (
          <GrowthRequestStatusBadge 
            status={request.workflow_status || "pending_assignment"} 
            isLate={request.isLate}
          />
        )}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette demande ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
