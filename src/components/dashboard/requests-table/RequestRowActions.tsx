
import { Eye, Edit, Trash2 } from "lucide-react";
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
  isSDR = false
}: RequestRowActionsProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  const handleView = () => {
    if (onViewDetails) {
      onViewDetails(request);
    } else {
      navigate(`/requests/${request.type}/${request.id}`);
    }
  };

  const handleEdit = () => {
    if (onEditRequest) {
      onEditRequest(request);
    } else {
      navigate(`/requests/${request.type}/${request.id}/edit`);
    }
  };

  // TOUJOURS utiliser GrowthRequestActions pour Growth et Admin
  if (isGrowthOrAdmin) {
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

  // Actions pour SDR et autres
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleView}
        className="h-8 w-8"
      >
        <Eye className="h-4 w-4" />
      </Button>
      
      {!isSDR && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEdit}
          className="h-8 w-8"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      
      {showDeleteButton && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
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
