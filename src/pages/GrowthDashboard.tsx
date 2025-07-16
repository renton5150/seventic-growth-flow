
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGrowthDashboard } from "@/hooks/useGrowthDashboard";
import { GrowthDashboardContent } from "@/components/growth/dashboard/GrowthDashboardContent";

interface GrowthDashboardProps {
  defaultTab?: string;
}

const GrowthDashboard = ({ defaultTab }: GrowthDashboardProps) => {
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState("Dashboard Growth");
  
  // Récupérer les paramètres de navigation depuis l'admin
  const navigationState = location.state as any;
  
  console.log("[GrowthDashboard] 🚀 Chargement avec état de navigation:", navigationState);
  
  // Utiliser le hook complet du dashboard growth
  const {
    allRequests,
    filteredRequests,
    currentFilter,
    setCurrentFilter,
    handleStatClick,
    selectedRequest,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isCompletionDialogOpen,
    setIsCompletionDialogOpen,
    handleOpenEditDialog,
    handleOpenCompletionDialog,
    handleViewDetails,
    handleRequestUpdated,
    handleRequestDeleted,
    assignRequestToMe,
    updateRequestWorkflowStatus,
    specialFilters,
    clearSpecialFilters,
  } = useGrowthDashboard(defaultTab);

  // Appliquer le filtre depuis l'admin au chargement
  useEffect(() => {
    if (navigationState?.defaultFilter) {
      console.log(`[GrowthDashboard] 📊 Application du filtre admin: ${navigationState.defaultFilter}`);
      setCurrentFilter(navigationState.defaultFilter);
      
      // Définir le titre de la page selon le filtre
      if (navigationState.userName) {
        setPageTitle(`Demandes de ${navigationState.userName}`);
      }
    }
  }, [navigationState, setCurrentFilter]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{pageTitle}</h1>
            {navigationState?.fromAdmin && (
              <p className="text-sm text-muted-foreground mt-1">
                Navigation depuis le tableau de bord administrateur
              </p>
            )}
            {(specialFilters.sdrFilter || specialFilters.growthFilter || specialFilters.showUnassigned) && (
              <div className="mt-2">
                <button 
                  onClick={clearSpecialFilters}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                >
                  Supprimer le filtre utilisateur
                </button>
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredRequests.length} demande(s) trouvée(s)
          </div>
        </div>

        <GrowthDashboardContent
          allRequests={allRequests}
          filteredRequests={filteredRequests}
          activeTab={currentFilter}
          setActiveTab={setCurrentFilter}
          onEditRequest={handleOpenEditDialog}
          onCompleteRequest={handleOpenCompletionDialog}
          onViewDetails={handleViewDetails}
          onRequestUpdated={handleRequestUpdated}
          onRequestDeleted={handleRequestDeleted}
          assignRequestToMe={assignRequestToMe}
          updateRequestWorkflowStatus={updateRequestWorkflowStatus}
          activeFilter={currentFilter}
          setActiveFilter={setCurrentFilter}
          handleStatCardClick={handleStatClick}
          specialFilters={specialFilters}
        />
      </div>
    </AppLayout>
  );
};

export default GrowthDashboard;
