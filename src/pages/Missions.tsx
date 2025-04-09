
import { useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const Missions = () => {
  const { user } = useAuth();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const isAdmin = user?.role === "admin";
  const isGrowth = user?.role === "growth";
  const isSdr = user?.role === "sdr";

  console.log("Page Missions - utilisateur:", user);

  // Utiliser react-query pour gérer les missions
  const { data: missions = [], isLoading, refetch } = useQuery({
    queryKey: ['missions', user?.id, isAdmin],
    queryFn: async () => {
      try {
        console.log("Chargement des missions pour", isAdmin ? "admin" : "sdr", "avec ID:", user?.id);
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
    enabled: !!user
  });
    
  // Handlers
  const handleRefreshMissions = () => {
    console.log("Missions: Rafraîchissement des missions");
    // Force React Query to refetch data
    refetch().then(() => {
      console.log("Missions: Données rechargées après rafraîchissement");
    }).catch(error => {
      console.error("Erreur lors du rafraîchissement des missions:", error);
    });
  };
  
  const handleViewMission = (mission: Mission) => {
    console.log("Affichage de la mission:", mission);
    setSelectedMission(mission);
  };
  
  const handleCreateMissionClick = () => {
    console.log("Ouverture de la modal de création de mission");
    setIsCreateModalOpen(true);
  };

  const handleMissionUpdated = () => {
    console.log("Mission mise à jour, rafraîchissement de la liste");
    setSelectedMission(null);
    refetch().then(() => {
      console.log("Missions: Données rechargées après mise à jour de mission");
      toast.success("Liste des missions actualisée");
    });
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
          onMissionUpdated={handleRefreshMissions}
        />
      </div>
    </AppLayout>
  );
};

export default Missions;
