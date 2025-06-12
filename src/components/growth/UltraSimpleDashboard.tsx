
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
  
  // Récupération des données avec le nouveau système SIMPLE
  const { data: allRequests = [], isLoading, error } = useSimpleRequests();
  
  // Service de filtrage SIMPLE - seulement les filtres qui marchent
  const filterService = new SimpleFilterService(user?.id);
  const filteredRequests = filterService.filterRequests(currentFilter, allRequests);
  
  console.log("[UltraSimpleDashboard] 🎯 SYSTÈME ULTRA-SIMPLE ACTIF");
  console.log(`  - Total demandes brutes: ${allRequests.length}`);
  console.log(`  - Filtre actuel: ${currentFilter}`);
  console.log(`  - Demandes filtrées: ${filteredRequests.length}`);
  console.log(`  - Loading: ${isLoading}`);
  console.log(`  - Error: ${error ? 'OUI' : 'NON'}`);
  
  // Gestionnaire de clic sur les statistiques
  const handleStatClick = (filterType: SimpleFilterType) => {
    console.log(`[UltraSimpleDashboard] 🎯 CLIC sur filtre: "${filterType}"`);
    setCurrentFilter(filterType);
    toast.info(`Filtre appliqué: ${filterType}`);
  };
  
  // Fonction pour effacer le filtre
  const clearFilter = () => {
    setCurrentFilter('all');
    toast.info("Filtre effacé");
  };
  
  if (error) {
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
          <h1 className="text-2xl font-bold">Tableau de bord ULTRA-SIMPLE - SEULEMENT CE QUI MARCHE</h1>
          {currentFilter !== 'all' && (
            <button 
              onClick={clearFilter}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Effacer le filtre ({currentFilter})
            </button>
          )}
        </div>
        
        {/* DIAGNOSTIC AFFICHAGE DONNÉES */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-900 font-semibold">
            ✅ SYSTÈME RADICAL - SEULEMENT LA LOGIQUE QUI FONCTIONNE
          </div>
          <div className="text-green-700 text-sm mt-2 space-y-1">
            <div><strong>Total brut:</strong> {allRequests.length} demandes</div>
            <div><strong>Filtre actuel:</strong> {currentFilter}</div>
            <div><strong>Après filtrage:</strong> {filteredRequests.length} demandes</div>
            <div><strong>Statut chargement:</strong> {isLoading ? 'En cours...' : 'Terminé'}</div>
            {allRequests.length > 0 && (
              <div className="text-xs">
                <strong>Premiers IDs:</strong> {allRequests.slice(0, 3).map(r => r.id.substring(0, 8)).join(', ')}
              </div>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p>Chargement des données...</p>
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
                <strong>Affichage:</strong> {filteredRequests.length} demande(s) pour le filtre "{currentFilter}"
              </div>
            </div>
            
            <UltraSimpleTable requests={filteredRequests} />
          </>
        )}
      </div>
    </AppLayout>
  );
};
