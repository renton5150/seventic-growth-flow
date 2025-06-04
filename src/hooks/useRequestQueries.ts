
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { Request } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";
import { getMissionsByGrowthId } from "@/services/missions-service/operations/readMissions";
import { preloadMissionNames, syncKnownMissions } from "@/services/missionNameService";

export function useRequestQueries(userId: string | undefined) {
  const { user } = useAuth();
  const isSDR = user?.role === 'sdr';
  const isGrowth = user?.role === 'growth';
  const isAdmin = user?.role === 'admin';

  // Requêtes à affecter - UNIQUEMENT les demandes sans assignation
  const { data: toAssignRequests = [], refetch: refetchToAssign } = useQuery({
    queryKey: ['growth-requests-to-assign', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("Récupération des requêtes à affecter avec userId:", userId);
      
      // SYNCHRONISATION SIMPLIFIÉE des missions
      try {
        await syncKnownMissions();
        console.log("Synchronisation des missions terminée");
      } catch (err) {
        console.error("Erreur lors de la synchronisation:", err);
      }
      
      // Requête pour les demandes sans assignation
      let query = supabase
        .from('requests_with_missions')
        .select('*', { count: 'exact' })
        .is('assigned_to', null)
        .eq('workflow_status', 'pending_assignment')
        .neq('workflow_status', 'completed');
      
      // Si c'est un SDR, filtrer uniquement ses requêtes
      if (isSDR) {
        query = query.eq('created_by', userId);
      }
      
      query = query.order('due_date', { ascending: true });
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error("Erreur lors de la récupération des requêtes à affecter:", error);
        return [];
      }
      
      console.log(`Requêtes à affecter récupérées: ${data.length} sur ${count || 'inconnu'} requêtes totales`);
      
      // Précharger les noms de mission
      const missionIds = data
        .map(req => req.mission_id)
        .filter((id): id is string => !!id);
      
      if (missionIds.length > 0) {
        console.log(`Préchargement de ${missionIds.length} noms de mission`);
        preloadMissionNames(missionIds);
      }
      
      // Formater les données
      const formattedRequests = await Promise.all(data.map((request: any) => formatRequestFromDb(request)));
      console.log("Requêtes formatées:", formattedRequests.length);
      
      return formattedRequests;
    },
    enabled: !!userId,
    refetchInterval: 10000
  });
  
  // Mes assignations
  const { data: myAssignmentsRequests = [], refetch: refetchMyAssignments } = useQuery({
    queryKey: ['growth-requests-my-assignments', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("Récupération de mes assignations avec userId:", userId);
      
      // SYNCHRONISATION SIMPLIFIÉE des missions
      try {
        await syncKnownMissions();
        console.log("Synchronisation des missions terminée pour mes assignations");
      } catch (err) {
        console.error("Erreur lors de la synchronisation:", err);
      }
      
      let query = supabase.from('requests_with_missions')
        .select('*', { count: 'exact' })
        .neq('workflow_status', 'completed');
      
      // Pour Growth: seulement les requêtes assignées à lui-même
      if (isGrowth && !isAdmin) {
        query = query.eq('assigned_to', userId);
      }
      // Pour SDR: seulement ses requêtes créées
      else if (isSDR) {
        query = query.eq('created_by', userId);
      }
      // Pour Admin: toutes les requêtes assignées
      else if (isAdmin) {
        query = query.not('assigned_to', 'is', null);
      }
      
      query = query.order('due_date', { ascending: true });
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error("Erreur lors de la récupération de mes assignations:", error);
        return [];
      }
      
      console.log(`Mes assignations récupérées: ${data.length} sur ${count || 'inconnu'} requêtes totales`);
      
      // Précharger les noms de mission
      const missionIds = data
        .map(req => req.mission_id)
        .filter((id): id is string => !!id);
      
      if (missionIds.length > 0) {
        console.log(`Préchargement de ${missionIds.length} noms de mission pour mes assignations`);
        preloadMissionNames(missionIds);
      }
      
      // Formater les données
      const formattedRequests = await Promise.all(data.map(request => formatRequestFromDb(request)));
      console.log("Mes assignations formatées:", formattedRequests.length);
      
      return formattedRequests;
    },
    enabled: !!userId,
    refetchInterval: 10000
  });
  
  // Toutes les requêtes
  const { data: allGrowthRequests = [], refetch: refetchAllRequests } = useQuery({
    queryKey: ['growth-all-requests', userId, isSDR, isGrowth, isAdmin],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('Récupération de TOUTES les requêtes avec rôle:', 
                  isSDR ? 'SDR' : isGrowth ? 'Growth' : 'Admin');
      
      // SYNCHRONISATION CRITIQUE ET SIMPLIFIÉE des missions
      try {
        await syncKnownMissions();
        console.log("Synchronisation des missions terminée pour toutes les requêtes");
      } catch (err) {
        console.error("Erreur lors de la synchronisation:", err);
      }
      
      let query = supabase.from('requests_with_missions')
        .select('*')
        .neq('workflow_status', 'completed');
      
      // Si c'est un SDR, ne récupérer QUE ses demandes créées
      if (isSDR) {
        query = query.eq('created_by', userId);
        console.log('SDR - Filtrage requêtes par ID utilisateur:', userId);
      }
      
      query = query.order('due_date', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erreur pendant la récupération des requêtes:', error);
        throw error;
      }
      
      const requestsArray = Array.isArray(data) ? data : [];
      console.log(`${requestsArray.length} requêtes récupérées au total`);
      
      // Précharger les noms de mission
      const missionIds = requestsArray
        .map(req => req.mission_id)
        .filter((id): id is string => !!id);
      
      if (missionIds.length > 0) {
        console.log(`Préchargement de ${missionIds.length} noms de mission pour toutes les requêtes`);
        preloadMissionNames(missionIds);
      }
      
      // Formater les données avec le service centralisé
      const formattedRequests = await Promise.all(requestsArray.map(request => formatRequestFromDb(request)));
      
      console.log(`${formattedRequests.length} requêtes formatées pour l'affichage`);
      formattedRequests.forEach(req => {
        console.log(`Request ${req.id}: mission_id=${req.missionId}, missionName=${req.missionName}`);
      });
      
      return formattedRequests;
    },
    enabled: !!userId,
    refetchInterval: 10000
  });

  // Récupération des détails d'une demande spécifique
  const getRequestDetails = async (requestId: string): Promise<Request | null> => {
    try {
      console.log("Récupération des détails pour la demande:", requestId);
      
      const { data, error } = await supabase
        .from('requests_with_missions')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();

      // Vérification des droits pour un SDR uniquement
      if (data && isSDR && data.created_by !== userId) {
        console.error("SDR tentant d'accéder à une demande qui ne lui appartient pas");
        return null;
      }

      if (error) {
        console.error("Erreur lors de la récupération des détails de la demande:", error);
        return null;
      }

      if (!data) {
        console.log("Aucun détail trouvé pour la demande:", requestId);
        return null;
      }

      console.log("Détails de la demande récupérés:", data);
      
      // Formatage avec le service centralisé
      return await formatRequestFromDb(data);
    } catch (err) {
      console.error("Erreur lors de la récupération des détails:", err);
      return null;
    }
  };

  return {
    toAssignRequests,
    myAssignmentsRequests,
    allGrowthRequests,
    refetchToAssign,
    refetchMyAssignments,
    refetchAllRequests,
    getRequestDetails
  };
}
