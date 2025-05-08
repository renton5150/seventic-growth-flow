
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
      
      console.log("Synchronisation avec les paramètres:", {
        hasToken: !!accessToken,
        accountId: account.id,
        tokenLength: account.api_token.length,
        endpoint: account.api_endpoint
      });
      
      // Appeler la fonction Edge pour synchroniser
      // Avec la nouvelle méthode d'authentification (API token dans l'URL)
      const { data, error: functionError } = await supabase.functions.invoke('sync-email-campaigns', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          // Ajouter les informations d'authentification Acelle
          'X-Acelle-Token': account.api_token,
          'X-Acelle-Endpoint': account.api_endpoint,
          // Ajouter des informations supplémentaires pour le diagnostic
          'X-Auth-Method': 'url-param' // Indique au backend qu'il faut utiliser la méthode d'authentification par URL
        },
        body: { 
          accountId: account.id,
          apiToken: account.api_token, // On ajoute aussi le token dans le body pour plus de sécurité
          authMethod: 'url-param' // Indique de privilégier l'authentification par paramètre URL
        }
      });
      
      if (functionError) {
        // Amélioration de la gestion des erreurs pour plus de clarté
        let errorMessage = functionError.message;
        
        // Gérer spécifiquement les erreurs d'authentification
        if (functionError.message.includes("403") || functionError.message.includes("Forbidden")) {
          errorMessage = `Erreur d'authentification à l'API Acelle (403 Forbidden). Vérifiez les identifiants API et la méthode d'authentification.`;
        }
        
        throw new Error(errorMessage);
      }
      
      if (data?.error) {
        throw new Error(`Erreur API: ${data.error}`);
      }
      
      // Mettre à jour le temps de synchronisation
      setLastSyncTime(new Date());
      
      if (!options?.quietMode) {
        toast.success("Synchronisation terminée avec succès", { id: "sync-toast" });
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSyncError(errorMessage);
      
      // Afficher un message d'erreur plus explicite pour les problèmes d'authentification
      if (errorMessage.includes("403") || errorMessage.includes("Forbidden") || errorMessage.includes("authentification")) {
        if (!options?.quietMode) {
          toast.error(`Erreur d'authentification à l'API Acelle. La méthode d'authentification par URL est maintenant utilisée, veuillez vérifier les identifiants API.`, { id: "sync-toast" });
        }
      } else {
        if (!options?.quietMode) {
          toast.error(`Erreur lors de la synchronisation: ${errorMessage}`, { id: "sync-toast" });
        }
      }
      
      // Journaliser l'erreur dans la base de données
      await logSyncError(errorMessage);
      
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
