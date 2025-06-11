
import { AppLayout } from "@/components/layout/AppLayout";
import { GrowthStatsCardsFixed } from "@/components/growth/stats/GrowthStatsCardsFixed";
import { GrowthActionsHeader } from "@/components/growth/actions/GrowthActionsHeader";
import { GrowthRequestsTable } from "@/components/growth/GrowthRequestsTable";
import { useGrowthDashboard } from "@/hooks/useGrowthDashboard";
import { useForceFiltering } from "@/hooks/useForceFiltering";
import { useEffect } from "react";

interface GrowthDashboardProps {
  defaultTab?: string;
}

const GrowthDashboard = ({ defaultTab }: GrowthDashboardProps) => {
  const {
    allRequests: allGrowthRequests,
    handleOpenEditDialog: onEditRequest,
    handleOpenCompletionDialog: onCompleteRequest,
    handleViewDetails: onViewDetails,
    handleRequestUpdated: onRequestUpdated,
    handleRequestDeleted: onRequestDeleted,
    assignRequestToMe,
    updateRequestWorkflowStatus,
    specialFilters,
    clearSpecialFilters
  } = useGrowthDashboard(defaultTab);

  const {
    forceFilter,
    applyForceFilter,
    getForceFilteredRequests,
    clearForceFilter
  } = useForceFiltering(allGrowthRequests);

  // Gestionnaire de clic pour les statistiques avec trace complète
  const handleStatClick = (filterType: string) => {
    console.log(`🔥🔥🔥 [GrowthDashboard] STAT CLICK REÇU: "${filterType}"`);
    console.log(`🔥🔥🔥 [GrowthDashboard] TYPE: ${typeof filterType}, JSON: ${JSON.stringify(filterType)}`);
    console.log(`🔥🔥🔥 [GrowthDashboard] About to call applyForceFilter with: "${filterType}"`);
    
    const result = applyForceFilter(filterType);
    
    console.log(`🔥🔥🔥 [GrowthDashboard] applyForceFilter returned: ${result}`);
    console.log(`🔥🔥🔥 [GrowthDashboard] STAT CLICK TERMINÉ pour: "${filterType}"`);
  };

  // Utiliser EXCLUSIVEMENT les demandes filtrées par le système useForceFiltering
  const finalFilteredRequests = getForceFilteredRequests();

  // Log de diagnostic détaillé
  useEffect(() => {
    console.log(`[GrowthDashboard] 🔍 RENDER STATE:`);
    console.log(`  - Force filter: ${forceFilter}`);
    console.log(`  - Total requests: ${allGrowthRequests.length}`);
    console.log(`  - Final filtered requests: ${finalFilteredRequests.length}`);
    
    if (forceFilter) {
      console.log(`[GrowthDashboard] 🎯 ACTIVE FILTER DETAILS:`);
      console.log(`  - Filter type: ${forceFilter}`);
      console.log(`  - Sample filtered:`, finalFilteredRequests.slice(0, 2).map(r => ({
        id: r.id,
        title: r.title,
        assigned_to: r.assigned_to,
        workflow_status: r.workflow_status
      })));
    }
  }, [forceFilter, allGrowthRequests, finalFilteredRequests]);

  // Afficher un en-tête de filtrage si des filtres spéciaux sont appliqués
  const renderFilterHeader = () => {
    if (specialFilters.showUnassigned) {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-orange-900">
                Demandes non assignées
              </h3>
              <p className="text-sm text-orange-700">
                Affichage uniquement des demandes qui ne sont pas encore assignées
              </p>
            </div>
            <button 
              onClick={clearSpecialFilters}
              className="text-orange-600 hover:text-orange-800 underline"
            >
              Supprimer le filtre
            </button>
          </div>
        </div>
      );
    }
    
    if (specialFilters.sdrFilter) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                Demandes créées par un SDR spécifique
              </h3>
              <p className="text-sm text-blue-700">
                Affichage des demandes créées par ce SDR uniquement
              </p>
            </div>
            <button 
              onClick={clearSpecialFilters}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Supprimer le filtre
            </button>
          </div>
        </div>
      );
    }
    
    if (specialFilters.growthFilter) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900">
                Demandes assignées à un Growth spécifique
              </h3>
              <p className="text-sm text-green-700">
                Affichage des demandes assignées à cette personne Growth uniquement
              </p>
            </div>
            <button 
              onClick={clearSpecialFilters}
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
          {forceFilter && (
            <button 
              onClick={clearForceFilter}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Effacer le filtre ({forceFilter})
            </button>
          )}
        </div>
        
        {renderFilterHeader()}
        
        <GrowthStatsCardsFixed 
          allRequests={allGrowthRequests} 
          onStatClick={handleStatClick}
          activeFilter={forceFilter}
        />
        
        <GrowthActionsHeader
          activeTab={forceFilter || "all"}
          setActiveTab={() => {}} // Désactivé car on utilise le force filtering
          totalRequests={finalFilteredRequests.length}
        />
        
        <GrowthRequestsTable
          requests={finalFilteredRequests}
          onEditRequest={onEditRequest}
          onCompleteRequest={onCompleteRequest}
          onViewDetails={onViewDetails}
          onRequestUpdated={onRequestUpdated}
          onRequestDeleted={onRequestDeleted}
          assignRequestToMe={assignRequestToMe}
          updateRequestWorkflowStatus={updateRequestWorkflowStatus}
          activeTab={forceFilter || "all"}
        />
      </div>
    </AppLayout>
  );
};

export default GrowthDashboard;
