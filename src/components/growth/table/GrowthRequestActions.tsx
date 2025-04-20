
import { Button } from "@/components/ui/button";
import { Request } from "@/types/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, CheckCircle, XCircle, ArrowRightLeft, Eye } from "lucide-react";
import { toast } from "sonner";
import { GrowthRequestAssignMenu } from "./GrowthRequestAssignMenu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface GrowthRequestActionsProps {
  request: Request;
  onEditRequest: (request: Request) => void;
  onCompleteRequest: (request: Request) => void;
  onViewDetails?: (request: Request) => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
  activeTab?: string;
}

export function GrowthRequestActions({
  request,
  onEditRequest,
  onCompleteRequest,
  onViewDetails,
  assignRequestToMe,
  updateRequestWorkflowStatus,
  activeTab
}: GrowthRequestActionsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGrowthOrAdmin = user?.role === 'growth' || user?.role === 'admin';
  
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
    </div>
  );
}
