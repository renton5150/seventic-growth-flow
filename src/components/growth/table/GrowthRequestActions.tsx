
import { Button } from "@/components/ui/button";
import { Request } from "@/types/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, CheckCircle, XCircle, ArrowRightLeft, Eye, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GrowthRequestAssignMenu } from "./GrowthRequestAssignMenu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { deleteRequest } from "@/services/requests/deleteRequestService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface GrowthRequestActionsProps {
  request: Request;
  onEditRequest: (request: Request) => void;
  onCompleteRequest: (request: Request) => void;
  onViewDetails?: (request: Request) => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
  activeTab?: string;
  onRequestDeleted?: () => void;
  showDeleteButton?: boolean;
}

export function GrowthRequestActions({
  request,
  onEditRequest,
  onCompleteRequest,
  onViewDetails,
  assignRequestToMe,
  updateRequestWorkflowStatus,
  activeTab,
  onRequestDeleted,
  showDeleteButton = false // Par défaut, ne pas afficher le bouton
}: GrowthRequestActionsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isGrowthOrAdmin = user?.role === 'growth' || user?.role === 'admin';
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleStatusChange = async (newStatus: string) => {
    if (!updateRequestWorkflowStatus) return;
    
    const success = await updateRequestWorkflowStatus(request.id, newStatus);
    if (success) {
      toast.success(`Statut mis à jour : ${newStatus}`);
      
      // Invalider et actualiser toutes les requêtes liées aux demandes
      queryClient.invalidateQueries({ queryKey: ['growth-requests-to-assign'] });
      queryClient.invalidateQueries({ queryKey: ['growth-requests-my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['growth-all-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-requests-with-missions'] });
    } else {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  // Fonction pour rediriger vers la page d'édition complète
  const handleEdit = () => {
    navigate(`/requests/${request.type}/${request.id}/edit`);
  };

  // Fonction pour rediriger vers la page de détails
  const viewFullDetails = () => {
    navigate(`/requests/${request.type}/${request.id}`);
  };

  // Fonction pour supprimer une demande
  const handleDeleteRequest = async () => {
    setIsDeleting(true);
    
    try {
      console.log(`Tentative de suppression de la demande ${request.id} (${request.title})`);
      
      const success = await deleteRequest(request.id);
      
      if (success) {
        toast.success("Demande supprimée avec succès");
        
        // Invalider tous les caches pour forcer le rafraîchissement des données
        console.log("Invalidation manuelle des caches après suppression");
        queryClient.invalidateQueries({ queryKey: ['growth-requests-to-assign'] });
        queryClient.invalidateQueries({ queryKey: ['growth-requests-my-assignments'] });
        queryClient.invalidateQueries({ queryKey: ['growth-all-requests'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-requests-with-missions'] });
        
        // Forcer un rafraîchissement complet
        setTimeout(() => {
          console.log("Force refreshQueries");
          queryClient.refetchQueries({ queryKey: ['growth-all-requests'] });
          
          // Notifier le parent si le callback existe
          if (onRequestDeleted) {
            console.log("Appel du callback onRequestDeleted");
            onRequestDeleted();
          }
        }, 300);
      } else {
        toast.error("Échec de la suppression de la demande");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Une erreur est survenue lors de la suppression");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="flex justify-end space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={viewFullDetails}
      >
        <Eye size={14} className="mr-1" /> Voir
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleEdit}
      >
        <Pencil size={14} className="mr-1" /> Éditer
      </Button>

      {/* Bouton de suppression - affiché uniquement si showDeleteButton est true */}
      {showDeleteButton && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <Trash2 size={14} className="mr-1" /> Supprimer
        </Button>
      )}

      {!request.assigned_to && (
        <GrowthRequestAssignMenu 
          request={request}
          onRequestUpdated={() => {
            if (updateRequestWorkflowStatus) {
              updateRequestWorkflowStatus(request.id, "in_progress");
            }
          }}
        />
      )}
      
      {request.assigned_to && updateRequestWorkflowStatus && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline"
              size="sm"
              className="bg-blue-50 border-blue-200"
            >
              <ArrowRightLeft className="mr-2 h-4 w-4 text-blue-500" /> Statut
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleStatusChange("in_progress")}>
              <ArrowRightLeft className="mr-2 h-4 w-4 text-blue-500" /> En cours
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("pending_assignment")}>
              <ArrowRightLeft className="mr-2 h-4 w-4 text-yellow-500" /> En attente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Terminée
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("canceled")}>
              <XCircle className="mr-2 h-4 w-4 text-gray-500" /> Annulée
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette demande (<strong>{request.title}</strong>) ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRequest}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
