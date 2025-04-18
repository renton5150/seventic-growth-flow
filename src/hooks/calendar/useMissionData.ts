
import { useQuery } from "@tanstack/react-query";
import { Mission } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { mapSupaMissionToMission } from "@/services/missions/utils";

export const useMissionData = (userId: string | undefined) => {
  const { data: missions = [], isLoading: isLoadingMissions } = useQuery<Mission[]>({
    queryKey: ['calendar-missions'],
    queryFn: async () => {
      try {
        console.log("[useMissionData] Fetching missions from Supabase");
        
        const { data, error } = await supabase
          .from("missions")
          .select("*");
        
        if (error) {
          console.error("[useMissionData] Error fetching missions:", error);
          return [];
        }
        
        if (!data || data.length === 0) {
          console.log("[useMissionData] No missions found in database");
          return [];
        }
        
        console.log(`[useMissionData] Found ${data.length} missions in database`);
        
        const mappedMissions = data.map(mission => mapSupaMissionToMission(mission));
        
        // Log each mission ID for debugging
        mappedMissions.forEach(mission => {
          console.log(`[useMissionData] Mapped mission: ID=${mission.id}, Name=${mission.name}`);
        });
        
        return mappedMissions;
      } catch (err) {
        console.error("[useMissionData] Exception during mission fetch:", err);
        return [];
      }
    },
    enabled: true,
    staleTime: 60000 // Cache missions for 1 minute
  });

  return { missions, isLoadingMissions };
};
