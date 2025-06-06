
import { TableCell, TableRow } from "@/components/ui/table";
import { Request } from "@/types/types";
import { RequestTypeIcon } from "./RequestTypeIcon";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { deleteRequest } from "@/services/requests/deleteRequestService";
import { toast } from "sonner";
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
import { GrowthRequestActions } from "../../growth/table/GrowthRequestActions";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

interface RequestRowProps {
  request: Request;
  missionView?: boolean;
  showSdr?: boolean;
  isSDR?: boolean;
  onDeleted?: () => void;
  // Growth-specific props
  onEditRequest?: (request: Request) => void;
  onCompleteRequest?: (request: Request) => void;
  onViewDetails?: (request: Request) => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
  activeTab?: string;
}

export const RequestRow = ({ 
  request, 
  missionView = false, 
  showSdr = false, 
  isSDR = false,
  onDeleted,
  onEditRequest,
  onCompleteRequest,
  onViewDetails,
  assignRequestToMe,
  updateRequestWorkflowStatus,
  activeTab
}: RequestRowProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Détecter si on est sur la page Growth
  const isGrowthPage = location.pathname.includes('/growth');
  const isGrowthOrAdmin = user?.role === 'growth' || user?.role === 'admin';

  // DIAGNOSTIC COMPLET - Log toutes les données de la request
  console.log(`[RequestRow] 🚀 DIAGNOSTIC COMPLET pour request ${request.id}:`);
  console.log(`[RequestRow] - missionName: "${request.missionName}"`);
  console.log(`[RequestRow] - missionClient: "${request.missionClient}"`);
  console.log(`[RequestRow] - missionId: "${request.missionId}"`);
  console.log(`[RequestRow] - title: "${request.title}"`);

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, "d MMM yyyy", { locale: fr });
  };

  const getRequestTypeLabel = (type: string): string => {
    switch(type) {
      case "email": return "Campagne Email";
      case "database": return "Base de données";
      case "linkedin": return "Scraping LinkedIn";
      default: return type;
    }
  };

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

  const showDeleteButton = user?.role === "admin" || user?.role === "growth" || 
                           (user?.role === "sdr" && user?.id === request.createdBy);

  return (
    <TableRow>
      {/* Type */}
      <TableCell>
        <RequestTypeIcon type={request.type} />
      </TableCell>
      
      {/* Mission */}
      <TableCell className="font-medium">
        <div className="font-medium text-sm" title={request.missionName || "Sans mission"}>
          {request.missionName || "Sans mission"}
        </div>
      </TableCell>
      
      {/* Type de demande */}
      <TableCell>
        <Badge variant="outline" className="bg-gray-100">
          {getRequestTypeLabel(request.type)}
        </Badge>
      </TableCell>

      {/* Titre de la demande */}
      <TableCell>
        <div className="font-medium max-w-[200px] truncate" title={request.title}>
          {request.title}
        </div>
      </TableCell>
      
      {/* SDR (conditionnel) */}
      {showSdr && (
        <TableCell>
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4 text-muted-foreground"  />
            {request.sdrName || "Non assigné"}
          </div>
        </TableCell>
      )}
      
      {/* Assigné à */}
      <TableCell>
        <div className="flex items-center">
          <Users className="mr-1 h-4 w-4 text-muted-foreground" />
          {request.assignedToName || "Non assigné"}
        </div>
      </TableCell>
      
      {/* Plateforme d'emailing */}
      <TableCell>
        {request.type === "email" && request.details?.emailPlatform ? (
          <Badge variant="outline" className="bg-violet-50 text-violet-600">
            {request.details.emailPlatform}
          </Badge>
        ) : (
          <span className="text-muted-foreground">–</span>
        )}
      </TableCell>
      
      {/* Créée le */}
      <TableCell>{formatDate(request.createdAt)}</TableCell>
      
      {/* Date prévue */}
      <TableCell>{formatDate(request.dueDate)}</TableCell>
      
      {/* Statut */}
      <TableCell>
        <RequestStatusBadge 
          status={request.workflow_status || "pending_assignment"} 
          isLate={request.isLate} 
        />
      </TableCell>
      
      {/* Actions */}
      <TableCell className="text-right">
        {/* TOUJOURS utiliser GrowthRequestActions pour Growth et Admin */}
        {isGrowthOrAdmin ? (
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
        ) : (
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
        )}
      </TableCell>
    </TableRow>
  );
};
