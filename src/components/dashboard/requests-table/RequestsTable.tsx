
import { Request } from "@/types/types";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RequestRow } from "./RequestRow";
import { EmptyRequestsRow } from "./EmptyRequestsRow";

interface RequestsTableProps {
  requests: Request[];
  onDeleted?: () => void;
  showSdr?: boolean;
  isSDR?: boolean;
  isArchived?: boolean; // Nouveau prop pour les archives
  // Growth-specific props
  onEditRequest?: (request: Request) => void;
  onCompleteRequest?: (request: Request) => void;
  onViewDetails?: (request: Request) => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
  activeTab?: string;
}

export const RequestsTable = ({
  requests,
  onDeleted,
  showSdr = false,
  isSDR = false,
  isArchived = false, // Nouveau prop avec valeur par défaut
  onEditRequest,
  onCompleteRequest,
  onViewDetails,
  assignRequestToMe,
  updateRequestWorkflowStatus,
  activeTab
}: RequestsTableProps) => {
  if (!requests || requests.length === 0) {
    return <EmptyRequestsRow />;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Type</TableHead>
            <TableHead>Mission</TableHead>
            <TableHead>Type de demande</TableHead>
            <TableHead>Titre</TableHead>
            {showSdr && <TableHead>SDR</TableHead>}
            <TableHead>Assigné à</TableHead>
            <TableHead>Plateforme</TableHead>
            <TableHead>Créée le</TableHead>
            <TableHead>Date prévue</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              showSdr={showSdr}
              isSDR={isSDR}
              isArchived={isArchived} // Transmettre le prop
              onDeleted={onDeleted}
              onEditRequest={onEditRequest}
              onCompleteRequest={onCompleteRequest}
              onViewDetails={onViewDetails}
              assignRequestToMe={assignRequestToMe}
              updateRequestWorkflowStatus={updateRequestWorkflowStatus}
              activeTab={activeTab}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
