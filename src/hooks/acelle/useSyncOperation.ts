
import { useState, useCallback } from 'react';
import { AcelleAccount } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

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

  // Synchroniser les campagnes via Edge Functions uniquement
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
      console.log(`Début de la synchronisation des campagnes pour ${account.name} (ID: ${account.id}) via Edge Function`);
      setIsSyncing(true);
      setSyncError(null);
      setRetryCount(0);
      
      if (!options?.quietMode) {
        toast.loading("Synchronisation des campagnes via Edge Function...", { id: "sync-toast" });
      }
      
      // Vérifier et rafraîchir la session si nécessaire
      const accessToken = await ensureValidSession();
      
      if (!accessToken) {
        throw new Error("Token d'authentification non disponible après rafraîchissement");
      }
      
      console.log(`[SYNC] Utilisation du token: ${accessToken.substring(0, 10)}...`);
      
      // Utiliser uniquement l'Edge Function pour la synchronisation
      const { data, error } = await supabase.functions.invoke('sync-email-campaigns', {
        body: {
          accountId: account.id,
          endpoint: account.api_endpoint,
          apiToken: account.api_token,
          forceRefresh: options?.forceRefresh || false
        }
      });
      
      if (error) {
        console.error("[SYNC] Erreur Edge Function:", error);
        throw new Error(error.message || "Erreur de synchronisation via Edge Function");
      }
      
      if (data && data.success) {
        console.log(`[SYNC] Synchronisation réussie via Edge Function: ${data.message}`);
        setLastSyncTime(new Date());
        
        if (!options?.quietMode) {
          toast.success(data.message, { id: "sync-toast" });
        }
        
        return true;
      } else {
        throw new Error(data?.message || "Synchronisation échouée");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[SYNC] Erreur:", errorMessage);
      setSyncError(errorMessage);
      
      if (!options?.quietMode) {
        toast.error(`Erreur de synchronisation: ${errorMessage}`, { id: "sync-toast" });
      }
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [account, ensureValidSession, isSyncing]);

  return { 
    isSyncing, 
    syncError, 
    syncCampaignsCache, 
    lastSyncTime,
    retryCount
  };
};
