
import { useState, useEffect } from 'react';
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { useApiConnection } from './useApiConnection';
import { useCampaignCache } from './useCampaignCache';
import { useSyncOperation } from './useSyncOperation';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { forceSyncCampaigns } from '@/services/acelle/api/campaigns';

interface UseCampaignSyncProps {
  account: AcelleAccount;
  syncInterval: number;
}

/**
 * Main hook for campaign synchronization that composes specialized hooks
 */
export const useCampaignSync = ({ account, syncInterval }: UseCampaignSyncProps) => {
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
  } = useSyncOperation(account);

  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [lastManuallySyncedAt, setLastManuallySyncedAt] = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<{success: boolean, message: string} | null>(null);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);

  // Récupérer et rafraîchir le token d'authentification dès le montage du composant
  useEffect(() => {
    const getAuthToken = async () => {
      try {
        setIsRefreshingToken(true);
        console.log("Rafraîchissement du token d'authentification");
        
        // Essayer de rafraîchir la session pour garantir un token valide
        await supabase.auth.refreshSession();
        
        // Récupérer la session après le rafraîchissement
        const { data: sessionData, error } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        if (token) {
          console.log("Token d'authentification récupéré avec succès");
          setAccessToken(token);
        } else {
          console.error("Aucun token d'authentification disponible dans la session:", error);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du token d'authentification:", error);
      } finally {
        setIsRefreshingToken(false);
      }
    };
    
    getAuthToken();
    
    // Rafraîchir le token périodiquement (toutes les 45 minutes)
    const refreshInterval = setInterval(getAuthToken, 45 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Force manual synchronization
  const forceSyncNow = async () => {
    if (!account?.id) return;
    
    try {
      toast.loading("Synchronisation des campagnes en cours...", { id: "force-sync" });
      
      if (isSyncing) {
        toast.warning("Une synchronisation est déjà en cours", { id: "force-sync" });
        return;
      }
      
      // Vérifier d'abord si le token est disponible, sinon le rafraîchir
      if (!accessToken) {
        setIsRefreshingToken(true);
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        setAccessToken(token);
        setIsRefreshingToken(false);
        
        if (!token) {
          toast.error("Authentification requise pour la synchronisation", { id: "force-sync" });
          return;
        }
      }
      
      // Réveiller les services avant la synchronisation
      await wakeUpEdgeFunctions();
      
      const result = await forceSyncCampaigns(account, accessToken);
      setLastManuallySyncedAt(new Date());
      setSyncResult(result);
      
      if (result.success) {
        toast.success(result.message, { id: "force-sync" });
        // Actualiser le compte de campagnes en cache
        await getCachedCampaignsCount();
      } else {
        toast.error(result.message, { id: "force-sync" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Erreur: ${errorMessage}`, { id: "force-sync" });
      setSyncResult({
        success: false,
        message: `Erreur: ${errorMessage}`
      });
    }
  };

  // Set up automatic synchronization
  useEffect(() => {
    if (account?.id && account?.status === 'active' && accessToken) {
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
  }, [account, syncInterval, accessToken]);

  return { 
    isSyncing, 
    syncError, 
    syncCampaignsCache, 
    wakeUpEdgeFunctions, 
    checkApiAvailability, 
    getDebugInfo,
    lastSyncTime,
    campaignsCount,
    clearAccountCache,
    debugInfo,
    forceSyncNow,
    lastManuallySyncedAt,
    syncResult,
    accessToken,
    isRefreshingToken
  };
};
