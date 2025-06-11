
import { AppLayout } from "@/components/layout/AppLayout";
import { GrowthStatsCardsFixed } from "@/components/growth/stats/GrowthStatsCardsFixed";
import { GrowthActionsHeader } from "@/components/growth/actions/GrowthActionsHeader";
import { GrowthRequestsTable } from "@/components/growth/GrowthRequestsTable";
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
  const [activeFilter, setActiveFilter] = useState<string>("all");

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

  // Fonction de filtrage simple
  const getFilteredRequests = useCallback((filterType: string, requests: Request[]): Request[] => {
    console.log(`[GrowthDashboard] Filtrage "${filterType}" sur ${requests.length} demandes`);
    
    switch (filterType) {
      case 'all':
        return requests;
        
      case 'to_assign':
        return requests.filter(req => 
          !req.assigned_to || 
          req.assigned_to === '' || 
          req.assigned_to === null || 
          req.assigned_to === 'Non assigné'
        );
        
      case 'my_assignments':
        return requests.filter(req => 
          req.assigned_to === user?.id || 
          req.assigned_to === user?.email || 
          req.assigned_to === user?.name
        );
        
      case 'completed':
        return requests.filter(req => req.workflow_status === 'completed');
        
      case 'late':
        return requests.filter(req => req.isLate);
        
      case 'pending':
        return requests.filter(req => 
          req.status === "pending" || req.workflow_status === "pending_assignment"
        );
        
      case 'inprogress':
        return requests.filter(req => req.workflow_status === "in_progress");
        
      default:
        return requests;
    }
  }, [user]);

  // Gestionnaire de clic sur les statistiques
  const handleStatClick = useCallback((filterType: string) => {
    console.log(`[GrowthDashboard] Clic sur filtre: "${filterType}"`);
    
    if (activeFilter === filterType) {
      setActiveFilter("all");
      toast.info("Filtre désactivé");
      return;
    }

    setActiveFilter(filterType);
    
    // Messages français corrects
    const messages: Record<string, string> = {
      'all': 'toutes les demandes',
      'to_assign': 'demandes en attente d\'assignation',
      'my_assignments': 'mes demandes à traiter',
      'completed': 'demandes terminées',
      'late': 'demandes en retard',
      'pending': 'demandes en attente',
      'inprogress': 'demandes en cours'
    };
    
    const message = messages[filterType] || filterType;
    toast.info(`Filtrage appliqué: ${message}`);
  }, [activeFilter]);

  // Calculer les demandes filtrées
  const filteredRequests = getFilteredRequests(activeFilter, allRequests);

  // Fonction pour effacer le filtre
  const clearFilter = useCallback(() => {
    setActiveFilter("all");
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
          {activeFilter !== 'all' && (
            <button 
              onClick={clearFilter}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Effacer le filtre
            </button>
          )}
        </div>
        
        {renderFilterHeader()}
        
        <GrowthStatsCardsFixed 
          allRequests={allRequests} 
          onStatClick={handleStatClick}
          activeFilter={activeFilter}
        />
        
        <GrowthActionsHeader
          activeTab={activeFilter}
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
          activeTab={activeFilter}
        />
      </div>
    </AppLayout>
  );
};

export default GrowthDashboard;
