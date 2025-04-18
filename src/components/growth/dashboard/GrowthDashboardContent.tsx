
import { Request } from "@/types/types";
import { GrowthStatsCards } from "@/components/growth/stats/GrowthStatsCards";
import { GrowthActionsHeader } from "@/components/growth/actions/GrowthActionsHeader";
import { GrowthRequestsTable } from "@/components/growth/GrowthRequestsTable";

interface GrowthDashboardContentProps {
  allRequests: Request[];
  filteredRequests: Request[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onEditRequest: (request: Request) => void;
  onCompleteRequest: (request: Request) => void;
  onViewDetails: (request: Request) => void;
  onRequestUpdated: () => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
}

export const GrowthDashboardContent = ({
  allRequests,
  filteredRequests,
  activeTab,
  setActiveTab,
  onEditRequest,
  onCompleteRequest,
  onViewDetails,
  onRequestUpdated,
  assignRequestToMe,
  updateRequestWorkflowStatus
}: GrowthDashboardContentProps) => {
  return (
    <>
      <GrowthStatsCards allRequests={allRequests} />
      
      <GrowthActionsHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalRequests={allRequests.length}
      />
      
      <GrowthRequestsTable
        requests={filteredRequests}
        onEditRequest={onEditRequest}
        onCompleteRequest={onCompleteRequest}
        onViewDetails={onViewDetails}
        onRequestUpdated={onRequestUpdated}
        assignRequestToMe={assignRequestToMe}
        updateRequestWorkflowStatus={updateRequestWorkflowStatus}
        activeTab={activeTab}
      />
    </>
  );
};
