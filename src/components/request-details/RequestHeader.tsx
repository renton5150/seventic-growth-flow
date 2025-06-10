import { Button } from "@/components/ui/button";
import { ChevronLeft, PenSquare, Trash2, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GrowthRequestStatusBadge } from "@/components/growth/table/GrowthRequestStatusBadge";
import { Request } from "@/types/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { deleteRequest } from "@/services/requests/deleteRequestService";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface RequestHeaderProps {
  request: Request;
  onBack: () => void;
  onEdit: () => void;
  onClone: () => void;
  canEdit: boolean;
}

export const RequestHeader = ({ request, onBack, onEdit, onClone, canEdit }: RequestHeaderProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Vérifier si l'utilisateur est admin, growth, ou un SDR qui est le créateur de la demande
  const canDelete = user?.role === 'admin' || user?.role === 'growth' || 
                   (user?.role === 'sdr' && user?.id === request.createdBy);
  
  // Les utilisateurs peuvent toujours cloner une demande, quelle que soit leur rôle
  const canClone = true;

  // Déterminer la page de redirection après suppression basée sur l'URL actuelle
  const getRedirectPath = () => {
    // Si l'utilisateur vient de /growth ou de sous-pages de growth, rediriger vers /growth
    if (location.pathname.includes('/growth')) {
      return '/growth';
    }
    // Si c'est un admin sur la page admin, rediriger vers dashboard admin
    if (location.pathname.includes('/admin')) {
      return '/admin/dashboard';
    }
    // Si c'est un SDR, rediriger vers le dashboard
    if (user?.role === 'sdr') {
      return '/dashboard';
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
      console.log(`Tentative de suppression de la demande ${request.id} par ${user?.role}`);
      
      const success = await deleteRequest(request.id);
      
      if (success) {
        toast.success("Demande supprimée avec succès");
        
        // Force refresh all queries before redirecting
        console.log("Invalidation de toutes les requêtes après suppression");
        await queryClient.invalidateQueries({ queryKey: ['growth-requests-to-assign'] });
        await queryClient.invalidateQueries({ queryKey: ['growth-requests-my-assignments'] });
        await queryClient.invalidateQueries({ queryKey: ['growth-all-requests'] });
        await queryClient.invalidateQueries({ queryKey: ['dashboard-requests-with-missions'] });
        
        // Force explicit refetch
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['growth-all-requests'] })
        ]);
        
        // Rediriger vers la page appropriée
        const redirectPath = getRedirectPath();
        console.log(`Redirection vers ${redirectPath} après suppression réussie`);
        navigate(redirectPath);
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

  const handleClone = async () => {
    setIsCloning(true);
    try {
      console.log(`[RequestHeader] 📋 Début du clonage depuis le header`);
      await onClone();
    } catch (error) {
      console.error("[RequestHeader] ❌ Erreur lors du clonage:", error);
      toast.error("Erreur lors du clonage de la demande");
    } finally {
      setIsCloning(false);
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
          {/* Bouton pour cloner la demande */}
          {canClone && (
            <Button 
              variant="outline"
              onClick={handleClone}
              disabled={isCloning}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {isCloning ? "Clonage..." : "Cloner"}
            </Button>
          )}
          
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
          
          {/* Afficher le bouton de suppression pour admin, growth et SDR créateur */}
          {canDelete && (
            <Button 
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          )}
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

export default RequestHeader;
