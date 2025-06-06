
import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Mission } from "@/types/types";
import { getAllMissions } from "@/services/missions-service"; 
import { getMissionsByUserId } from "@/services/missions-service";
import { MissionsTable } from "@/components/missions/MissionsTable";
import { EmptyMissionState } from "@/components/missions/EmptyMissionState";
import { CreateMissionDialog } from "@/components/missions/CreateMissionDialog";
import { MissionDetailsDialog } from "@/components/missions/MissionDetailsDialog";
import { EditMissionDialog } from "@/components/missions/EditMissionDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Missions = () => {
  const { user } = useAuth();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();
  
  const isAdmin = user?.role === "admin";
  const isSdr = user?.role === "sdr";
  const isGrowth = user?.role === "growth";
  
  // Admin, SDR et Growth peuvent créer des missions
  const canCreateMission = isAdmin || isSdr || isGrowth;
  
  // Admin et Growth voient toutes les missions, SDR ne voit que les siennes
  const canViewAllMissions = isAdmin || isGrowth;

  console.log("Page Missions - utilisateur:", user, "canViewAllMissions:", canViewAllMissions);

  const handleRefreshMissions = useCallback(() => {
    console.log("Rafraîchissement des missions");
    queryClient.invalidateQueries({ 
      queryKey: ['missions', user?.id, canViewAllMissions],
    });
    setRefreshKey(prev => prev + 1);
  }, [queryClient, user?.id, canViewAllMissions]);

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions', user?.id, canViewAllMissions, refreshKey],
    queryFn: async () => {
      try {
        console.log("Chargement des missions pour", canViewAllMissions ? "admin/growth" : "sdr", "avec ID:", user?.id);
        if (canViewAllMissions) {
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
    enabled: !!user
  });
    
  const handleViewMission = (mission: Mission) => {
    console.log("Affichage de la mission:", mission);
    setSelectedMission(mission);
  };
  
  const handleEditMission = (mission: Mission) => {
    console.log("Modification de la mission:", mission);
    setSelectedMission({...mission});
    setIsEditModalOpen(true);
  };
  
  const handleCreateMissionClick = () => {
    console.log("Ouverture de la modal de création de mission");
    setIsCreateModalOpen(true);
  };

  const handleMissionUpdated = () => {
    console.log("Mission mise à jour, rafraîchissement programmé");
    setTimeout(() => {
      handleRefreshMissions();
    }, 500);
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
  
  console.log("Missions chargées:", missions);
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Missions</h1>
          {canCreateMission && (
            <Button onClick={handleCreateMissionClick}>
              <Plus className="mr-2 h-4 w-4" /> Nouvelle mission
            </Button>
          )}
        </div>
        
        {missions.length === 0 ? (
          <EmptyMissionState 
            isSdr={canCreateMission} 
            onCreateMission={handleCreateMissionClick} 
          />
        ) : (
          <MissionsTable 
            missions={missions} 
            isAdmin={canViewAllMissions} 
            onViewMission={handleViewMission}
            onEditMission={canCreateMission ? handleEditMission : undefined}
          />
        )}
        
        <CreateMissionDialog 
          open={isCreateModalOpen} 
          onOpenChange={setIsCreateModalOpen} 
          onSuccess={handleRefreshMissions} 
        />
        
        <MissionDetailsDialog 
          mission={selectedMission} 
          open={!!selectedMission && !isEditModalOpen} 
          onOpenChange={(open) => !open && setSelectedMission(null)} 
          isSdr={canCreateMission} 
        />

        <EditMissionDialog
          mission={selectedMission}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onMissionUpdated={handleMissionUpdated}
        />
      </div>
    </AppLayout>
  );
};

export default Missions;
