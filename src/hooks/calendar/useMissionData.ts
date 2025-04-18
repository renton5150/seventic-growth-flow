
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
        
        // Récupération complète des missions sans filtre
        const { data, error } = await supabase
          .from("missions")
          .select("*");
        
        if (error) {
          console.error("[DIAGNOSTIC] Erreur lors de la récupération des missions:", error);
          return [];
        }
        
        console.log("[DIAGNOSTIC] Données brutes des missions:", data);
        
        // Assurons-nous que le mappage est correct
        const mappedMissions = data.map(mission => {
          const mappedMission = mapSupaMissionToMission(mission);
          console.log(`[DIAGNOSTIC] Mission mappée: ID=${mission.id} → Nom=${mappedMission.name}`);
          return mappedMission;
        });
        
        console.log(`[DIAGNOSTIC] Total: ${mappedMissions.length} missions récupérées`);
        
        // Affichons en détail chaque mission pour le débogage
        mappedMissions.forEach(mission => {
          console.log(`[DIAGNOSTIC] Mission détaillée: ID=${mission.id} (${typeof mission.id}), Nom=${mission.name}`);
        });
        
        return mappedMissions;
      } catch (err) {
        console.error("[DIAGNOSTIC] Exception lors de la récupération des missions:", err);
        return [];
      }
    },
    enabled: true // On récupère toujours les missions, même sans userId
  });

  return { missions, isLoadingMissions };
};
