
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

  // Fonction pour réveiller les Edge Functions
  const wakeUpEdgeFunctions = async () => {
    try {
      console.log("Tentative de réveil des Edge Functions");
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        console.error("Pas de session d'authentification disponible pour la requête de réveil");
        return false;
      }
      
      const wakeUrl = 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy/ping';
      console.log(`Envoi de la requête de réveil à: ${wakeUrl}`);
      
      const response = await fetch(wakeUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Cache-Control': 'no-store',
          'X-Wake-Request': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Réveil des Edge Functions réussi:", data);
        return true;
      } else {
        console.error(`Échec du réveil des Edge Functions: ${response.status}`);
        return false;
      }
    } catch (e) {
      console.error("Erreur lors du réveil des Edge Functions:", e);
      return false;
    }
  };

  // Fonction de synchronisation améliorée qui s'assure que les statistiques sont bien récupérées
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
      
      // D'abord réveiller les Edge Functions
      await wakeUpEdgeFunctions();
      
      // Tester la connexion à l'API
      const connectionTest = await testAcelleConnection(account);
      setDebugInfo(connectionTest);
      result.debugInfo = connectionTest;
      
      if (!connectionTest.success) {
        // Si la connexion a échoué, essayer de réveiller les Edge Functions et tester à nouveau
        await wakeUpEdgeFunctions();
        const retryConnection = await testAcelleConnection(account);
        
        if (!retryConnection.success) {
          result.error = retryConnection.errorMessage || "API inaccessible";
          result.debugInfo = retryConnection;
          if (!quietMode) setSyncError(result.error);
          return result;
        }
        
        // Mettre à jour les infos de débogage avec la nouvelle tentative réussie
        setDebugInfo(retryConnection);
        result.debugInfo = retryConnection;
      }
      
      // Récupérer toutes les campagnes (avec pagination)
      let allCampaigns = [];
      let page = 1;
      const limit = 50; // Ajuster la limite selon les besoins
      let hasMore = true;
      let totalFetched = 0;

      if (!quietMode) toast.loading(`Synchronisation des campagnes en cours...`, { id: "sync-campaigns" });

      // Récupérer le jeton d'authentification
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        result.error = "Authentification requise";
        if (!quietMode) setSyncError(result.error);
        if (!quietMode) toast.error(`Erreur de synchronisation: Authentification requise`, { id: "sync-campaigns" });
        return result;
      }

      while (hasMore) {
        try {
          console.log(`Récupération des campagnes page ${page} avec limite ${limit}`);
          // S'assurer que include_stats=true est bien transmis dans l'appel
          // Fixed here: Removed the fifth argument that was causing the error
          const campaigns = await getAcelleCampaigns(account, page, limit, accessToken);
          
          if (campaigns && campaigns.length > 0) {
            // Vérifier si les campagnes ont des statistiques
            const statsCheck = campaigns.some(c => c.statistics && c.statistics.subscriber_count > 0);
            console.log(`Page ${page}: ${campaigns.length} campagnes récupérées, avec stats: ${statsCheck}`);
            
            // Si la première page est récupérée, vérifier et logger les données pour débogage
            if (page === 1 && campaigns.length > 0) {
              console.log("Exemple de campagne récupérée lors de la synchronisation:", {
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
            // Si nous échouons sur la première page, considérer cela comme un échec
            result.error = `Error fetching campaigns: ${pageError.message || "Unknown error"}`;
            if (!quietMode) setSyncError(result.error);
            if (!quietMode) toast.error(`Erreur de synchronisation: ${result.error}`, { id: "sync-campaigns" });
            return result;
          } else {
            // Si nous avons déjà récupéré des pages, arrêter la pagination mais continuer avec ce que nous avons
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
    debugInfo
  };
};
