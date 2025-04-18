
import { Request } from "@/types/types";
import { GrowthActionsHeader } from "@/components/growth/actions/GrowthActionsHeader";
import { GrowthRequestsTable } from "@/components/growth/GrowthRequestsTable";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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
  const location = useLocation();
  const { user } = useAuth();
  
  const isMyRequestsPage = location.pathname.includes("/my-requests");
  
  return (
    <>
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
