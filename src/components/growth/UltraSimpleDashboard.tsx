
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSimpleRequests } from "@/hooks/useSimpleRequests";
import { UltraSimpleTable } from "./table/UltraSimpleTable";
import { UltraSimpleStats } from "./stats/UltraSimpleStats";
import { SimpleFilterService, SimpleFilterType } from "@/services/filtering/simpleFilterService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const UltraSimpleDashboard = () => {
  const { user } = useAuth();
  const [currentFilter, setCurrentFilter] = useState<SimpleFilterType>('all');
  
  console.log("🔍 [DIAGNOSTIC] Rendu UltraSimpleDashboard");
  console.log("🔍 [DIAGNOSTIC] User:", user?.id, user?.email);
  console.log("🔍 [DIAGNOSTIC] CurrentFilter:", currentFilter);
  
  // Récupération des données avec logs détaillés
  const { data: allRequests = [], isLoading, error } = useSimpleRequests();
  
  console.log("🔍 [DIAGNOSTIC] Données du hook useSimpleRequests:");
  console.log("  - allRequests.length:", allRequests.length);
  console.log("  - isLoading:", isLoading);
  console.log("  - error:", error);
  console.log("  - allRequests (sample):", allRequests.slice(0, 3));
  
  // Service de filtrage avec logs
  const filterService = new SimpleFilterService(user?.id);
  const filteredRequests = filterService.filterRequests(currentFilter, allRequests);
  
  console.log("🔍 [DIAGNOSTIC] Après filtrage:");
  console.log("  - filteredRequests.length:", filteredRequests.length);
  console.log("  - filteredRequests IDs:", filteredRequests.map(r => r.id));
  
  // Gestionnaire de clic sur les statistiques
  const handleStatClick = (filterType: SimpleFilterType) => {
    console.log(`🔍 [DIAGNOSTIC] Clic sur statistique: "${filterType}"`);
    setCurrentFilter(filterType);
    toast.info(`Filtre appliqué: ${filterType}`);
  };
  
  // Fonction pour effacer le filtre
  const clearFilter = () => {
    console.log("🔍 [DIAGNOSTIC] Effacement du filtre");
    setCurrentFilter('all');
    toast.info("Filtre effacé");
  };
  
  if (error) {
    console.error("❌ [DIAGNOSTIC] Erreur dans UltraSimpleDashboard:", error);
    return (
      <AppLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-900 font-semibold">Erreur de chargement</h2>
            <p className="text-red-700">{error.message}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">DIAGNOSTIC - Dashboard Ultra-Simple</h1>
          {currentFilter !== 'all' && (
            <button 
              onClick={clearFilter}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Effacer le filtre ({currentFilter})
            </button>
          )}
        </div>
        
        {/* DIAGNOSTIC ULTRA-DÉTAILLÉ */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-900 font-semibold">
            🔍 DIAGNOSTIC DÉTAILLÉ
          </div>
          <div className="text-yellow-700 text-sm mt-2 space-y-1">
            <div><strong>Hook isLoading:</strong> {isLoading ? 'OUI' : 'NON'}</div>
            <div><strong>Hook error:</strong> {error ? 'OUI' : 'NON'}</div>
            <div><strong>Données brutes reçues:</strong> {allRequests.length} demandes</div>
            <div><strong>Filtre actuel:</strong> {currentFilter}</div>
            <div><strong>Après filtrage:</strong> {filteredRequests.length} demandes</div>
            <div><strong>User ID:</strong> {user?.id || 'Pas connecté'}</div>
            {allRequests.length > 0 && (
              <div className="text-xs mt-2">
                <div><strong>Premier ID:</strong> {allRequests[0]?.id}</div>
                <div><strong>Premier titre:</strong> {allRequests[0]?.title}</div>
                <div><strong>Premier type:</strong> {allRequests[0]?.type}</div>
                <div><strong>Premier workflow_status:</strong> {allRequests[0]?.workflow_status}</div>
              </div>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p>🔄 Chargement des données...</p>
          </div>
        ) : (
          <>
            <UltraSimpleStats 
              allRequests={allRequests} 
              onStatClick={handleStatClick}
              activeFilter={currentFilter}
            />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <strong>Transmission au tableau:</strong> {filteredRequests.length} demande(s)
                {filteredRequests.length > 0 && (
                  <span className="ml-2">
                    (IDs: {filteredRequests.map(r => r.id.substring(0, 8)).join(', ')})
                  </span>
                )}
              </div>
            </div>
            
            <UltraSimpleTable requests={filteredRequests} />
          </>
        )}
      </div>
    </AppLayout>
  );
};
