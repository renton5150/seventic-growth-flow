
import { AppLayout } from "@/components/layout/AppLayout";
import { GrowthDashboardContent } from "@/components/growth/dashboard/GrowthDashboardContent";
import { useGrowthDashboard } from "@/hooks/useGrowthDashboard";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

interface GrowthDashboardProps {
  defaultTab?: string;
}

const GrowthDashboard = ({ defaultTab }: GrowthDashboardProps) => {
  const location = useLocation();
  const {
    filteredRequests,
    allRequests: allGrowthRequests,
    activeTab,
    setActiveTab,
    handleOpenEditDialog: onEditRequest,
    handleOpenCompletionDialog: onCompleteRequest,
    handleViewDetails: onViewDetails,
    handleRequestUpdated: onRequestUpdated,
    handleRequestDeleted: onRequestDeleted,
    assignRequestToMe,
    updateRequestWorkflowStatus,
    activeFilter,
    setActiveFilter,
    handleStatCardClick
  } = useGrowthDashboard(defaultTab);

  // State for applied filters (since it's not in the hook)
  const [appliedFilters, setAppliedFilters] = useState<any>({});

  // Gérer les filtres venant de la navigation admin
  useEffect(() => {
    if (location.state) {
      console.log("[GrowthDashboard] 🔄 État de navigation reçu:", location.state);
      
      const { createdBy, assignedTo, userName, filterType, userId } = location.state;
      
      if (createdBy && filterType === 'sdr') {
        // Filtre pour SDR (par créateur)
        console.log(`[GrowthDashboard] 📋 Application filtre SDR pour ${userName} (${userId})`);
        setAppliedFilters(prev => ({
          ...prev,
          createdBy: userId,
          sdrName: userName
        }));
        setActiveTab("all");
      } else if (assignedTo && filterType === 'growth') {
        // Filtre pour Growth (par assigné)
        console.log(`[GrowthDashboard] 📋 Application filtre Growth pour ${userName} (${userId})`);
        setAppliedFilters(prev => ({
          ...prev,
          assignedTo: userId,
          assignedToName: userName
        }));
        setActiveTab("all");
      }
    }
  }, [location.state, setActiveTab]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
        </div>
        
        <GrowthDashboardContent
          allRequests={allGrowthRequests}
          filteredRequests={filteredRequests}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onEditRequest={onEditRequest}
          onCompleteRequest={onCompleteRequest}
          onViewDetails={onViewDetails}
          onRequestUpdated={onRequestUpdated}
          onRequestDeleted={onRequestDeleted}
          assignRequestToMe={assignRequestToMe}
          updateRequestWorkflowStatus={updateRequestWorkflowStatus}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          handleStatCardClick={handleStatCardClick}
        />
      </div>
    </AppLayout>
  );
};

export default GrowthDashboard;
