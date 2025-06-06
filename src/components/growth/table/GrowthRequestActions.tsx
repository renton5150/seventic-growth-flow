
import { Button } from "@/components/ui/button";
import { Request } from "@/types/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, CheckCircle, XCircle, ArrowRightLeft, Eye, Trash2, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "@/services/user/userQueries";
import { supabase } from "@/integrations/supabase/client";

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
  showDeleteButton = false
}: GrowthRequestActionsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGrowthOrAdmin = user?.role === 'growth' || user?.role === 'admin';
  const isSdrCreator = user?.role === 'sdr' && user?.id === request.createdBy;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const { data: users = [] } = useQuery({
    queryKey: ['users-growth'],
    queryFn: getAllUsers,
  });

  // Filter only growth team members
  const growthUsers = users.filter(user => user.role === 'growth');

  const assignToUser = async (userId: string) => {
    try {
      setIsAssigning(true);
      
      const { data, error } = await supabase
        .from('requests')
        .update({
          assigned_to: userId,
          workflow_status: 'in_progress',
          last_updated: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success("Requête assignée avec succès");
      if (onRequestDeleted) {
        onRequestDeleted();
      }
    } catch (error) {
      console.error("Erreur lors de l'assignation:", error);
      toast.error("Erreur lors de l'assignation de la requête");
    } finally {
      setIsAssigning(false);
    }
  };
  
  const handleStatusChange = async (newStatus: string) => {
    if (!updateRequestWorkflowStatus) return;
    
    const success = await updateRequestWorkflowStatus(request.id, newStatus);
    if (success) {
      toast.success(`Statut mis à jour : ${newStatus}`);
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
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      console.log(`Tentative de suppression de la demande ${request.id} (${request.title})`);
      
      const success = await deleteRequest(request.id);
      
      if (success) {
        toast.success("Demande supprimée avec succès");
        
        // Notifier le parent si le callback existe
        if (onRequestDeleted) {
          console.log("Appel du callback onRequestDeleted");
          onRequestDeleted();
        }
        
        // Fermer la boîte de dialogue
        setIsDeleteDialogOpen(false);
        
        // Rediriger vers la page de liste si on est sur la vue détaillée
        const currentPath = window.location.pathname;
        if (currentPath.includes(`/requests/${request.type}/${request.id}`)) {
          navigate('/growth');
        }
      } else {
        toast.error("Échec de la suppression de la demande");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Une erreur est survenue lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  // Fonction pour montrer le bouton de suppression en fonction des permissions
  const canShowDeleteButton = () => {
    // Si la prop showDeleteButton est true explicitement
    if (showDeleteButton === true) {
      return true;
    }
    
    // Sur la page détaillée (pas dans le tableau), toujours montrer pour admin/growth
    const isDetailPage = window.location.pathname.includes(`/requests/${request.type}/${request.id}`);
    if (isDetailPage && (isGrowthOrAdmin || isSdrCreator)) {
      return true;
    }
    
    // Ne pas montrer dans les autres cas
    return false;
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

      {/* Bouton de suppression - affiché uniquement si autorisé */}
      {canShowDeleteButton() && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <Trash2 size={14} className="mr-1" /> Supprimer
        </Button>
      )}

      {/* Menu d'assignation - TOUJOURS affiché pour les Growth et Admin */}
      {isGrowthOrAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              disabled={isAssigning}
              className="bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              <Users className="mr-2 h-4 w-4 text-blue-600" /> 
              {request.assigned_to ? "Réassigner" : "Assigner"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {growthUsers.length > 0 ? (
              growthUsers.map((user) => (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => assignToUser(user.id)}
                  disabled={isAssigning}
                  className={request.assigned_to === user.id ? "bg-blue-50" : ""}
                >
                  {user.name || user.email}
                  {request.assigned_to === user.id && " (Assigné)"}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                Aucun utilisateur Growth disponible
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      {/* Menu de gestion du statut - affiché si la demande est assignée */}
      {request.assigned_to && updateRequestWorkflowStatus && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline"
              size="sm"
              className="bg-green-50 border-green-200 hover:bg-green-100"
            >
              <ArrowRightLeft className="mr-2 h-4 w-4 text-green-600" /> Statut
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
              onClick={(e) => {
                e.preventDefault();
                handleDeleteRequest();
              }}
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
