import { AppLayout } from "@/components/layout/AppLayout";
import { GrowthStatsCardsFixed } from "@/components/growth/stats/GrowthStatsCardsFixed";
import { GrowthActionsHeader } from "@/components/growth/actions/GrowthActionsHeader";
import { GrowthRequestsTable } from "@/components/growth/GrowthRequestsTable";
import { ConsistencyChecker } from "@/components/debug/ConsistencyChecker";
import { useGrowthDashboard } from "@/hooks/useGrowthDashboard";
import { useState, useCallback } from "react";
import { Request } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface GrowthDashboardProps {
  defaultTab?: string;
}

const GrowthDashboard = ({ defaultTab }: GrowthDashboardProps) => {
  const { user } = useAuth();
  const [currentFilter, setCurrentFilter] = useState<string>("all");

  const {
    allRequests,
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

  // CORRECTION CRITIQUE : Appliquer d'abord le même filtrage de base que dans GrowthStatsCardsFixed
  const getActiveRequests = useCallback((requests: Request[]): Request[] => {
    return requests.filter(req => 
      req.workflow_status !== 'completed' && req.workflow_status !== 'canceled'
    );
  }, []);

  // Fonction de filtrage UNIFIÉE - CORRIGÉE pour être cohérente avec les stats
  const getFilteredRequests = useCallback((filterType: string, requests: Request[]): Request[] => {
    console.log(`[GrowthDashboard] 🔍 FILTRAGE "${filterType}" sur ${requests.length} demandes`);
    
    let filtered: Request[] = [];
    
    // CORRECTION : Pour tous les filtres sauf "completed", utiliser les demandes actives comme base
    const baseRequests = filterType === 'completed' ? requests : getActiveRequests(requests);
    
    switch (filterType) {
      case 'all':
        filtered = baseRequests;
        break;
        
      case 'to_assign':
        // EXACTEMENT la même logique que dans GrowthStatsCardsFixed
        filtered = baseRequests.filter(req => 
          !req.assigned_to || 
          req.assigned_to === '' || 
          req.assigned_to === null || 
          req.assigned_to === 'Non assigné'
        );
        break;
        
      case 'my_assignments':
        filtered = baseRequests.filter(req => 
          req.assigned_to === user?.id || 
          req.assigned_to === user?.email || 
          req.assigned_to === user?.name
        );
        break;
        
      case 'completed':
        // CORRECTION : Pour completed, utiliser toutes les demandes mais filtrer par workflow_status
        filtered = requests.filter(req => req.workflow_status === 'completed');
        break;
        
      case 'late':
        filtered = baseRequests.filter(req => req.isLate);
        break;
        
      case 'pending':
        filtered = baseRequests.filter(req => 
          req.status === "pending" || req.workflow_status === "pending_assignment"
        );
        break;
        
      case 'inprogress':
        filtered = baseRequests.filter(req => req.workflow_status === "in_progress");
        break;
        
      default:
        filtered = baseRequests;
    }
    
    console.log(`[GrowthDashboard] ✅ RÉSULTAT filtrage "${filterType}": ${filtered.length} demandes`);
    
    return filtered;
  }, [user, getActiveRequests]);

  // Gestionnaire de clic sur les statistiques
  const handleStatClick = useCallback((filterType: string) => {
    console.log(`[GrowthDashboard] 🎯 CLIC sur filtre: "${filterType}"`);
    
    setCurrentFilter(filterType);
    
    const message = FILTER_MESSAGES[filterType] || `Filtre appliqué: ${filterType}`;
    toast.info(message);
  }, []);

  // Calculer les demandes filtrées
  const filteredRequests = getFilteredRequests(currentFilter, allRequests);

  // Fonction pour effacer le filtre
  const clearFilter = useCallback(() => {
    setCurrentFilter("all");
    toast.info("Tous les filtres ont été effacés");
  }, []);

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
              Effacer le filtre ({currentFilter})
            </button>
          )}
        </div>
        
        {renderFilterHeader()}
        
        {/* COMPOSANT DE DIAGNOSTIC - TOUJOURS VISIBLE */}
        <ConsistencyChecker 
          allRequests={allRequests}
          getFilteredRequests={getFilteredRequests}
        />
        
        <GrowthStatsCardsFixed 
          allRequests={allRequests} 
          onStatClick={handleStatClick}
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
