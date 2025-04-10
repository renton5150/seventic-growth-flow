
import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const isAdmin = user?.role === "admin";
  const isGrowth = user?.role === "growth";
  const isSdr = user?.role === "sdr";

  // Utiliser un clé de cache stable
  const missionsQueryKey = ['missions', user?.id, isAdmin];
  
  // Configuration optimisée pour éviter les problèmes de rendu et de cache
  const { data: missions = [], isLoading, refetch } = useQuery({
    queryKey: missionsQueryKey,
    queryFn: async () => {
      try {
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
    staleTime: 1000, // Une seconde pour éviter les multiples rechargements
    gcTime: 3000,    // Conserver en cache un peu plus longtemps
    refetchOnWindowFocus: false, // Éviter les rechargements automatiques qui peuvent causer des problèmes
  });
    
  // Gestionnaire de rafraîchissement optimisé
  const handleRefreshMissions = useCallback(() => {
    // Supprimer complètement la requête du cache
    queryClient.removeQueries({queryKey: missionsQueryKey});
    
    // Relancer la requête après un court délai
    setTimeout(() => {
      refetch()
        .then(() => {
          toast.success("Liste des missions actualisée");
        })
        .catch(error => {
          console.error("Erreur lors du rafraîchissement des missions:", error);
          toast.error("Erreur lors de l'actualisation des missions");
        });
    }, 200);
  }, [refetch, queryClient, missionsQueryKey]);
  
  const handleViewMission = (mission: Mission) => {
    setSelectedMission(mission);
  };
  
  const handleCreateMissionClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleMissionUpdated = useCallback(() => {
    setSelectedMission(null);
    handleRefreshMissions();
  }, [handleRefreshMissions]);

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
          {(isSdr || isAdmin) && (
            <Button onClick={handleCreateMissionClick}>
              <Plus className="mr-2 h-4 w-4" /> {isAdmin ? "Nouvelle mission" : "Nouvelle mission"}
            </Button>
          )}
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
