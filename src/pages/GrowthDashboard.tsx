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
    debugInfo,
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

  // Service pour calculer les stats (même logique que le filtrage)
  const filterService = new GrowthFilterService(user?.id);
  const statsCounts = filterService.calculateCounts(allRequests);

  // DIAGNOSTIC PRINCIPAL DE COHÉRENCE
  const expectedCount = filterService.filterRequests(currentFilter, allRequests).length;
  const actualCount = filteredRequests.length;
  const isConsistent = expectedCount === actualCount;

  console.log("[GrowthDashboard] 🔍 DIAGNOSTIC PRINCIPAL:");
  console.log(`  - Filtre actuel: ${currentFilter}`);
  console.log(`  - Demandes totales: ${allRequests.length}`);
  console.log(`  - Attendu (stats): ${expectedCount}`);
  console.log(`  - Reçu (tableau): ${actualCount}`);
  console.log(`  - Cohérent: ${isConsistent ? 'OUI' : 'NON'}`);

  if (!isConsistent) {
    console.error("[GrowthDashboard] ❌ INCOHÉRENCE DÉTECTÉE!");
    console.error("  - IDs attendus:", filterService.filterRequests(currentFilter, allRequests).map(r => r.id));
    console.error("  - IDs reçus:", filteredRequests.map(r => r.id));
  }

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

  // Panneau de diagnostic VISIBLE
  function renderLiveDiagnostic() {
    return (
      <div className={`mb-4 p-4 rounded-lg border-2 ${isConsistent ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`font-bold ${isConsistent ? 'text-green-900' : 'text-red-900'}`}>
            {isConsistent ? '✅ Cohérence Stats ↔ Tableau' : '❌ INCOHÉRENCE DÉTECTÉE!'}
          </h3>
          <span className="text-sm font-mono">
            Filtre: {currentFilter}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-2 bg-white rounded border">
            <div className="font-semibold">Total brut</div>
            <div className="text-lg">{allRequests.length}</div>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <div className="font-semibold">Attendu (stats)</div>
            <div className="text-lg">{expectedCount}</div>
          </div>
          <div className={`text-center p-2 rounded border ${isConsistent ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
            <div className="font-semibold">Affiché (tableau)</div>
            <div className="text-lg">{actualCount}</div>
          </div>
        </div>
        
        {!isConsistent && (
          <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-800">
            <strong>Différence détectée :</strong> {Math.abs(expectedCount - actualCount)} demande(s)
          </div>
        )}
      </div>
    );
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
        
        {/* DIAGNOSTIC EN TEMPS RÉEL VISIBLE */}
        {renderLiveDiagnostic()}
        
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
