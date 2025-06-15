
import { Request } from "@/types/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { GrowthRequestTypeIcon } from "./GrowthRequestTypeIcon";
import { GrowthRequestStatusBadge } from "./GrowthRequestStatusBadge";
import { GrowthRequestActions } from "./GrowthRequestActions";

interface SimpleRequestsTableProps {
  requests: Request[];
  onEditRequest?: (request: Request) => void;
  onCompleteRequest?: (request: Request) => void;
  onViewDetails?: (request: Request) => void;
  onRequestUpdated?: () => void;
  onRequestDeleted?: () => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
}

export const SimpleRequestsTable = ({
  requests,
  onEditRequest,
  onCompleteRequest,
  onViewDetails,
  onRequestUpdated,
  onRequestDeleted,
  assignRequestToMe,
  updateRequestWorkflowStatus
}: SimpleRequestsTableProps) => {
  console.log("[SimpleRequestsTable] 🎯 Affichage de", requests.length, "demandes");
  
  // Fonction pour formater la date avec l'heure exacte
  const formatDateWithTime = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, "d MMM yyyy à HH:mm", { locale: fr });
  };
  
  // Diagnostic simple
  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucune demande à afficher pour ce filtre</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Titre</TableHead>
            <TableHead>Mission</TableHead>
            <TableHead>SDR</TableHead>
            <TableHead>Assigné à</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="min-w-[140px]">Créée le</TableHead>
            <TableHead className="min-w-[140px]">Échéance</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <GrowthRequestTypeIcon type={request.type} />
              </TableCell>
              <TableCell>
                <div className="max-w-xs">
                  <div className="font-medium">{request.title}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs">
                  <div className="font-medium">{request.missionName}</div>
                  {request.missionClient && (
                    <div className="text-sm text-gray-500">{request.missionClient}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{request.sdrName}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {request.assignedToName || (
                    <Badge variant="outline" className="text-orange-600">
                      Non assigné
                    </Badge>
                  )}
                </span>
              </TableCell>
              <TableCell>
                <GrowthRequestStatusBadge 
                  status={request.workflow_status}
                  isLate={request.isLate}
                />
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {formatDateWithTime(request.createdAt)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {formatDateWithTime(request.dueDate)}
                  {request.isLate && (
                    <Badge variant="destructive" className="ml-2">
                      En retard
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <GrowthRequestActions
                  request={request}
                  onEditRequest={onEditRequest}
                  onCompleteRequest={onCompleteRequest}
                  onViewDetails={onViewDetails}
                  onRequestDeleted={onRequestDeleted}
                  assignRequestToMe={assignRequestToMe}
                  updateRequestWorkflowStatus={updateRequestWorkflowStatus}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
