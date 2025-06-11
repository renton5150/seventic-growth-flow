
import { AppLayout } from "@/components/layout/AppLayout";
import { GrowthStatsCardsFixed } from "@/components/growth/stats/GrowthStatsCardsFixed";
import { GrowthActionsHeader } from "@/components/growth/actions/GrowthActionsHeader";
import { GrowthRequestsTable } from "@/components/growth/GrowthRequestsTable";
import { useGrowthDashboard } from "@/hooks/useGrowthDashboard";
import { useEffect, useState, useCallback } from "react";
import { Request } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface GrowthDashboardProps {
  defaultTab?: string;
}

// Mapping explicite des filtres vers les messages français
const FILTER_MESSAGES = {
  'all': 'toutes les demandes',
  'to_assign': 'demandes en attente d\'assignation',
  'my_assignments': 'mes demandes à traiter',
  'completed': 'demandes terminées',
  'late': 'demandes en retard',
  'pending': 'demandes en attente',
  'inprogress': 'demandes en cours'
} as const;

type FilterType = keyof typeof FILTER_MESSAGES;

const GrowthDashboard = ({ defaultTab }: GrowthDashboardProps) => {
  const { user } = useAuth();
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');

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

  // Fonction de filtrage simple et directe
  const getFilteredRequests = useCallback((filterType: FilterType, requests: Request[]): Request[] => {
    console.log(`🔍 [GrowthDashboard] Filtrage pour: "${filterType}" sur ${requests.length} demandes`);
    
    switch (filterType) {
      case 'all':
        return requests;
        
      case 'to_assign':
        const toAssign = requests.filter(req => 
          !req.assigned_to || 
          req.assigned_to === '' || 
          req.assigned_to === null || 
          req.assigned_to === 'Non assigné'
        );
        console.log(`🎯 Filtre "to_assign": ${toAssign.length} demandes trouvées`);
        return toAssign;
        
      case 'my_assignments':
        const myRequests = requests.filter(req => 
          req.assigned_to === user?.id || 
          req.assigned_to === user?.email || 
          req.assigned_to === user?.name
        );
        console.log(`🎯 Filtre "my_assignments": ${myRequests.length} demandes trouvées`);
        return myRequests;
        
      case 'completed':
        const completed = requests.filter(req => req.workflow_status === 'completed');
        console.log(`🎯 Filtre "completed": ${completed.length} demandes trouvées`);
        return completed;
        
      case 'late':
        const late = requests.filter(req => req.isLate);
        console.log(`🎯 Filtre "late": ${late.length} demandes trouvées`);
        return late;
        
      case 'pending':
        const pending = requests.filter(req => 
          req.status === "pending" || req.workflow_status === "pending_assignment"
        );
        console.log(`🎯 Filtre "pending": ${pending.length} demandes trouvées`);
        return pending;
        
      case 'inprogress':
        const inProgress = requests.filter(req => req.workflow_status === "in_progress");
        console.log(`🎯 Filtre "inprogress": ${inProgress.length} demandes trouvées`);
        return inProgress;
        
      default:
        console.warn(`🚨 Filtre inconnu: "${filterType}"`);
        return requests;
    }
  }, [user]);

  // Gestionnaire de clic sur les statistiques - SIMPLE ET DIRECT
  const handleStatClick = useCallback((filterType: string) => {
    console.log(`🚨🚨🚨 [GrowthDashboard] STAT CLICK REÇU: "${filterType}"`);
    
    // Vérifier que le filtre existe
    if (!(filterType in FILTER_MESSAGES)) {
      console.error(`🚨 Filtre invalide: "${filterType}"`);
      toast.error(`Filtre inconnu: ${filterType}`);
      return;
    }

    const filter = filterType as FilterType;
    
    // Si on clique sur le même filtre, le désactiver
    if (currentFilter === filter) {
      console.log(`🎯 Désactivation du filtre: "${filter}"`);
      setCurrentFilter('all');
      toast.info("Filtre désactivé");
      return;
    }

    // Appliquer le nouveau filtre
    console.log(`🎯 Application du filtre: "${filter}"`);
    setCurrentFilter(filter);
    
    // Afficher le message correct en français
    const message = FILTER_MESSAGES[filter];
    console.log(`📢 Toast message: "Filtrage appliqué: ${message}"`);
    toast.info(`Filtrage appliqué: ${message}`);
  }, [currentFilter]);

  // Calculer les demandes filtrées
  const filteredRequests = getFilteredRequests(currentFilter, allGrowthRequests);

  // Log de diagnostic
  useEffect(() => {
    console.log(`[GrowthDashboard] 🔍 ÉTAT ACTUEL:`);
    console.log(`  - Filtre actuel: "${currentFilter}"`);
    console.log(`  - Message correspondant: "${FILTER_MESSAGES[currentFilter]}"`);
    console.log(`  - Total demandes: ${allGrowthRequests.length}`);
    console.log(`  - Demandes filtrées: ${filteredRequests.length}`);
  }, [currentFilter, allGrowthRequests, filteredRequests]);

  // Fonction pour effacer le filtre
  const clearFilter = useCallback(() => {
    console.log(`🎯 CLEAR FILTER`);
    setCurrentFilter('all');
    toast.info("Filtre effacé");
  }, []);

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
          {currentFilter !== 'all' && (
            <button 
              onClick={clearFilter}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Effacer le filtre ({FILTER_MESSAGES[currentFilter]})
            </button>
          )}
        </div>
        
        {renderFilterHeader()}
        
        <GrowthStatsCardsFixed 
          allRequests={allGrowthRequests} 
          onStatClick={handleStatClick}
          activeFilter={currentFilter}
        />
        
        <GrowthActionsHeader
          activeTab={currentFilter}
          setActiveTab={() => {}} // Désactivé car on utilise le nouveau système de filtrage
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
