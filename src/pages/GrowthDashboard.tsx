
import { AppLayout } from "@/components/layout/AppLayout";
import { GrowthDashboardContent } from "@/components/growth/dashboard/GrowthDashboardContent";
import { useGrowthDashboard } from "@/hooks/useGrowthDashboard";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const GrowthDashboard = () => {
  const location = useLocation();
  const {
    filteredRequests,
    allGrowthRequests,
    activeTab,
    setActiveTab,
    onEditRequest,
    onCompleteRequest,
    onViewDetails,
    onRequestUpdated,
    onRequestDeleted,
    assignRequestToMe,
    updateRequestWorkflowStatus,
    activeFilter,
    setActiveFilter,
    handleStatCardClick,
    appliedFilters,
    setAppliedFilters
  } = useGrowthDashboard();

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
        setActiveTab("toutes");
      } else if (assignedTo && filterType === 'growth') {
        // Filtre pour Growth (par assigné)
        console.log(`[GrowthDashboard] 📋 Application filtre Growth pour ${userName} (${userId})`);
        setAppliedFilters(prev => ({
          ...prev,
          assignedTo: userId,
          assignedToName: userName
        }));
        setActiveTab("toutes");
      }
    }
  }, [location.state, setAppliedFilters, setActiveTab]);

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
