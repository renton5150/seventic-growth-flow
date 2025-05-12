
import { useState, useCallback } from 'react';
import { AcelleAccount } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { ERROR_HANDLING } from '@/utils/acelle/config';
import { DEVELOPER_MODE } from '@/utils/acelle/developerMode';

interface UseSyncOperationProps {
  account: AcelleAccount;
}

export const useSyncOperation = ({ account }: UseSyncOperationProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fonction pour vérifier la session et rafraîchir le token si nécessaire
  const ensureValidSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data?.session) {
        console.error("[AUTH] Session invalid or expired, refreshing...");
        // Essayer de rafraîchir la session
        const refreshResult = await supabase.auth.refreshSession();
        
        if (refreshResult.error) {
          throw new Error("Impossible de rafraîchir la session: " + refreshResult.error.message);
        }
        
        return refreshResult.data?.session?.access_token;
      }
      
      return data.session.access_token;
    } catch (error) {
      console.error("[AUTH] Error ensuring valid session:", error);
      throw error;
    }
  }, []);

  // Synchroniser les campagnes depuis l'API vers le cache
  const syncCampaignsCache = useCallback(async (options?: { 
    quietMode?: boolean;
    forceRefresh?: boolean;
    debugLevel?: string;
  }) => {
    if (!account?.id || !account?.api_token) {
      console.error("Informations de compte incomplètes pour la synchronisation");
      return false;
    }
    
    if (isSyncing && !options?.forceRefresh) {
      console.log("Une synchronisation est déjà en cours, abandon");
      return false;
    }
    
    try {
      console.log(`Début de la synchronisation des campagnes pour ${account.name} (ID: ${account.id})`);
      setIsSyncing(true);
      setSyncError(null);
      setRetryCount(0);
      
      if (!options?.quietMode) {
        toast.loading("Synchronisation des campagnes...", { id: "sync-toast" });
      }
      
      // Vérifier et rafraîchir la session si nécessaire
      const accessToken = await ensureValidSession();
      
      if (!accessToken) {
        throw new Error("Token d'authentification non disponible après rafraîchissement");
      }
      
      console.log(`[SYNC] Utilisation du token: ${accessToken.substring(0, 10)}...`);
      
      // Configurer les options de la fonction Edge
      const edgeOptions = {
        accountId: account.id,
        timeout: options?.forceRefresh ? 60000 : undefined, // Timeout plus long en cas de rafraîchissement forcé
        debug: options?.debugLevel === 'debug' || options?.forceRefresh,
        debug_level: options?.debugLevel || 'info',
        authMethods: ["token"], // Méthode d'authentification par défaut pour Acelle
        forceRefresh: !!options?.forceRefresh
      };
      
      console.log(`[SYNC] Appel de l'Edge Function avec options:`, edgeOptions);
      
      // Appeler la fonction Edge pour synchroniser
      const { data, error } = await supabase.functions.invoke('sync-email-campaigns', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Debug-Level': options?.debugLevel || 'info',
          'X-Client-Info': `Acelle-Sync/1.0 Account/${account.id}`
        },
        body: edgeOptions
      });
      
      if (error) {
        console.error(`[SYNC] Erreur de la fonction Edge pour ${account.name}:`, error);
        
        // En mode développement, simuler une réponse réussie
        if (DEVELOPER_MODE) {
          console.log("[DEV MODE] Simulation d'une synchronisation réussie");
          setLastSyncTime(new Date());
          if (!options?.quietMode) {
            toast.success("Synchronisation simulée en mode développement", { id: "sync-toast" });
          }
          return true;
        }
        
        throw new Error(`Erreur de la fonction Edge: ${error.message || 'Erreur inconnue'}`);
      }
      
      console.log(`[SYNC] Résultat de la synchronisation pour ${account.name}:`, data);
      
      // Mettre à jour le temps de synchronisation
      setLastSyncTime(new Date());
      
      if (!options?.quietMode) {
        toast.success("Synchronisation terminée", { id: "sync-toast" });
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[SYNC] Erreur lors de la synchronisation pour ${account.name}:`, error);
      
      // Gestion des tentatives
      if (retryCount < ERROR_HANDLING.MAX_RETRIES && !options?.quietMode) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        console.log(`[SYNC] Tentative ${newRetryCount}/${ERROR_HANDLING.MAX_RETRIES} dans ${ERROR_HANDLING.RETRY_DELAY_MS}ms...`);
        
        // Attendre et réessayer
        setTimeout(() => {
          toast.warning(`Nouvelle tentative ${newRetryCount}/${ERROR_HANDLING.MAX_RETRIES}...`, { id: "sync-toast" });
          syncCampaignsCache({
            ...options,
            forceRefresh: true,
            debugLevel: 'debug'
          });
        }, ERROR_HANDLING.RETRY_DELAY_MS);
        
        return false;
      }
      
      // Si toutes les tentatives échouent ou en mode silencieux
      setSyncError(errorMessage);
      
      if (!options?.quietMode) {
        toast.error(`Erreur: ${errorMessage}`, { id: "sync-toast" });
      }
      
      // Enregistrer l'erreur pour diagnostic
      logSyncError(`${errorMessage} (après ${retryCount} tentatives)`);
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [account, isSyncing, retryCount, ensureValidSession]);

  // Enregistrer une erreur de synchronisation dans la base de données
  const logSyncError = useCallback(async (errorMessage: string) => {
    if (!account?.id) return;
    
    try {
      await supabase
        .from('acelle_accounts')
        .update({ 
          last_sync_error: errorMessage,
          last_sync_date: new Date().toISOString()
        })
        .eq('id', account.id);
      
      console.log(`Erreur de synchronisation enregistrée pour ${account.name}`);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'erreur de synchronisation:", error);
    }
  }, [account]);

  return {
    isSyncing,
    syncError,
    lastSyncTime,
    syncCampaignsCache,
    logSyncError,
    retryCount
  };
};
