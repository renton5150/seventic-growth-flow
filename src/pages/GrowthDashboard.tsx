
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
        setAppliedFilters({
          createdBy: userId,
          sdrName: userName
        });
        setActiveTab("all");
      } else if (assignedTo && filterType === 'growth') {
        // Filtre pour Growth (par assigné)
        console.log(`[GrowthDashboard] 📋 Application filtre Growth pour ${userName} (${userId})`);
        setAppliedFilters({
          assignedTo: userId,
          assignedToName: userName
        });
        setActiveTab("all");
      }
    }
  }, [location.state, setActiveTab]);

  // Filtrer les demandes selon les filtres appliqués
  const getFilteredRequestsWithAppliedFilters = () => {
    let requests = filteredRequests;
    
    if (appliedFilters.createdBy) {
      // Filtrer par créateur (pour SDR)
      console.log(`[GrowthDashboard] 🔍 Filtrage par createdBy: ${appliedFilters.createdBy}`);
      requests = requests.filter(req => req.createdBy === appliedFilters.createdBy);
      console.log(`[GrowthDashboard] ✅ ${requests.length} demandes après filtrage SDR`);
    } else if (appliedFilters.assignedTo) {
      // Filtrer par assigné (pour Growth)
      console.log(`[GrowthDashboard] 🔍 Filtrage par assignedTo: ${appliedFilters.assignedTo}`);
      requests = requests.filter(req => req.assigned_to === appliedFilters.assignedTo);
      console.log(`[GrowthDashboard] ✅ ${requests.length} demandes après filtrage Growth`);
    }
    
    return requests;
  };

  const finalFilteredRequests = getFilteredRequestsWithAppliedFilters();

  // Afficher un en-tête de filtrage si des filtres sont appliqués
  const renderFilterHeader = () => {
    if (appliedFilters.sdrName) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                Demandes créées par {appliedFilters.sdrName}
              </h3>
              <p className="text-sm text-blue-700">
                Affichage des demandes créées par ce SDR uniquement
              </p>
            </div>
            <button 
              onClick={() => setAppliedFilters({})}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Supprimer le filtre
            </button>
          </div>
        </div>
      );
    }
    
    if (appliedFilters.assignedToName) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900">
                Demandes assignées à {appliedFilters.assignedToName}
              </h3>
              <p className="text-sm text-green-700">
                Affichage des demandes assignées à cette personne Growth uniquement
              </p>
            </div>
            <button 
              onClick={() => setAppliedFilters({})}
              className="text-green-600 hover:text-green-800 underline"
            >
              Supprimer le filtre
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
        </div>
        
        {renderFilterHeader()}
        
        <GrowthDashboardContent
          allRequests={allGrowthRequests}
          filteredRequests={finalFilteredRequests}
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
