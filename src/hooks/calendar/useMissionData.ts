
import { useQuery } from "@tanstack/react-query";
import { Mission } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { mapSupaMissionToMission } from "@/services/missions/utils";

export const useMissionData = (userId: string | undefined) => {
  const { data: missions = [], isLoading: isLoadingMissions } = useQuery<Mission[]>({
    queryKey: ['calendar-missions'],
    queryFn: async () => {
      try {
        console.log("[DIAGNOSTIC] Récupération directe des missions depuis Supabase");
        const { data, error } = await supabase
          .from("missions")
          .select("*");
        
        if (error) {
          console.error("[DIAGNOSTIC] Erreur lors de la récupération directe des missions:", error);
          return [];
        }
        
        console.log("[DIAGNOSTIC] Données brutes des missions:", data);
        
        const mappedMissions = data.map(mission => {
          const mappedMission = mapSupaMissionToMission(mission);
          console.log("[DIAGNOSTIC] Mission mappée:", mission.id, "→", mappedMission.name);
          return mappedMission;
        });
        
        console.log(`[DIAGNOSTIC] ${mappedMissions.length} missions récupérées et mappées`);
        
        mappedMissions.forEach(mission => {
          console.log(`[DIAGNOSTIC] Mission: ID=${mission.id} (${typeof mission.id}), Nom=${mission.name}`);
        });
        
        return mappedMissions;
      } catch (err) {
        console.error("[DIAGNOSTIC] Exception lors de la récupération directe des missions:", err);
        return [];
      }
    },
    enabled: !!userId
  });

  return { missions, isLoadingMissions };
};
