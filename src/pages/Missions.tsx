
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Mission } from "@/types/types";
import { getAllMissions } from "@/services/missionService";
import { MissionsTable } from "@/components/missions/MissionsTable";
import { EmptyMissionState } from "@/components/missions/EmptyMissionState";
import { CreateMissionDialog } from "@/components/missions/CreateMissionDialog";
import { MissionDetailsDialog } from "@/components/missions/MissionDetailsDialog";

const Missions = () => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>(getAllMissions());
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const isAdmin = user?.role === "admin";
  const isSdr = user?.role === "sdr";
  
  // Filter missions based on user role
  const filteredMissions = isAdmin 
    ? missions
    : missions.filter(mission => mission.sdrId === user?.id);
    
  // Handlers
  const handleRefreshMissions = () => {
    setMissions(getAllMissions());
  };
  
  const handleViewMission = (mission: Mission) => {
    setSelectedMission(mission);
  };
  
  const handleCreateMissionClick = () => {
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
        
        {filteredMissions.length === 0 ? (
          <EmptyMissionState 
            isSdr={isSdr} 
            onCreateMission={handleCreateMissionClick} 
          />
        ) : (
          <MissionsTable 
            missions={filteredMissions} 
            isAdmin={isAdmin} 
            onViewMission={handleViewMission} 
          />
        )}
        
        {/* Dialogs */}
        <CreateMissionDialog 
          userId={user?.id || ''} 
          open={isCreateModalOpen} 
          onOpenChange={setIsCreateModalOpen} 
          onSuccess={handleRefreshMissions} 
        />
        
        <MissionDetailsDialog 
          mission={selectedMission} 
          open={!!selectedMission} 
          onOpenChange={(open) => !open && setSelectedMission(null)} 
          isSdr={isSdr} 
        />
      </div>
    </AppLayout>
  );
};

export default Missions;
