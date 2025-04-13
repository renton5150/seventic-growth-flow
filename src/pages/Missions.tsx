
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { Mission } from "@/types/types";
import { CreateMissionDialog } from "@/components/missions/CreateMissionDialog";
import { MissionDetailsDialog } from "@/components/missions/MissionDetailsDialog";
import { EditMissionDialog } from "@/components/missions/EditMissionDialog";
import { MissionsListView } from "@/components/missions/MissionsListView";
import { useQueryClient } from "@tanstack/react-query";

const Missions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const isAdmin = user?.role === "admin";
  const isSdr = user?.role === "sdr";

  // Fonction pour rafraîchir les données
  const refreshMissions = () => {
    console.log("Rafraîchissement des missions");
    queryClient.invalidateQueries({ 
      queryKey: ['missions'],
      refetchType: 'all'
    });
  };
  
  // Handlers
  const handleViewMission = (mission: Mission) => {
    console.log("Navigation vers la page de détail de la mission:", mission.id);
    navigate(`/missions/${mission.id}`);
  };
  
  const handleEditMission = (mission: Mission) => {
    console.log("Modification de la mission:", mission);
    setSelectedMission(mission);
    setIsEditModalOpen(true);
  };
  
  const handleCreateMissionClick = () => {
    console.log("Ouverture de la modal de création de mission");
    setIsCreateModalOpen(true);
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Missions</h1>
          {isSdr && (
            <Button onClick={handleCreateMissionClick}>
              <Plus className="mr-2 h-4 w-4" /> Nouvelle mission
            </Button>
          )}
        </div>
        
        <MissionsListView
          userId={user?.id}
          isAdmin={isAdmin}
          isSdr={isSdr}
          onCreateMission={handleCreateMissionClick}
          onViewMission={handleViewMission}
          onEditMission={isSdr ? handleEditMission : undefined}
          onMissionUpdated={refreshMissions}
        />
        
        {/* Dialogs */}
        <CreateMissionDialog 
          open={isCreateModalOpen} 
          onOpenChange={setIsCreateModalOpen} 
          onSuccess={refreshMissions} 
        />
        
        <EditMissionDialog
          mission={selectedMission}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onMissionUpdated={refreshMissions}
        />
      </div>
    </AppLayout>
  );
};

export default Missions;
