
import { useQuery } from "@tanstack/react-query";
import { Mission, MissionType } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { mapSupaMissionToMission } from "@/services/missions/utils";
import { getAllMissions } from "@/services/missionService";
import { preloadMissionNames, KNOWN_MISSIONS } from "@/services/missionNameService";

export const useMissionData = (userId: string | undefined) => {
  const { data: missions = [], isLoading: isLoadingMissions } = useQuery<Mission[]>({
    queryKey: ['calendar-missions'],
    queryFn: async () => {
      try {
        console.log("[useMissionData] Fetching missions from Supabase");
        
        // First try to get missions from Supabase
        const { data, error } = await supabase
          .from("missions")
          .select("*");
        
        if (error) {
          console.error("[useMissionData] Error fetching missions:", error);
          // Fallback to service method if Supabase query fails
          console.log("[useMissionData] Falling back to getAllMissions service");
          return await getAllMissions();
        }
        
        if (!data || data.length === 0) {
          console.log("[useMissionData] No missions found in database, trying service fallback");
          return await getAllMissions();
        }
        
        console.log(`[useMissionData] Found ${data.length} missions in database`);
        
        // Précharger les noms de mission
        const missionIds = data
          .map(mission => mission.id)
          .filter((id): id is string => !!id);
          
        if (missionIds.length > 0) {
          await preloadMissionNames(missionIds);
        }
        
        // Utiliser le mapSupaMissionToMission pour transformer les données avec cohérence
        const mappedMissions = await Promise.all(data.map(mission => mapSupaMissionToMission(mission)));
        
        // On garde toujours les missions connues hardcodées comme fallback
        const knownMissionIds = Object.keys(KNOWN_MISSIONS);
        const hardcodedMissions: Mission[] = knownMissionIds
          .filter(id => !mappedMissions.some(m => m.id === id))
          .map(id => ({
            id: id,
            name: KNOWN_MISSIONS[id],
            sdrId: "unknown",
            description: "",
            createdAt: new Date(),
            sdrName: "System",
            requests: [],
            startDate: new Date(),
            endDate: null,
            type: "Full" as MissionType,
            status: "En cours",
            client: KNOWN_MISSIONS[id]
          }));
        
        // Merge Supabase missions with hardcoded ones to ensure coverage
        return [...mappedMissions, ...hardcodedMissions];
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
