
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCampaignSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const checkApiAvailability = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available for API check");
        return { available: false, error: "Authentication required" };
      }
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        // Ping service to check availability
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
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        if (pingResponse.ok) {
          const pingData = await pingResponse.json();
          console.log("Ping successful, service status:", pingData);
          return { available: true, data: pingData };
        } else {
          console.warn("Ping returned non-200 status:", pingResponse.status);
          return { available: false, status: pingResponse.status };
        }
      } catch (pingError) {
        clearTimeout(timeoutId);
        console.log("Ping failed, service may need to wake up:", pingError);
        return { available: false, error: pingError.message };
      }
    } catch (error) {
      console.error("Error checking API availability:", error);
      return { available: false, error: error.message };
    }
  }, []);

  const syncCampaignsCache = useCallback(async () => {
    if (isSyncing) {
      console.log("Sync already in progress, skipping...");
      return { skipped: true };
    }

    setIsSyncing(true);
    try {
      // Vérifier d'abord si l'API est disponible
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
      
      // Use AbortController for timeout
      const controller = new AbortController();
      // Extend timeout to 35 seconds to account for cold starts
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      try {
        // First check if the service is responsive with a ping
        console.log("Service is responsive, proceeding with sync");
        
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
      } catch (fetchError: any) {
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
    } catch (error: any) {
      console.error("Error syncing campaigns cache:", error);
      toast.error(`Erreur lors de la synchronisation: ${error.message}`, { id: "sync-toast" });
      return { error: `Erreur: ${error.message}` };
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, checkApiAvailability]);

  const wakeUpEdgeFunctions = useCallback(async () => {
    try {
      console.log("Attempting to wake up edge functions...");
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available for wake up");
        return false;
      }

      toast.loading("Initialisation des services...", { id: "wake-up-toast" });

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
        console.log("Wake-up request sent to acelle-proxy");
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
        console.log("Wake-up request sent to sync-email-campaigns");
      } catch (error) {
        console.log("First wake-up attempt for sync-email-campaigns failed as expected if service is cold starting");
      }

      // Try a second time after a short delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if services are now responsive
      const apiStatus = await checkApiAvailability();
      
      if (apiStatus.available) {
        toast.success("Services initialisés avec succès", { id: "wake-up-toast" });
      } else {
        toast.info("Services en cours d'initialisation, veuillez patienter...", { id: "wake-up-toast" });
        // Wait a bit more before final check
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const finalCheck = await checkApiAvailability();
        if (finalCheck.available) {
          toast.success("Services initialisés avec succès", { id: "wake-up-toast" });
        } else {
          toast.warning("Initialisation des services en cours, veuillez réessayer plus tard", { id: "wake-up-toast" });
        }
      }
      
      return apiStatus.available;
    } catch (error) {
      console.error("Error waking up edge functions:", error);
      toast.error("Erreur lors de l'initialisation des services", { id: "wake-up-toast" });
      return false;
    }
  }, [checkApiAvailability]);

  return { syncCampaignsCache, wakeUpEdgeFunctions, checkApiAvailability, isSyncing };
};
