
import { useQuery } from "@tanstack/react-query";
import { fetchRequests } from "@/services/requests/requestQueryService";
import { fixTargetRoleService } from "@/services/requests/fixTargetRoleService";

export const useToAssignRequests = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['requests-to-assign', userId],
    queryFn: async () => {
      if (!userId) {
        console.log("[useToAssignRequests] Pas d'userId fourni");
        return [];
      }
      
      try {
        console.log("[useToAssignRequests] Récupération des demandes à assigner");
        
        // CORRECTION: Vérifier et corriger les target_role manquants au démarrage
        console.log("[useToAssignRequests] 🔧 Vérification des target_role...");
        const stats = await fixTargetRoleService.checkTargetRoleStatus();
        
        // Si il y a des demandes database/linkedin sans target_role, les corriger
        if (stats.database.withoutTargetRole > 0 || stats.linkedin.withoutTargetRole > 0) {
          console.log("[useToAssignRequests] 🔧 Correction automatique des target_role manquants...");
          const fixResult = await fixTargetRoleService.fixDatabaseAndLinkedInRequests();
          console.log("[useToAssignRequests] 🔧 Résultat correction:", fixResult);
        }
        
        const requests = await fetchRequests({
          assignedToIsNull: true,
          workflowStatus: 'pending_assignment'
        });
        console.log(`[useToAssignRequests] ${requests.length} demandes à assigner récupérées`);
        return requests;
      } catch (error) {
        console.error("[useToAssignRequests] Erreur:", error);
        return [];
      }
    },
    enabled: !!userId,
    refetchInterval: 5000, // Réduire l'intervalle pour une meilleure réactivité
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
