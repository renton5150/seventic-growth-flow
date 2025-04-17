import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Request } from "@/types/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";
import { EmptyRequestsRow } from "../dashboard/requests-table/EmptyRequestsRow";
import { GrowthRequestStatusBadge } from "./table/GrowthRequestStatusBadge";
import { GrowthRequestActions } from "./table/GrowthRequestActions";
import { GrowthRequestTypeIcon } from "./table/GrowthRequestTypeIcon";
import { Badge } from "@/components/ui/badge";

interface GrowthRequestsTableProps {
  requests: Request[];
  onEditRequest: (request: Request) => void;
  onCompleteRequest: (request: Request) => void;
  onViewDetails: (request: Request) => void;
  onRequestUpdated: () => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
  activeTab?: string;
}

export function GrowthRequestsTable({
  requests,
  onEditRequest,
  onCompleteRequest,
  onViewDetails,
  onRequestUpdated,
  assignRequestToMe,
  updateRequestWorkflowStatus,
  activeTab = "all"
}: GrowthRequestsTableProps) {
  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMM yyyy", { locale: fr });
  };

  const getRequestTypeLabel = (type: string): string => {
    switch(type) {
      case "email": return "Campagne Email";
      case "database": return "Base de données";
      case "linkedin": return "Scraping LinkedIn";
      default: return type;
    }
  };

  console.log("Affichage des requêtes dans GrowthRequestsTable:", requests);
  if (requests && requests.length > 0) {
    console.log("Premier élément avec nom de mission:", requests[0].missionName);
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Type</TableHead>
            <TableHead>Titre</TableHead>
            <TableHead>Type de demande</TableHead>
            <TableHead>Mission</TableHead>
            <TableHead>Assigné à</TableHead>
            <TableCell>Créée le</TableCell>
            <TableCell>Date prévue</TableCell>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <EmptyRequestsRow colSpan={9} />
          ) : (
            requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="text-center">
                  <GrowthRequestTypeIcon type={request.type} />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{request.title}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-gray-100">
                    {getRequestTypeLabel(request.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">
                    {request.missionName || "Sans mission"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                    {request.assignedToName || "Non assigné"}
                  </div>
                </TableCell>
                <TableCell>{formatDate(request.createdAt)}</TableCell>
                <TableCell>{formatDate(request.dueDate)}</TableCell>
                <TableCell>
                  <GrowthRequestStatusBadge 
                    status={request.workflow_status || "pending_assignment"} 
                    isLate={request.isLate} 
                  />
                </TableCell>
                <TableCell className="text-right">
                  <GrowthRequestActions
                    request={request}
                    onEditRequest={onEditRequest}
                    onCompleteRequest={onCompleteRequest}
                    onViewDetails={onViewDetails}
                    assignRequestToMe={assignRequestToMe}
                    updateRequestWorkflowStatus={updateRequestWorkflowStatus}
                    activeTab={activeTab}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
