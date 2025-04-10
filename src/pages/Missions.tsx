
import { useState, useCallback, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Mission } from "@/types/types";
import { getAllMissions, getMissionsByUserId } from "@/services/missionService";
import { MissionsTable } from "@/components/missions/MissionsTable";
import { EmptyMissionState } from "@/components/missions/EmptyMissionState";
import { CreateMissionDialog } from "@/components/missions/CreateMissionDialog";
import { MissionDetailsDialog } from "@/components/missions/MissionDetailsDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Missions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const isAdmin = user?.role === "admin";
  const isGrowth = user?.role === "growth";
  const isSdr = user?.role === "sdr";

  // Configuration de la requête React Query
  const { 
    data: missions = [], 
    isLoading, 
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['missions', user?.id, isAdmin],
    queryFn: async () => {
      try {
        console.log("Exécution de la requête des missions");
        if (isAdmin) {
          return await getAllMissions();
        } else if (user?.id) {
          return await getMissionsByUserId(user.id);
        }
        return [];
      } catch (error) {
        console.error("Erreur lors du chargement des missions:", error);
        toast.error("Erreur lors du chargement des missions");
        return [];
      }
    },
    enabled: !!user,
    staleTime: 0, // Toujours considérer les données comme périmées
    refetchOnWindowFocus: false, // Ne pas recharger automatiquement lors du focus
    retry: 1, // Réessayer une seule fois en cas d'échec
  });
    
  // Effet pour nettoyer le cache lors du montage du composant
  useEffect(() => {
    console.log("Nettoyage du cache des missions au chargement de la page");
    queryClient.removeQueries({ queryKey: ['missions'] });
    queryClient.invalidateQueries({ queryKey: ['missions'] });
  }, [queryClient]);
  
  // Gestionnaire de rafraîchissement des missions
  const handleRefreshMissions = useCallback(() => {
    console.log("Rafraîchissement des missions demandé");
    setIsRefreshing(true);
    
    // Forcer un nettoyage complet du cache et un rechargement
    queryClient.removeQueries({ queryKey: ['missions'] });
    queryClient.invalidateQueries({ queryKey: ['missions'] });
    
    refetch()
      .then(() => {
        console.log("Liste des missions actualisée avec succès");
        toast.success("Liste des missions actualisée");
      })
      .catch(error => {
        console.error("Erreur lors du rafraîchissement des missions:", error);
        toast.error("Erreur lors de l'actualisation des missions");
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, [refetch, queryClient]);
  
  const handleViewMission = (mission: Mission) => {
    setSelectedMission(mission);
  };
  
  const handleCreateMissionClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleMissionUpdated = () => {
    console.log("Mission mise à jour, nettoyage du cache et rafraîchissement");
    setSelectedMission(null);
    handleRefreshMissions();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p>Chargement des missions...</p>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Missions</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefreshMissions} 
              disabled={isRefreshing || isRefetching}
              title="Actualiser les données"
              className="flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(isRefreshing || isRefetching) ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            
            {(isSdr || isAdmin) && (
              <Button onClick={handleCreateMissionClick}>
                <Plus className="mr-2 h-4 w-4" /> Nouvelle mission
              </Button>
            )}
          </div>
        </div>
        
        {missions.length === 0 ? (
          <EmptyMissionState 
            isSdr={isSdr} 
            onCreateMission={handleCreateMissionClick} 
          />
        ) : (
          <MissionsTable 
            missions={missions} 
            isAdmin={isAdmin} 
            onViewMission={handleViewMission}
            showAdminActions={isAdmin}
            onRefresh={handleRefreshMissions}
          />
        )}
        
        {/* Dialogs */}
        <CreateMissionDialog 
          userId={user?.id || ''} 
          open={isCreateModalOpen} 
          onOpenChange={setIsCreateModalOpen} 
          onSuccess={handleRefreshMissions} 
          isAdmin={isAdmin}
        />
        
        <MissionDetailsDialog 
          mission={selectedMission} 
          open={!!selectedMission} 
          onOpenChange={(open) => !open && setSelectedMission(null)} 
          isAdmin={isAdmin}
          isSdr={isSdr}
          onMissionUpdated={handleMissionUpdated}
        />
      </div>
    </AppLayout>
  );
};

export default Missions;
