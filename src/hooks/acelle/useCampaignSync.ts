
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCampaignSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncCampaignsCache = useCallback(async () => {
    if (isSyncing) {
      console.log("Sync already in progress, skipping...");
      return { skipped: true };
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available");
        return { error: "Authentication required" };
      }

      console.log("Initiating campaign sync...");
      
      // Use AbortController for timeout
      const controller = new AbortController();
      // Extend timeout to 35 seconds to account for cold starts
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      try {
        // First check if the service is responsive with a ping
        console.log("Checking if service is responsive...");
        try {
          const pingResponse = await fetch(
            'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/me?api_token=ping', 
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Acelle-Endpoint': 'ping',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              },
              signal: AbortSignal.timeout(5000)
            }
          );
          
          if (pingResponse.ok) {
            console.log("Ping successful, service appears to be active");
          } else {
            console.warn("Ping returned non-200 status:", pingResponse.status);
          }
        } catch (pingError) {
          console.log("Ping failed, service may need to wake up:", pingError);
          // Continue with sync attempt anyway
        }

        // Proceed with actual sync
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
          
          toast.error("Erreur lors de la synchronisation des campagnes");
          return { error: errorMessage };
        }

        const syncResult = await syncResponse.json();
        console.log("Sync result:", syncResult);
        
        const failedAccounts = syncResult.results?.filter((r: any) => !r.success);
        if (failedAccounts && failedAccounts.length > 0) {
          console.warn("Some accounts failed to sync:", failedAccounts);
          if (failedAccounts.length === syncResult.results.length) {
            const mainError = failedAccounts[0];
            toast.error(`Erreur de synchronisation: ${mainError.error || "Échec de connexion"}`);
            return { error: `Échec de la synchronisation: ${mainError.error || "Problème de connexion API"}` };
          } else {
            toast.warning(`${failedAccounts.length} compte(s) n'ont pas pu être synchronisés`);
          }
        } else {
          toast.success("Synchronisation réussie");
        }

        return { success: true, data: syncResult };
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === "AbortError") {
          console.error("Sync request timed out");
          toast.error("Délai d'attente dépassé lors de la synchronisation. Tentative de réveil des services...");
          
          try {
            await wakeUpEdgeFunctions();
            toast.info("Services en cours d'initialisation, veuillez réessayer dans quelques instants");
          } catch (wakeUpError) {
            console.error("Error during wake-up attempt:", wakeUpError);
          }
          
          return { error: "Délai d'attente dépassé. Services en cours de démarrage." };
        }
        
        return { error: `Erreur: ${fetchError.message}` };
      }
    } catch (error: any) {
      console.error("Error syncing campaigns cache:", error);
      toast.error("Erreur lors de la synchronisation");
      return { error: `Erreur: ${error.message}` };
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  const wakeUpEdgeFunctions = useCallback(async () => {
    try {
      console.log("Attempting to wake up edge functions...");
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available for wake up");
        return false;
      }

      toast.loading("Initialisation des services...");

      // Attempt to wake up acelle-proxy with ping
      try {
        await fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/me?api_token=ping', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Acelle-Endpoint': 'ping',
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(8000)
        });
      } catch (error) {
        console.log("First wake-up attempt for acelle-proxy failed as expected if service is cold starting");
      }
      
      // Attempt to wake up sync-email-campaigns function
      try {
        await fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          signal: AbortSignal.timeout(8000)
        });
      } catch (error) {
        console.log("First wake-up attempt for sync-email-campaigns failed as expected if service is cold starting");
      }

      // Wait for edge functions to initialize (cold start can take a few seconds)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      toast.success("Services initialisés avec succès");
      return true;
    } catch (error) {
      console.error("Error waking up edge functions:", error);
      toast.error("Erreur lors de l'initialisation des services");
      return false;
    }
  }, []);

  return { syncCampaignsCache, wakeUpEdgeFunctions, isSyncing };
};
