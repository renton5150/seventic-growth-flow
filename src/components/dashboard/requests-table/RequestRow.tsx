
import { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Request, RequestStatus, WorkflowStatus } from "@/types/types";
import { RequestTypeIcon } from "./RequestTypeIcon";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { Eye, Pencil, Trash, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RequestRowProps {
  request: Request;
  missionView?: boolean;
  showSdr?: boolean;
  isSDR?: boolean;
  onDeleted?: () => void;
}

export const RequestRow = ({
  request,
  missionView = false,
  showSdr = false,
  isSDR = false,
  onDeleted
}: RequestRowProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', request.id);

      if (error) {
        toast.error("Erreur lors de la suppression: " + error.message);
        return;
      }

      toast.success("Demande supprimée avec succès");
      setIsDialogOpen(false);
      if (onDeleted) onDeleted();
    } catch (error) {
      toast.error("Une erreur est survenue");
      console.error(error);
    }
  };

  const canEdit = user?.role === "admin" || user?.id === request.createdBy;
  const canDelete = user?.role === "admin";

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd MMM yyyy", { locale: fr });
    } catch (error) {
      console.error("Error formatting date:", error);
      return String(date);
    }
  };

  const viewDetails = () => {
    navigate(`/requests/${request.type}/${request.id}`);
  };

  const editRequest = () => {
    console.log("Édition de la demande:", request.id, "type:", request.type);
    
    switch (request.type) {
      case "email":
        navigate(`/requests/email/${request.id}/edit`);
        break;
      case "database":
        navigate(`/requests/database/${request.id}/edit`);
        break;
      case "linkedin":
        navigate(`/requests/linkedin/${request.id}/edit`);
        break;
      default:
        console.error("Type de demande inconnu:", request.type);
        toast.error("Type de demande non pris en charge");
    }
  };

  return (
    <TableRow>
      <TableCell>
        <RequestTypeIcon type={request.type} />
      </TableCell>
      
      <TableCell className="font-medium">
        {request.title}
      </TableCell>

      {/* Always show mission column */}
      <TableCell>{request.missionName || "Sans mission"}</TableCell>

      {showSdr && (
        <TableCell>{request.sdrName || "Non assigné"}</TableCell>
      )}

      <TableCell>
        <RequestStatusBadge status={request.workflow_status || request.status} isLate={request.isLate} />
      </TableCell>

      <TableCell>
        {formatDate(request.dueDate)}
      </TableCell>

      <TableCell>
        {formatDate(request.createdAt)}
      </TableCell>

      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={viewDetails}
          >
            <Eye className="h-4 w-4 mr-1" /> Voir
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={editRequest}
          >
            <Pencil className="h-4 w-4 mr-1" /> Éditer
          </Button>

          {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsDialogOpen(true)} className="text-destructive">
                  <Trash className="h-4 w-4 mr-2" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </TableCell>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Confirmer la suppression</h2>
            <p>
              Êtes-vous sûr de vouloir supprimer cette demande ? Cette action ne peut pas être annulée.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TableRow>
  );
};
