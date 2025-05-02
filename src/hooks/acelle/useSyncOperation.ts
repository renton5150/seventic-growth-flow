
import { useState, useEffect, useCallback } from 'react';
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { getAcelleCampaigns } from "@/services/acelle/api/campaigns";
import { updateLastSyncDate } from "@/services/acelle/api/accounts";
import { testAcelleConnection } from "@/services/acelle/api/connection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthToken } from "./useAuthToken";
import { useEdgeFunctionWakeup } from "./useEdgeFunctionWakeup";

interface SyncResult {
  error?: string;
  success: boolean;
  debugInfo?: AcelleConnectionDebug;
  campaignsCount?: number;
}

/**
 * Hook pour les opérations de synchronisation
 */
export const useSyncOperation = (account: AcelleAccount) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);
  
  // Utiliser les hooks extraits
  const { authToken, getValidAuthToken, setAuthToken } = useAuthToken();
  const { wakeUpEdgeFunctions } = useEdgeFunctionWakeup();

  // Fonction de synchronisation améliorée avec gestion robuste des erreurs
  const syncCampaignsCache = useCallback(async (options: { quietMode?: boolean; forceSync?: boolean } = {}) => {
    const { quietMode = false, forceSync = false } = options;
    if (!quietMode) setIsSyncing(true);
    if (!quietMode) setSyncError(null);
    
    const result: SyncResult = { success: false };
    
    try {
      if (!account?.id || account?.status !== 'active') {
        result.error = "Account inactive or invalid";
        if (!quietMode) setSyncError("Compte inactif ou invalide");
        return result;
      }
      
      // Obtenir un token valide avant de commencer
      const token = authToken || await getValidAuthToken();
      if (!token) {
        result.error = "Impossible d'obtenir un token d'authentification valide";
        if (!quietMode) setSyncError(result.error);
        if (!quietMode) toast.error(result.error, { id: "sync-campaigns" });
        return result;
      }
      
      // Réveiller les Edge Functions avant tout
      await wakeUpEdgeFunctions(token);
      
      // Tester la connexion à l'API
      if (!quietMode) toast.loading("Test de connexion à l'API Acelle...", { id: "sync-campaigns" });
      const connectionTest = await testAcelleConnection(account);
      setDebugInfo(connectionTest);
      result.debugInfo = connectionTest;
      
      if (!connectionTest.success) {
        // Si la connexion a échoué, réessayer une fois de plus après avoir rafraîchi le token
        if (!quietMode) toast.loading("Nouvelle tentative de connexion...", { id: "sync-campaigns" });
        
        // Rafraîchir le token explicitement
        await supabase.auth.refreshSession();
        const { data: refreshedSession } = await supabase.auth.getSession();
        const newToken = refreshedSession?.session?.access_token;
        
        if (!newToken) {
          result.error = "Token invalide même après rafraîchissement";
          if (!quietMode) setSyncError(result.error);
          if (!quietMode) toast.error(result.error, { id: "sync-campaigns" });
          return result;
        }
        
        setAuthToken(newToken);
        
        // Réveiller les services à nouveau
        await wakeUpEdgeFunctions(newToken);
        
        // Réessayer la connexion
        const retryConnection = await testAcelleConnection(account);
        
        if (!retryConnection.success) {
          result.error = retryConnection.errorMessage || "API inaccessible même après nouvelle tentative";
          result.debugInfo = retryConnection;
          if (!quietMode) setSyncError(result.error);
          if (!quietMode) toast.error(result.error, { id: "sync-campaigns" });
          return result;
        }
        
        setDebugInfo(retryConnection);
        result.debugInfo = retryConnection;
      }
      
      // Pour une synchronisation forcée, utilisez l'Edge Function directement
      if (forceSync) {
        try {
          if (!quietMode) toast.loading("Synchronisation forcée via Edge Function...", { id: "sync-campaigns" });
          
          // Appeler l'edge function sync-email-campaigns
          const { data, error } = await supabase.functions.invoke("sync-email-campaigns", {
            method: "POST",
            body: {
              forceSync: true,
              accounts: [account.id],
              debug: true
            },
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });
          
          if (error) {
            throw new Error(`Erreur lors de l'appel à l'Edge Function: ${error.message}`);
          }
          
          console.log("Résultat de la synchro via Edge Function:", data);
          
          if (data?.success) {
            setLastSyncTime(new Date());
            result.success = true;
            result.campaignsCount = data.count || 0;
            
            if (!quietMode) {
              toast.success(`${data.count || 'Plusieurs'} campagnes synchronisées avec succès`, { id: "sync-campaigns" });
            }
            
            return result;
          } else {
            throw new Error(data?.message || "Échec de la synchronisation");
          }
        } catch (edgeFunctionError) {
          console.error("Erreur lors de la synchronisation via Edge Function:", edgeFunctionError);
          result.error = `Erreur Edge Function: ${edgeFunctionError.message}`;
          if (!quietMode) setSyncError(result.error);
          if (!quietMode) toast.error(result.error, { id: "sync-campaigns" });
          return result;
        }
      }
      
      // Récupérer toutes les campagnes (avec pagination)
      let allCampaigns = [];
      let page = 1;
      const limit = 50;
      let hasMore = true;
      let totalFetched = 0;

      if (!quietMode) toast.loading(`Synchronisation des campagnes en cours...`, { id: "sync-campaigns" });
      
      while (hasMore) {
        try {
          console.log(`Récupération des campagnes page ${page} avec limite ${limit}`);
          
          // Utiliser le token actuel pour l'appel à l'API
          const campaigns = await getAcelleCampaigns(account, page, limit, token);
          
          if (campaigns && campaigns.length > 0) {
            // Vérifier si les campagnes ont des statistiques
            const statsCheck = campaigns.some(c => c.statistics && c.statistics.subscriber_count > 0);
            console.log(`Page ${page}: ${campaigns.length} campagnes récupérées, avec stats: ${statsCheck}`);
            
            if (page === 1 && campaigns.length > 0) {
              console.log("Exemple de campagne récupérée:", {
                name: campaigns[0].name,
                stats: campaigns[0].statistics,
                delivery_info: campaigns[0].delivery_info
              });
            }
            
            allCampaigns = allCampaigns.concat(campaigns);
            totalFetched += campaigns.length;
            
            if (!quietMode && page > 1) {
              toast.loading(`Synchronisation: ${totalFetched} campagnes récupérées...`, { id: "sync-campaigns" });
            }
            
            page++;
            hasMore = campaigns.length === limit;
          } else {
            hasMore = false;
          }
        } catch (pageError) {
          console.error(`Erreur lors de la récupération de la page ${page}:`, pageError);
          
          if (page === 1) {
            result.error = `Error fetching campaigns: ${pageError.message || "Unknown error"}`;
            if (!quietMode) setSyncError(result.error);
            if (!quietMode) toast.error(`Erreur de synchronisation: ${result.error}`, { id: "sync-campaigns" });
            return result;
          } else {
            console.warn(`Arrêt de la pagination après erreur sur la page ${page}, continuation avec ${totalFetched} campagnes`);
            hasMore = false;
          }
        }
      }
      
      console.log(`${allCampaigns.length} campagnes récupérées pour le compte ${account.name}`);
      
      // Mettre à jour la date de dernière synchronisation
      await updateLastSyncDate(account.id);
      
      if (!quietMode) {
        toast.success(`Synchronisé ${allCampaigns.length} campagnes avec succès`, { id: "sync-campaigns" });
      }
      
      setLastSyncTime(new Date());
      result.success = true;
      result.campaignsCount = allCampaigns.length;
      return result;
    } catch (error) {
      console.error(`Échec de la synchronisation pour le compte ${account.name}:`, error);
      result.error = error.message || 'Échec de la synchronisation';
      if (!quietMode) setSyncError(result.error);
      if (!quietMode) toast.error(`Erreur: ${result.error}`, { id: "sync-campaigns" });
      return result;
    } finally {
      if (!quietMode) setIsSyncing(false);
    }
  }, [account, authToken, getValidAuthToken, wakeUpEdgeFunctions, setAuthToken]);

  return {
    isSyncing,
    syncError,
    lastSyncTime,
    syncCampaignsCache,
    debugInfo
  };
};
