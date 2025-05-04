
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

  // Synchroniser les campagnes depuis l'API vers le cache
  const syncCampaignsCache = useCallback(async (options?: { 
    quietMode?: boolean;
  }) => {
    if (!account?.id || !account?.api_token) {
      console.error("Informations de compte incomplètes pour la synchronisation");
      return false;
    }
    
    if (isSyncing) {
      console.log("Une synchronisation est déjà en cours, abandon");
      return false;
    }
    
    try {
      console.log(`Début de la synchronisation des campagnes pour ${account.name}`);
      setIsSyncing(true);
      setSyncError(null);
      
      if (!options?.quietMode) {
        toast.loading("Synchronisation des campagnes...", { id: "sync-toast" });
      }
      
      // Réveil des edge functions si nécessaire
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Token d'authentification non disponible");
      }
      
      // Appeler la fonction Edge pour synchroniser
      const { error: functionError } = await supabase.functions.invoke('sync-email-campaigns', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: { 
          accountId: account.id
        }
      });
      
      if (functionError) {
        throw new Error(`Erreur de la fonction Edge: ${functionError.message}`);
      }
      
      // Mettre à jour le temps de synchronisation
      setLastSyncTime(new Date());
      
      if (!options?.quietMode) {
        toast.success("Synchronisation terminée", { id: "sync-toast" });
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSyncError(errorMessage);
      
      if (!options?.quietMode) {
        toast.error(`Erreur: ${errorMessage}`, { id: "sync-toast" });
      }
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [account]);

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
    logSyncError
  };
};
