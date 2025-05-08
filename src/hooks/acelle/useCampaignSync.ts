
import { useState, useEffect, useCallback } from 'react';
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { useApiConnection } from './useApiConnection';
import { useCampaignCache } from './useCampaignCache';
import { useSyncOperation } from './useSyncOperation';
import { toast } from 'sonner';
import { forceSyncCampaigns } from '@/services/acelle/api/campaigns';
import { useAuthToken } from './useAuthToken';

interface UseCampaignSyncProps {
  account: AcelleAccount;
  syncInterval: number;
}

/**
 * Main hook for campaign synchronization that composes specialized hooks
 */
export const useCampaignSync = ({ account, syncInterval }: UseCampaignSyncProps) => {
  const { authToken, isRefreshing: isRefreshingToken, getValidAuthToken } = useAuthToken();
  
  const { 
    wakeUpEdgeFunctions, 
    checkApiAvailability, 
    getDebugInfo, 
    debugInfo 
  } = useApiConnection(account);
  
  const { 
    campaignsCount, 
    getCachedCampaignsCount,
    clearAccountCache 
  } = useCampaignCache(account);
  
  const { 
    isSyncing, 
    syncError, 
    lastSyncTime,
    syncCampaignsCache 
  } = useSyncOperation({ account });

  const [lastManuallySyncedAt, setLastManuallySyncedAt] = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<{success: boolean, message: string} | null>(null);

  // Force manual synchronization
  const forceSyncNow = useCallback(async () => {
    if (!account?.id) return;
    
    try {
      toast.loading("Synchronisation des campagnes en cours...", { id: "force-sync" });
      
      if (isSyncing) {
        toast.warning("Une synchronisation est déjà en cours", { id: "force-sync" });
        return;
      }
      
      // Vérifier d'abord si le token est disponible, sinon le rafraîchir
      const token = authToken || await getValidAuthToken();
      
      if (!token) {
        toast.error("Authentification requise pour la synchronisation", { id: "force-sync" });
        return;
      }
      
      // Réveiller les services avant la synchronisation
      await wakeUpEdgeFunctions(token);
      
      const result = await forceSyncCampaigns(account, token);
      setLastManuallySyncedAt(new Date());
      setSyncResult({
        success: result.success,
        message: result.message || result.error || "Opération terminée"
      });
      
      if (result.success) {
        toast.success(result.message || "Synchronisation réussie", { id: "force-sync" });
        // Actualiser le compte de campagnes en cache
        await getCachedCampaignsCount();
      } else {
        toast.error(result.message || result.error || "Erreur lors de la synchronisation", { id: "force-sync" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Erreur: ${errorMessage}`, { id: "force-sync" });
      setSyncResult({
        success: false,
        message: `Erreur: ${errorMessage}`
      });
    }
  }, [account, authToken, getValidAuthToken, wakeUpEdgeFunctions, isSyncing, getCachedCampaignsCount]);

  // Set up automatic synchronization
  useEffect(() => {
    if (account?.id && account?.status === 'active' && authToken) {
      console.log(`Configuring automatic sync for account ${account.name} with interval ${syncInterval}ms`);
      
      // First check cached campaigns count
      getCachedCampaignsCount().then(count => {
        // If cache is empty or forced sync interval, run sync
        if (count === 0) {
          console.log("Cache empty, running initial sync");
          syncCampaignsCache();
        }
      });

      // Set up the interval to run the sync periodically
      const intervalId = setInterval(() => {
        console.log(`Running scheduled sync for account ${account.name}`);
        syncCampaignsCache({ quietMode: true });
      }, syncInterval);

      // Clean up the interval when the component unmounts or the account changes
      return () => clearInterval(intervalId);
    }
  }, [account, syncInterval, authToken, getCachedCampaignsCount, syncCampaignsCache]);

  return { 
    isSyncing, 
    syncError, 
    syncCampaignsCache, 
    wakeUpEdgeFunctions: (token: string | null) => wakeUpEdgeFunctions(token), 
    checkApiAvailability, 
    getDebugInfo,
    lastSyncTime,
    campaignsCount,
    clearAccountCache,
    debugInfo,
    forceSyncNow,
    lastManuallySyncedAt,
    syncResult,
    accessToken: authToken,
    isRefreshingToken
  };
};
