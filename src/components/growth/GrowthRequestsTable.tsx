
import { Request } from "@/types/types";
import { Table, TableBody } from "@/components/ui/table";
import { EmptyRequestsRow } from "../dashboard/requests-table/EmptyRequestsRow";
import { useGrowthRequestsFilters } from "@/hooks/useGrowthRequestsFilters";
import { GrowthTableRow } from "./table/GrowthTableRow";

// Import a simpler header component
import { TableHeader } from "@/components/ui/table";

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
  const {
    filteredRequests,
    typeFilter,
    missionFilter,
    assigneeFilter,
    statusFilter,
    createdDateFilter,
    dueDateFilter,
    setTypeFilter,
    setMissionFilter,
    setAssigneeFilter,
    setStatusFilter,
    handleCreatedDateFilterChange,
    handleDueDateFilterChange,
    uniqueTypes,
    uniqueMissions,
    uniqueAssignees,
    uniqueStatuses,
    uniqueSdrs,
    sdrFilter,
    setSdrFilter
  } = useGrowthRequestsFilters(requests);

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <tr>
            <th>Type</th>
            <th>Mission</th>
            <th>Titre</th>
            <th>SDR</th>
            <th>Assigné à</th>
            <th>Statut</th>
            <th>Date limite</th>
            <th>Créé le</th>
            <th>Actions</th>
          </tr>
        </TableHeader>
        <TableBody>
          {filteredRequests.length === 0 ? (
            <EmptyRequestsRow colSpan={10} />
          ) : (
            filteredRequests.map((request) => (
              <GrowthTableRow
                key={request.id}
                request={request}
                onEditRequest={onEditRequest}
                onCompleteRequest={onCompleteRequest}
                onViewDetails={onViewDetails}
                assignRequestToMe={assignRequestToMe}
                updateRequestWorkflowStatus={updateRequestWorkflowStatus}
                activeTab={activeTab}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
