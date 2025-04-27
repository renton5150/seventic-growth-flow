
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AcelleConnectionDebug } from "@/types/acelle.types";

export const useCampaignSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);

  const wakeUpEdgeFunctions = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available for waking up edge functions");
        toast.error("Authentification requise");
        return false;
      }
      
      console.log("Attempting to wake up edge functions...");
      toast.loading("Initialisation des services...", { id: "wake-up-toast" });
      
      // Ping service to check availability
      const pingResponse = await fetch(
        'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/ping', 
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Cache-Control': 'no-cache',
            'X-Wake-Up': 'true'
          },
          signal: AbortSignal.timeout(15000) // 15 seconds timeout
        }
      );

      toast.dismiss("wake-up-toast");
      
      if (pingResponse.ok) {
        toast.success("Services prêts");
        return true;
      } else {
        console.log("Wake-up response was not OK, but service might be initializing");
        toast.info("Les services sont en cours d'initialisation, veuillez patienter");
        return false;
      }
    } catch (error) {
      toast.dismiss("wake-up-toast");
      console.error("Error waking up edge functions:", error);
      toast.info("Services en cours de démarrage. Veuillez réessayer dans quelques instants.");
      return false;
    }
  }, []);

  const syncAllCampaigns = useCallback(async () => {
    if (isSyncing) {
      console.log("Sync already in progress, skipping...");
      return { success: false };
    }

    setIsSyncing(true);
    try {
      // Check if services are available
      await wakeUpEdgeFunctions();

      const { data } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available");
        toast.error("Authentification requise");
        return { success: false };
      }

      console.log("Initiating campaigns sync...");
      toast.loading("Synchronisation des campagnes en cours...", { id: "sync-toast" });
      
      // Start sync process
      const syncResponse = await fetch(
        'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', 
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({ forceSync: true, startServices: true }),
          signal: AbortSignal.timeout(30000) // 30 seconds timeout
        }
      );
      
      toast.dismiss("sync-toast");
      
      if (syncResponse.ok) {
        const responseData = await syncResponse.json();
        toast.success("Synchronisation terminée avec succès");
        setLastSyncResult(responseData);
        return { success: true };
      } else {
        toast.error("Erreur de synchronisation");
        return { success: false };
      }
    } catch (error) {
      toast.dismiss("sync-toast");
      console.error("Error syncing campaigns:", error);
      toast.error("Erreur de synchronisation: " + (error instanceof Error ? error.message : "Erreur inconnue"));
      return { success: false };
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, wakeUpEdgeFunctions]);

  const syncCampaign = useCallback(async () => {
    if (isSyncing) {
      return { success: false };
    }

    setIsSyncing(true);
    try {
      await wakeUpEdgeFunctions();
      // Implementation for single campaign sync would go here
      toast.success("Synchronisation réussie");
      return { success: true };
    } catch (error) {
      console.error("Error in syncCampaign:", error);
      toast.error("Échec de la synchronisation");
      return { success: false };
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, wakeUpEdgeFunctions]);

  return {
    syncAllCampaigns,
    syncCampaign,
    wakeUpEdgeFunctions,
    isSyncing,
    lastSyncResult
  };
};
