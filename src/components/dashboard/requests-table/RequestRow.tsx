
import { TableCell, TableRow } from "@/components/ui/table";
import { Request } from "@/types/types";
import { RequestTypeIcon } from "./RequestTypeIcon";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RequestRowActions } from "./RequestRowActions";

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
        <RequestRowActions
          request={request}
          onDeleted={onDeleted}
          onEditRequest={onEditRequest}
          onCompleteRequest={onCompleteRequest}
          onViewDetails={onViewDetails}
          assignRequestToMe={assignRequestToMe}
          updateRequestWorkflowStatus={updateRequestWorkflowStatus}
          activeTab={activeTab}
          isSDR={isSDR}
        />
      </TableCell>
    </TableRow>
  );
};
