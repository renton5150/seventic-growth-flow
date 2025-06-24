
import { Eye, Edit, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteRequest } from "@/services/requests/deleteRequestService";
import { cloneRequest } from "@/services/requests/cloneRequestService";
import { toast } from "sonner";
import { Request } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";
import { GrowthRequestActions } from "../../growth/table/GrowthRequestActions";

interface RequestRowActionsProps {
  request: Request;
  onDeleted?: () => void;
  onEditRequest?: (request: Request) => void;
  onCompleteRequest?: (request: Request) => void;
  onViewDetails?: (request: Request) => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
  activeTab?: string;
  isSDR?: boolean;
  isArchived?: boolean;
}

export const RequestRowActions = ({
  request,
  onDeleted,
  onEditRequest,
  onCompleteRequest,
  onViewDetails,
  assignRequestToMe,
  updateRequestWorkflowStatus,
  activeTab,
  isSDR = false,
  isArchived = false
}: RequestRowActionsProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  
  const isGrowthOrAdmin = user?.role === 'growth' || user?.role === 'admin';
  const showDeleteButton = user?.role === "admin" || user?.role === "growth" || 
                           (user?.role === "sdr" && user?.id === request.createdBy);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteRequest(request.id);
      if (success) {
        toast.success("Demande supprimée avec succès");
        onDeleted?.();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClone = async () => {
    setIsCloning(true);
    try {
      console.log(`[RequestRowActions] 🚀 Début du clonage de la demande ${request.id}`);
      const clonedRequest = await cloneRequest(request.id);
      
      if (clonedRequest) {
        console.log(`[RequestRowActions] ✅ Demande clonée avec succès:`, clonedRequest);
        toast.success("Demande clonée avec succès");
        
        // Rediriger vers la nouvelle demande avec le bon pattern d'URL
        navigate(`/request/${clonedRequest.id}`);
      } else {
        console.error(`[RequestRowActions] ❌ Échec du clonage`);
        toast.error("Erreur lors du clonage de la demande");
      }
    } catch (error) {
      console.error(`[RequestRowActions] 💥 Erreur lors du clonage:`, error);
      toast.error("Erreur lors du clonage de la demande");
    } finally {
      setIsCloning(false);
    }
  };

  const handleView = () => {
    if (onViewDetails) {
      onViewDetails(request);
    } else {
      navigate(`/request/${request.id}`);
    }
  };

  const handleEdit = () => {
    if (onEditRequest) {
      onEditRequest(request);
    } else {
      navigate(`/request/${request.id}/edit`);
    }
  };

  // TOUJOURS utiliser GrowthRequestActions pour Growth et Admin (sauf en archives)
  if (isGrowthOrAdmin && !isArchived) {
    return (
      <GrowthRequestActions
        request={request}
        onEditRequest={onEditRequest || handleEdit}
        onCompleteRequest={onCompleteRequest || (() => {})}
        onViewDetails={onViewDetails || handleView}
        onRequestDeleted={onDeleted}
        assignRequestToMe={assignRequestToMe}
        updateRequestWorkflowStatus={updateRequestWorkflowStatus}
        activeTab={activeTab}
        showDeleteButton={showDeleteButton}
      />
    );
  }

  // Actions pour SDR, archives et autres cas
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleView}
        className="h-8 w-8"
        title="Voir les détails"
      >
        <Eye className="h-4 w-4" />
      </Button>
      
      {/* Bouton Clone - TOUJOURS visible */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClone}
        disabled={isCloning}
        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        title="Cloner la demande"
      >
        <Copy className="h-4 w-4" />
      </Button>
      
      {/* Bouton Edit - seulement si pas SDR et pas archivé */}
      {!isSDR && !isArchived && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEdit}
          className="h-8 w-8"
          title="Modifier"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      
      {/* Bouton Delete - selon permissions et pas archivé */}
      {showDeleteButton && !isArchived && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
