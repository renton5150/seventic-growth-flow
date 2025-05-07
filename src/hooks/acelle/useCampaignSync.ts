
import { useState, useEffect, useCallback } from 'react';
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { useCampaignCache } from './useCampaignCache';
import { useSyncOperation } from './useSyncOperation';
import { toast } from 'sonner';
import { forceSyncCampaigns } from '@/services/acelle/api/campaigns';
import { getAuthToken, wakeupCorsProxy } from '@/services/acelle/cors-proxy';
import { useAcelleApiStatus } from './useAcelleApiStatus';

interface UseCampaignSyncProps {
  account: AcelleAccount;
  syncInterval: number;
}

/**
 * Hook principal pour la synchronisation des campagnes 
 * avec gestion améliorée de la connexion API
 */
export const useCampaignSync = ({ account, syncInterval }: UseCampaignSyncProps) => {
  // Utiliser notre nouveau hook de gestion d'état API
  const { isProxyAvailable, isAuthenticated, forceRefresh } = useAcelleApiStatus();
  
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

  // Force une synchronisation manuelle avec notre système unifié
  const forceSyncNow = useCallback(async () => {
    if (!account?.id) return;
    
    try {
      toast.loading("Synchronisation des campagnes en cours...", { id: "force-sync" });
      
      if (isSyncing) {
        toast.warning("Une synchronisation est déjà en cours", { id: "force-sync" });
        return;
      }
      
      // Vérifier l'état du système et le rafraîchir si nécessaire
      if (!isAuthenticated || !isProxyAvailable) {
        toast.loading("Rafraîchissement des services...", { id: "force-sync" });
        const refreshSuccess = await forceRefresh();
        
        if (!refreshSuccess) {
          toast.error("Impossible de se connecter aux services API", { id: "force-sync" });
          return;
        }
      }
      
      // Obtenir un token d'authentification à jour
      const token = await getAuthToken();
      
      if (!token) {
        toast.error("Authentification requise pour la synchronisation", { id: "force-sync" });
        return;
      }
      
      // Réveiller les services avant la synchronisation
      await wakeupCorsProxy(token);
      
      // Lancer la synchronisation forcée
      const result = await forceSyncCampaigns(account, token);
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
  }, [account, isAuthenticated, isProxyAvailable, forceRefresh, isSyncing, getCachedCampaignsCount]);

  // Configurer la synchronisation automatique
  useEffect(() => {
    if (account?.id && account?.status === 'active' && isAuthenticated) {
      console.log(`Configuration de la synchronisation automatique pour ${account.name}`);
      
      // Vérifier d'abord le cache
      getCachedCampaignsCount().then(count => {
        if (count === 0) {
          console.log("Cache vide, synchronisation initiale");
          syncCampaignsCache();
        }
      });

      // Configurer l'intervalle pour les synchronisations périodiques
      const intervalId = setInterval(() => {
        if (isAuthenticated && isProxyAvailable) {
          console.log(`Exécution de la synchronisation planifiée pour ${account.name}`);
          syncCampaignsCache({ quietMode: true });
        } else {
          console.log("Services non disponibles, synchronisation reportée");
        }
      }, syncInterval);

      return () => clearInterval(intervalId);
    }
  }, [account, syncInterval, isAuthenticated, isProxyAvailable, getCachedCampaignsCount, syncCampaignsCache]);

  return { 
    isSyncing, 
    syncError, 
    syncCampaignsCache, 
    lastSyncTime,
    campaignsCount,
    clearAccountCache,
    forceSyncNow,
    lastManuallySyncedAt,
    syncResult,
    serviceStatus: {
      isAuthenticated,
      isProxyAvailable
    }
  };
};
