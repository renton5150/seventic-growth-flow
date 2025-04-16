
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

interface GrowthRequestsTableProps {
  requests: Request[];
  onEditRequest: (request: Request) => void;
  onCompleteRequest: (request: Request) => void;
  onRequestUpdated: () => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
  activeTab?: string;
}

export function GrowthRequestsTable({
  requests,
  onEditRequest,
  onCompleteRequest,
  onRequestUpdated,
  assignRequestToMe,
  updateRequestWorkflowStatus,
  activeTab = "all"
}: GrowthRequestsTableProps) {
  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMM yyyy", { locale: fr });
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Type</TableHead>
            <TableHead>Titre</TableHead>
            <TableHead>SDR</TableHead>
            <TableHead>Créée le</TableHead>
            <TableHead>Date prévue</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <EmptyRequestsRow colSpan={7} />
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
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                    {request.sdrName || "Non assigné"}
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
