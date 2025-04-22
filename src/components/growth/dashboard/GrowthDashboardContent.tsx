
import { Request } from "@/types/types";
import { GrowthStatsCards } from "@/components/growth/stats/GrowthStatsCards";
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
  activeFilter: string | null;
  setActiveFilter: (filter: string | null) => void;
  handleStatCardClick: (filterType: "all" | "pending" | "completed" | "late" | "inprogress") => void;
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
  updateRequestWorkflowStatus,
  activeFilter,
  setActiveFilter,
  handleStatCardClick
}: GrowthDashboardContentProps) => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isMyRequestsPage = location.pathname.includes("/my-requests");
  const isSDR = user?.role === 'sdr';
  
  // Pour un SDR, on filtre toujours pour ne montrer que ses propres demandes
  // Pour Growth et Admin, sur la page "Mes demandes", montrer selon le filtrage habituel
  // Sur les autres pages, montrer toutes les demandes
  const statsRequests = isSDR 
    ? allRequests.filter(req => req.createdBy === user?.id)
    : isMyRequestsPage 
      ? allRequests.filter(req => isMyRequestsPage)
      : allRequests;
  
  return (
    <>
      <GrowthStatsCards 
        allRequests={statsRequests} 
        onStatClick={handleStatCardClick}
        activeFilter={activeFilter}
      />
      
      <GrowthActionsHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalRequests={filteredRequests.length}
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
