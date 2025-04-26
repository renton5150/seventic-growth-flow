
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkApiAvailability } from "./utils/apiAvailability";
import { useWakeUpEdgeFunctions } from "./useWakeUpEdgeFunctions";

export const useCampaignSyncOperation = () => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const { wakeUpEdgeFunctions } = useWakeUpEdgeFunctions();

  const syncCampaignsCache = useCallback(async () => {
    if (isSyncing) {
      console.log("Sync already in progress, skipping...");
      return { skipped: true };
    }

    setIsSyncing(true);
    try {
      const apiStatus = await checkApiAvailability();
      if (!apiStatus.available) {
        console.log("API not available, trying to wake up services...");
        toast.warning("Les services sont indisponibles, tentative de réveil...");
        await wakeUpEdgeFunctions();
        toast.info("Services en cours d'initialisation, veuillez réessayer dans quelques instants");
        return { error: "Services unavailable, wake-up initiated" };
      }
      
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available");
        toast.error("Authentification requise");
        return { error: "Authentication required" };
      }

      console.log("Initiating campaign sync...");
      toast.loading("Synchronisation des campagnes en cours...", { id: "sync-toast" });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      try {
        console.log("Service is responsive, proceeding with sync");
        
        const syncResponse = await fetch(
          'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', 
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            body: JSON.stringify({
              forceSync: true,
              startServices: true
            }),
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!syncResponse.ok) {
          let errorMessage = `Erreur ${syncResponse.status}`;
          try {
            const errorData = await syncResponse.json();
            console.error("Sync error details:", errorData);
            errorMessage += `: ${errorData.error || "Erreur de synchronisation"}`;
          } catch (e) {
            const errorText = await syncResponse.text();
            console.error(`Error syncing campaigns cache: ${syncResponse.status}`, errorText);
            errorMessage += `: ${errorText.substring(0, 100)}`;
          }
          
          toast.error("Erreur lors de la synchronisation des campagnes", { id: "sync-toast" });
          return { error: errorMessage };
        }

        const syncResult = await syncResponse.json();
        console.log("Sync result:", syncResult);
        
        const failedAccounts = syncResult.results?.filter((r: any) => !r.success);
        if (failedAccounts && failedAccounts.length > 0) {
          console.warn("Some accounts failed to sync:", failedAccounts);
          if (failedAccounts.length === syncResult.results.length) {
            const mainError = failedAccounts[0];
            toast.error(`Erreur de synchronisation: ${mainError.error || "Échec de connexion"}`, { id: "sync-toast" });
            return { error: `Échec de la synchronisation: ${mainError.error || "Problème de connexion API"}` };
          } else {
            toast.warning(`${failedAccounts.length} compte(s) n'ont pas pu être synchronisés`, { id: "sync-toast" });
          }
        } else {
          toast.success("Synchronisation réussie", { id: "sync-toast" });
        }

        return { success: true, data: syncResult };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === "AbortError") {
          console.error("Sync request timed out");
          toast.error("Délai d'attente dépassé lors de la synchronisation. Tentative de réveil des services...", { id: "sync-toast" });
          
          try {
            await wakeUpEdgeFunctions();
            toast.info("Services en cours d'initialisation, veuillez réessayer dans quelques instants");
          } catch (wakeUpError) {
            console.error("Error during wake-up attempt:", wakeUpError);
          }
          
          return { error: "Délai d'attente dépassé. Services en cours de démarrage." };
        }
        
        toast.error(`Erreur: ${fetchError.message}`, { id: "sync-toast" });
        return { error: `Erreur: ${fetchError.message}` };
      }
    } catch (error) {
      console.error("Error syncing campaigns cache:", error);
      toast.error(`Erreur lors de la synchronisation: ${error.message}`, { id: "sync-toast" });
      return { error: `Erreur: ${error.message}` };
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, wakeUpEdgeFunctions]);

  return { syncCampaignsCache, isSyncing };
};
