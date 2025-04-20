
import { useState } from "react";
import { Request, RequestStatus } from "@/types/types";
import { TableCell, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { RequestTypeIcon } from "./RequestTypeIcon";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RequestRowProps {
  request: Request;
  missionView?: boolean;
  showSdr?: boolean;
  isSDR?: boolean;
  onRequestDeleted?: () => void;
}

export const RequestRow = ({ 
  request, 
  missionView = false, 
  showSdr = false,
  isSDR = false,
  onRequestDeleted 
}: RequestRowProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = user?.id === request.createdBy || user?.role === 'admin';

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', request.id);
      
      if (error) {
        console.error("Erreur lors de la suppression de la demande:", error);
        toast.error("Erreur lors de la suppression de la demande");
      } else {
        toast.success("Demande supprimée avec succès");
        setIsDeleteDialogOpen(false);
        onRequestDeleted?.();
      }
    } catch (error) {
      console.error("Exception lors de la suppression de la demande:", error);
      toast.error("Une erreur est survenue lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewRequest = () => {
    navigate(`/requests/${request.type}/${request.id}`);
  };

  const formatDueDate = (dateInput: Date | string) => {
    // Make sure we have a Date object
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    
    return new Intl.DateTimeFormat('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center">
            <RequestTypeIcon type={request.type} />
          </div>
        </TableCell>
        
        <TableCell className="font-medium">
          {request.title}
        </TableCell>
        
        {!missionView && !isSDR && (
          <TableCell>
            {request.missionName}
          </TableCell>
        )}
        
        {showSdr && (
          <TableCell>
            {request.sdrName || "-"}
          </TableCell>
        )}
        
        <TableCell>
          <RequestStatusBadge status={request.status as RequestStatus} />
        </TableCell>
        
        <TableCell>
          {formatDueDate(request.dueDate)}
        </TableCell>
        
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewRequest} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                Voir les détails
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuItem onClick={() => navigate(`/requests/${request.type}/${request.id}/edit`)} className="cursor-pointer">
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="space-y-4 py-2 text-center">
            <h3 className="text-lg font-semibold">Supprimer la demande</h3>
            <p>
              Êtes-vous sûr de vouloir supprimer la demande "{request.title}" ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
