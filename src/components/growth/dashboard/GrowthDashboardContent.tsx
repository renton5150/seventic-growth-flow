import { Request } from "@/types/types";
import { GrowthStatsCards } from "@/components/growth/stats/GrowthStatsCards";
import { GrowthActionsHeader } from "@/components/growth/actions/GrowthActionsHeader";
import { GrowthRequestsTable } from "@/components/growth/GrowthRequestsTable";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

interface GrowthDashboardContentProps {
  allRequests: Request[];
  filteredRequests: Request[];
  activeTab: string;
  activeFilter: string | null;
  setActiveTab: (tab: string) => void;
  onEditRequest: (request: Request) => void;
  onCompleteRequest: (request: Request) => void;
  onViewDetails: (request: Request) => void;
  onRequestUpdated: () => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
  onStatClick?: (filterType: "all" | "pending" | "completed" | "late" | "inprogress") => void;
}

export const GrowthDashboardContent = ({
  allRequests,
  filteredRequests,
  activeTab,
  activeFilter,
  setActiveTab,
  onEditRequest,
  onCompleteRequest,
  onViewDetails,
  onRequestUpdated,
  assignRequestToMe,
  updateRequestWorkflowStatus,
  onStatClick
}: GrowthDashboardContentProps) => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isMyRequestsPage = location.pathname.includes("/my-requests");

  // Log current state for debugging
  useEffect(() => {
    console.log("[DEBUG] GrowthDashboardContent - Current state:", {
      activeTab,
      activeFilter,
      requestsCount: filteredRequests.length,
      allRequestsCount: allRequests.length
    });
  }, [activeTab, activeFilter, filteredRequests, allRequests]);

  // Function to handle stat card clicks
  const handleStatCardClick = (filterType: "all" | "pending" | "completed" | "late" | "inprogress") => {
    console.log("[DEBUG] GrowthDashboardContent - Stat card clicked:", filterType);
    
    if (onStatClick) {
      onStatClick(filterType);
    } else {
      // Default behavior if no onStatClick provided
      switch (filterType) {
        case "pending":
          setActiveTab("pending");
          break;
        case "completed":
          setActiveTab("completed");
          break;
        case "late":
          setActiveTab("late");
          break;
        case "inprogress":
          setActiveTab("inprogress");
          break;
        default:
          setActiveTab("all");
      }
      console.log("[DEBUG] GrowthDashboardContent - Set active tab to:", filterType);
    }
  };
  
  return (
    <>
      <GrowthStatsCards 
        allRequests={allRequests} 
        onStatClick={handleStatCardClick}
        activeFilter={activeFilter}
      />
      
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
