
import { Request } from "@/types/types";
import { Table, TableBody } from "@/components/ui/table";
import { EmptyRequestsRow } from "../dashboard/requests-table/EmptyRequestsRow";
import { useGrowthRequestsFilters } from "@/hooks/useGrowthRequestsFilters";
import { GrowthTableHeader } from "./table/GrowthTableHeader";
import { GrowthTableRow } from "./table/GrowthTableRow";

interface GrowthRequestsTableProps {
  requests: Request[];
  onEditRequest: (request: Request) => void;
  onCompleteRequest: (request: Request) => void;
  onViewDetails: (request: Request) => void;
  onRequestUpdated: () => void;
  onRequestDeleted?: () => void; // Callback pour la suppression
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
  onRequestDeleted,
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
        <GrowthTableHeader
          typeFilter={typeFilter}
          missionFilter={missionFilter}
          assigneeFilter={assigneeFilter}
          statusFilter={statusFilter}
          sdrFilter={sdrFilter}
          createdDateFilter={createdDateFilter}
          dueDateFilter={dueDateFilter}
          setTypeFilter={setTypeFilter}
          setMissionFilter={setMissionFilter}
          setAssigneeFilter={setAssigneeFilter}
          setStatusFilter={setStatusFilter}
          setSdrFilter={setSdrFilter}
          handleCreatedDateFilterChange={handleCreatedDateFilterChange}
          handleDueDateFilterChange={handleDueDateFilterChange}
          uniqueTypes={uniqueTypes}
          uniqueMissions={uniqueMissions}
          uniqueAssignees={uniqueAssignees}
          uniqueStatuses={uniqueStatuses}
          uniqueSdrs={uniqueSdrs}
        />
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
                onRequestDeleted={onRequestDeleted}
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
