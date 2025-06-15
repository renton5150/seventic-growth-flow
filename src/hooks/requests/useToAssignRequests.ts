
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
        console.log("[useToAssignRequests] 🔧 DÉBUT - Vérification et correction des target_role...");
        
        // 1. D'abord vérifier le statut actuel
        const stats = await fixTargetRoleService.checkTargetRoleStatus();
        console.log("[useToAssignRequests] 📊 Statut actuel:", stats);
        
        // 2. Si il y a des demandes database/linkedin sans target_role, les corriger IMMÉDIATEMENT
        if (stats.database.withoutTargetRole > 0 || stats.linkedin.withoutTargetRole > 0) {
          console.log("[useToAssignRequests] 🚨 CORRECTION IMMÉDIATE nécessaire!");
          const fixResult = await fixTargetRoleService.forceFixAllRequests();
          console.log("[useToAssignRequests] 🔧 Résultat correction forcée:", fixResult);
        } else {
          console.log("[useToAssignRequests] ✅ Aucune correction nécessaire");
        }
        
        // 3. Récupérer les demandes à assigner après correction
        console.log("[useToAssignRequests] 📋 Récupération des demandes à assigner...");
        const requests = await fetchRequests({
          assignedToIsNull: true,
          workflowStatus: 'pending_assignment'
        });
        
        console.log(`[useToAssignRequests] ✅ ${requests.length} demandes à assigner récupérées`);
        
        // 4. Diagnostic des demandes récupérées
        const databaseRequests = requests.filter(r => r.type === 'database');
        const linkedinRequests = requests.filter(r => r.type === 'linkedin');
        console.log(`[useToAssignRequests] 📊 Diagnostic final: ${databaseRequests.length} database, ${linkedinRequests.length} linkedin`);
        
        return requests;
      } catch (error) {
        console.error("[useToAssignRequests] ❌ Erreur:", error);
        return [];
      }
    },
    enabled: !!userId,
    refetchInterval: 10000, // Augmenter la fréquence pour voir les changements plus rapidement
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
