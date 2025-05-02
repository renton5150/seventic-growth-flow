
import { useState } from 'react';
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { getAcelleCampaigns } from "@/services/acelle/api/campaigns";
import { updateLastSyncDate } from "@/services/acelle/api/accounts";
import { testAcelleConnection } from "@/services/acelle/api/connection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Fonction pour obtenir un token d'authentification valide
  const getValidAuthToken = async (): Promise<string | null> => {
    try {
      console.log("Obtention d'un token d'authentification valide");
      
      // Essayer d'abord de rafraîchir la session pour garantir un token à jour
      await supabase.auth.refreshSession();
      
      // Récupérer la session après le rafraîchissement
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Erreur d'authentification Supabase:", error.message);
        return null;
      }
      
      const token = sessionData?.session?.access_token;
      if (!token) {
        console.error("Aucun token d'accès disponible dans la session");
        return null;
      }
      
      console.log("Token d'authentification récupéré avec succès");
      setAuthToken(token);
      return token;
    } catch (e) {
      console.error("Exception lors de l'obtention du token d'authentification:", e);
      return null;
    }
  };

  // Fonction pour réveiller les Edge Functions
  const wakeUpEdgeFunctions = async () => {
    try {
      console.log("Tentative de réveil des Edge Functions");
      
      // S'assurer d'avoir un token valide
      const token = authToken || await getValidAuthToken();
      if (!token) {
        console.error("Pas de session d'authentification disponible pour la requête de réveil");
        return false;
      }
      
      // Réveiller le proxy CORS
      const wakeUrl = 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy/ping';
      console.log(`Envoi de la requête de réveil à: ${wakeUrl}`);
      
      try {
        const response = await fetch(wakeUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-store',
            'X-Wake-Request': 'true'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Réveil du proxy CORS réussi:", data);
        } else {
          console.warn(`Le proxy CORS a répondu avec le code: ${response.status}`);
        }
      } catch (e) {
        console.warn("Erreur lors de la requête de réveil du proxy, mais ce n'est pas bloquant:", e);
      }
      
      // Réveiller également la fonction de synchronisation
      try {
        const response = await fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-store'
          }
        });
        
        console.log(`Réveil de sync-email-campaigns: ${response.status}`);
      } catch (e) {
        console.warn("Erreur lors du réveil de sync-email-campaigns, mais ce n'est pas bloquant:", e);
      }
      
      // Un petit délai pour laisser le temps aux services de se réveiller complètement
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (e) {
      console.error("Erreur lors du réveil des Edge Functions:", e);
      return false;
    }
  };

  // Fonction de synchronisation améliorée avec gestion robuste des erreurs
  const syncCampaignsCache = async (options: { quietMode?: boolean; forceSync?: boolean } = {}) => {
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
      const token = await getValidAuthToken();
      if (!token) {
        result.error = "Impossible d'obtenir un token d'authentification valide";
        if (!quietMode) setSyncError(result.error);
        if (!quietMode) toast.error(result.error, { id: "sync-campaigns" });
        return result;
      }
      
      // Réveiller les Edge Functions avant tout
      await wakeUpEdgeFunctions();
      
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
        const refreshedToken = refreshedSession?.session?.access_token;
        
        if (!refreshedToken) {
          result.error = "Token invalide même après rafraîchissement";
          if (!quietMode) setSyncError(result.error);
          if (!quietMode) toast.error(result.error, { id: "sync-campaigns" });
          return result;
        }
        
        setAuthToken(refreshedToken);
        
        // Réveiller les services à nouveau
        await wakeUpEdgeFunctions();
        
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
      
      // Récupérer toutes les campagnes (avec pagination)
      let allCampaigns = [];
      let page = 1;
      const limit = 50;
      let hasMore = true;
      let totalFetched = 0;

      if (!quietMode) toast.loading(`Synchronisation des campagnes en cours...`, { id: "sync-campaigns" });
      
      // Utiliser le token valide que nous avons obtenu
      const currentToken = refreshedToken || token;
      
      while (hasMore) {
        try {
          console.log(`Récupération des campagnes page ${page} avec limite ${limit}`);
          
          // Fix: Remove the fifth argument that was causing the TypeScript error
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
    } catch (error: any) {
      console.error(`Échec de la synchronisation pour le compte ${account.name}:`, error);
      result.error = error.message || 'Échec de la synchronisation';
      
      if (!quietMode) {
        setSyncError(error.message || 'Échec de la synchronisation');
        toast.error(`Échec de synchronisation: ${error.message || 'Erreur inconnue'}`, { id: "sync-campaigns" });
      }
      
      return result;
    } finally {
      if (!quietMode) setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    syncError,
    lastSyncTime,
    syncCampaignsCache,
    wakeUpEdgeFunctions,
    getDebugInfo: () => debugInfo,
    debugInfo,
    authToken,
    getValidAuthToken
  };
};
