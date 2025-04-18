
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PlanningHeader, PlanningFilters } from "@/components/planning/PlanningHeader";
import { PlanningView } from "@/components/planning/PlanningView";
import { useQuery } from "@tanstack/react-query";
import { getAllMissions, getMissionsByUserId } from "@/services/missions-service";
import { useState, useEffect } from "react";
import { Mission } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";

const Planning = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [filters, setFilters] = useState<PlanningFilters>({
    view: "resourceTimelineMonth",
    sdrIds: [],
    missionTypes: [],
    dateRange: undefined
  });

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions', user?.id, isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        return await getAllMissions();
      } else if (user?.id) {
        return await getMissionsByUserId(user.id);
      }
      return [];
    },
    enabled: !!user
  });

  // Appliquer les filtres aux missions
  useEffect(() => {
    let filtered = [...missions];
    
    // Filtrer par SDR
    if (filters.sdrIds.length > 0) {
      filtered = filtered.filter(mission => filters.sdrIds.includes(mission.sdrId));
    }
    
    // Filtrer par type de mission
    if (filters.missionTypes.length > 0) {
      filtered = filtered.filter(mission => filters.missionTypes.includes(mission.type));
    }
    
    // Filtrer par plage de dates
    if (filters.dateRange) {
      const { from, to } = filters.dateRange;
      filtered = filtered.filter(mission => {
        // Vérifier si la mission se chevauche avec la plage de dates sélectionnée
        const missionStart = mission.startDate ? new Date(mission.startDate) : null;
        const missionEnd = mission.endDate ? new Date(mission.endDate) : null;
        
        if (!missionStart) return false;
        
        // Si pas de date de fin, on considère que la mission est toujours en cours
        if (!missionEnd) {
          return missionStart <= to;
        }
        
        // Vérifier le chevauchement
        return (missionStart <= to) && (missionEnd >= from);
      });
    }
    
    setFilteredMissions(filtered);
  }, [missions, filters]);

  const handleFiltersChange = (newFilters: PlanningFilters) => {
    setFilters(newFilters);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Planning</h2>
              <p className="text-muted-foreground">Vue d'ensemble des missions</p>
            </div>
            <div className="flex gap-4">
              <Skeleton className="w-[180px] h-10" />
              <Skeleton className="w-[180px] h-10" />
            </div>
          </div>
          <Skeleton className="w-full h-[600px]" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PlanningHeader 
          missions={missions} 
          onFiltersChange={handleFiltersChange} 
        />
        <PlanningView missions={filteredMissions} />
      </div>
    </AppLayout>
  );
};

export default Planning;
