
import { AppLayout } from "@/components/layout/AppLayout";
import { GrowthStatsCardsFixed } from "@/components/growth/stats/GrowthStatsCardsFixed";
import { GrowthActionsHeader } from "@/components/growth/actions/GrowthActionsHeader";
import { GrowthRequestsTable } from "@/components/growth/GrowthRequestsTable";
import { useGrowthDashboard } from "@/hooks/useGrowthDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GrowthFilterService } from "@/services/filtering/growthFilterService";

interface GrowthDashboardProps {
  defaultTab?: string;
}

const GrowthDashboard = ({ defaultTab }: GrowthDashboardProps) => {
  const { user } = useAuth();
  
  const {
    allRequests,
    filteredRequests,
    currentFilter,
    handleStatClick,
    handleOpenEditDialog: onEditRequest,
    handleOpenCompletionDialog: onCompleteRequest,
    handleViewDetails: onViewDetails,
    handleRequestUpdated: onRequestUpdated,
    handleRequestDeleted: onRequestDeleted,
    assignRequestToMe,
    updateRequestWorkflowStatus,
    specialFilters,
    clearSpecialFilters,
  } = useGrowthDashboard(defaultTab);

  // Messages français pour chaque filtre
  const FILTER_MESSAGES: Record<string, string> = {
    'all': 'Affichage de toutes les demandes',
    'to_assign': 'Affichage des demandes en attente d\'assignation',
    'my_assignments': 'Affichage de mes demandes à traiter',
    'completed': 'Affichage des demandes terminées',
    'late': 'Affichage des demandes en retard',
    'pending': 'Affichage des demandes en attente',
    'inprogress': 'Affichage des demandes en cours'
  };

  // Service pour calculer les stats
  const filterService = new GrowthFilterService(user?.id);
  const statsCounts = filterService.calculateCounts(allRequests);

  console.log("[GrowthDashboard] 🎯 SYSTÈME SIMPLIFIÉ:");
  console.log(`  - Filtre actuel: ${currentFilter}`);
  console.log(`  - Demandes totales: ${allRequests.length}`);
  console.log(`  - Demandes filtrées: ${filteredRequests.length}`);
  console.log(`  - Stats pour ${currentFilter}: ${statsCounts[currentFilter as keyof typeof statsCounts]}`);

  // Gestionnaire de clic sur les statistiques avec toast
  const handleStatClickWithToast = (filterType: string) => {
    console.log(`[GrowthDashboard] 🎯 CLIC sur filtre: "${filterType}"`);
    handleStatClick(filterType);
    
    const message = FILTER_MESSAGES[filterType] || `Filtre appliqué: ${filterType}`;
    toast.info(message);
  };

  // Fonction pour effacer le filtre
  const clearFilter = () => {
    handleStatClick("all");
    toast.info("Tous les filtres ont été effacés");
  };

  // Afficher un en-tête de filtrage si des filtres spéciaux sont appliqués
  function renderFilterHeader() {
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
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          {currentFilter !== 'all' && (
            <button 
              onClick={clearFilter}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Effacer le filtre ({currentFilter})
            </button>
          )}
        </div>
        
        {/* DIAGNOSTIC SIMPLIFIÉ */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-900 font-semibold">
            ✅ Système simplifié actif
          </div>
          <div className="text-blue-700 text-sm mt-1">
            Filtre: {currentFilter} | Total: {allRequests.length} | Filtrées: {filteredRequests.length} | Attendu: {statsCounts[currentFilter as keyof typeof statsCounts]}
          </div>
        </div>
        
        {renderFilterHeader()}
        
        <GrowthStatsCardsFixed 
          allRequests={allRequests} 
          onStatClick={handleStatClickWithToast}
          activeFilter={currentFilter}
        />
        
        <GrowthActionsHeader
          activeTab={currentFilter}
          setActiveTab={() => {}} // Désactivé car on utilise le nouveau système
          totalRequests={filteredRequests.length}
        />
        
        <GrowthRequestsTable
          requests={filteredRequests}
          onEditRequest={onEditRequest}
          onCompleteRequest={onCompleteRequest}
          onViewDetails={onViewDetails}
          onRequestUpdated={onRequestUpdated}
          onRequestDeleted={onRequestDeleted}
          assignRequestToMe={assignRequestToMe}
          updateRequestWorkflowStatus={updateRequestWorkflowStatus}
          activeTab={currentFilter}
        />
      </div>
    </AppLayout>
  );
};

export default GrowthDashboard;
