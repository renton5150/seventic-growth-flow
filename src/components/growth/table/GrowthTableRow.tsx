
import { TableCell, TableRow } from "@/components/ui/table";
import { Request } from "@/types/types";
import { GrowthRequestActions } from "./GrowthRequestActions";
import { useAuth } from "@/contexts/AuthContext";
import { GrowthRequestTypeIcon } from "./GrowthRequestTypeIcon";
import { GrowthRequestStatusBadge } from "./GrowthRequestStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface GrowthTableRowProps {
  request: Request;
  onEditRequest: (request: Request) => void;
  onCompleteRequest: (request: Request) => void;
  onViewDetails: (request: Request) => void;
  onRequestDeleted?: () => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
  activeTab?: string;
}

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

export function GrowthTableRow({
  request,
  onEditRequest,
  onCompleteRequest,
  onViewDetails,
  onRequestDeleted,
  assignRequestToMe,
  updateRequestWorkflowStatus,
  activeTab
}: GrowthTableRowProps) {
  const { user } = useAuth();
  const showDeleteButton = user?.role === "admin" || user?.role === "growth" || 
                           (user?.role === "sdr" && user?.id === request.createdBy);

  // AFFICHAGE DU NOM DE MISSION CORRIGÉ
  const displayMissionName = () => {
    console.log(`[GrowthTableRow] MISSION DEBUG pour request ${request.id}:`, {
      missionName: request.missionName,
      full_request: request
    });
    
    // Utiliser directement missionName qui a été formaté correctement
    const missionDisplay = request.missionName || "Sans mission";
    
    console.log(`[GrowthTableRow] FINAL mission display pour request ${request.id}: "${missionDisplay}"`);
    
    return (
      <div className="font-medium text-sm" title={missionDisplay}>
        {missionDisplay}
      </div>
    );
  };

  return (
    <TableRow>
      {/* Type */}
      <TableCell className="w-[50px]">
        <GrowthRequestTypeIcon type={request.type} />
      </TableCell>
      
      {/* Mission */}
      <TableCell className="font-medium">
        {displayMissionName()}
      </TableCell>
      
      {/* Type de demande */}
      <TableCell className="w-[150px]">
        <Badge variant="outline" className="bg-gray-100">
          {getRequestTypeLabel(request.type)}
        </Badge>
      </TableCell>
      
      {/* Titre de la demande */}
      <TableCell>
        <div className="font-medium text-sm max-w-[200px] truncate" title={request.title}>
          {request.title}
        </div>
      </TableCell>
      
      {/* SDR */}
      <TableCell>
        <div className="flex items-center">
          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
          {request.sdrName || "Non assigné"}
        </div>
      </TableCell>
      
      {/* Assigné à */}
      <TableCell>
        <div className="flex items-center">
          <Users className="mr-1 h-4 w-4 text-muted-foreground" />
          {request.assignedToName || "Non assigné"}
        </div>
      </TableCell>
      
      {/* Plateforme d'emailing */}
      <TableCell>
        {request.type === "email" && request.details?.emailPlatform
          ? (
            <Badge variant="outline" className="bg-violet-50 text-violet-600">
              {request.details.emailPlatform}
            </Badge>
          ) : (
            <span className="text-muted-foreground">–</span>
          )}
      </TableCell>
      
      {/* Créée le */}
      <TableCell>
        {formatDate(request.createdAt)}
      </TableCell>
      
      {/* Date prévue */}
      <TableCell>
        {formatDate(request.dueDate)}
      </TableCell>
      
      {/* Statut */}
      <TableCell>
        <GrowthRequestStatusBadge 
          status={request.workflow_status || "pending_assignment"} 
          isLate={request.isLate} 
        />
      </TableCell>
      
      {/* Actions */}
      <TableCell className="text-right">
        <GrowthRequestActions
          request={request}
          onEditRequest={onEditRequest}
          onCompleteRequest={onCompleteRequest}
          onViewDetails={onViewDetails}
          onRequestDeleted={onRequestDeleted}
          assignRequestToMe={assignRequestToMe}
          updateRequestWorkflowStatus={updateRequestWorkflowStatus}
          activeTab={activeTab}
          showDeleteButton={showDeleteButton}
        />
      </TableCell>
    </TableRow>
  );
}
