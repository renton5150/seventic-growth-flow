
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCampaignSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);

  // Fonction améliorée pour vérifier la disponibilité de l'API
  const checkApiAvailability = useCallback(async (retries = 2, retryDelay = 1500) => {
    try {
      console.log("Vérification de la disponibilité de l'API...");
      
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available for API check");
        return { available: false, error: "Authentication required" };
      }
      
      // Utilisation de fetch avec timeout et retries
      let attempt = 0;
      let lastError = null;
      
      while (attempt <= retries) {
        try {
          console.log(`Tentative #${attempt + 1} de vérification de l'API`);
          
          // Use AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          // Ping service to check availability
          const pingResponse = await fetch(
            'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/me?api_token=ping', 
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Acelle-Endpoint': 'ping',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
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
            console.warn(`Ping returned non-200 status: ${pingResponse.status}`);
            lastError = { status: pingResponse.status };
            
            // Si on n'a pas atteint le nombre max de retries, on attend avant de réessayer
            if (attempt < retries) {
              await new Promise(r => setTimeout(r, retryDelay));
              attempt++;
              continue;
            }
            
            return { available: false, status: pingResponse.status };
          }
        } catch (pingError) {
          clearTimeout?.();
          console.log(`Ping attempt #${attempt + 1} failed:`, pingError);
          lastError = pingError;
          
          // Si on n'a pas atteint le nombre max de retries, on attend avant de réessayer
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, retryDelay));
            attempt++;
            continue;
          }
          
          return { available: false, error: pingError.message };
        }
      }
      
      // Si on arrive ici, c'est qu'on a épuisé toutes nos tentatives
      return { available: false, error: lastError?.message || "Max retries reached" };
    } catch (error) {
      console.error("Error checking API availability:", error);
      return { available: false, error: error.message };
    }
  }, []);

  // Fonction améliorée pour la synchronisation des campagnes
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
        
        const failedAccounts = syncResult.results?.filter((r) => !r.success);
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
  }, [isSyncing, checkApiAvailability]);

  // Fonction améliorée pour réveiller les fonctions edge
  const wakeUpEdgeFunctions = useCallback(async () => {
    if (isWakingUp) {
      console.log("Wake-up already in progress, skipping...");
      return false;
    }
    
    setIsWakingUp(true);
    
    try {
      console.log("Attempting to wake up edge functions...");
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available for wake up");
        setIsWakingUp(false);
        return false;
      }

      toast.loading("Initialisation des services...", { id: "wake-up-toast" });

      // Improved wake-up sequence
      const wakeupSequence = [
        {
          url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/ping',
          method: 'GET',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        },
        {
          url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/me?api_token=ping',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Acelle-Endpoint': 'ping'
          }
        },
        {
          url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns',
          method: 'OPTIONS',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      ];
      
      // Fonction pour effectuer une requête avec retry
      const attemptRequest = async (requestConfig, retries = 1) => {
        for (let i = 0; i <= retries; i++) {
          try {
            await fetch(requestConfig.url, {
              method: requestConfig.method,
              headers: requestConfig.headers,
              signal: AbortSignal.timeout(i === 0 ? 5000 : 8000)
            });
            console.log(`Successful request to ${requestConfig.url} on attempt ${i + 1}`);
            return true;
          } catch (err) {
            console.log(`Request to ${requestConfig.url} failed on attempt ${i + 1}:`, err.name);
            if (i < retries) {
              await new Promise(r => setTimeout(r, 1000));
            }
          }
        }
        return false;
      };
      
      // Exécution des requêtes de réveil en parallèle
      await Promise.allSettled(wakeupSequence.map(req => attemptRequest(req)));
      
      // Attente courte pour laisser le temps aux services de démarrer
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Vérification si les services sont maintenant réactifs
      const apiStatus = await checkApiAvailability(1, 2000);
      
      if (apiStatus.available) {
        toast.success("Services initialisés avec succès", { id: "wake-up-toast" });
        setIsWakingUp(false);
        return true;
      } else {
        // Attendre un peu plus avant la vérification finale
        toast.info("Services en cours d'initialisation, veuillez patienter...", { id: "wake-up-toast" });
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        const finalCheck = await checkApiAvailability(1, 2000);
        if (finalCheck.available) {
          toast.success("Services initialisés avec succès", { id: "wake-up-toast" });
          setIsWakingUp(false);
          return true;
        } else {
          toast.warning("Initialisation des services en cours, veuillez réessayer plus tard", { id: "wake-up-toast" });
          setIsWakingUp(false);
          return false;
        }
      }
    } catch (error) {
      console.error("Error waking up edge functions:", error);
      toast.error("Erreur lors de l'initialisation des services", { id: "wake-up-toast" });
      setIsWakingUp(false);
      return false;
    }
  }, [checkApiAvailability, isWakingUp]);

  return { 
    syncCampaignsCache, 
    wakeUpEdgeFunctions, 
    checkApiAvailability, 
    isSyncing,
    isWakingUp
  };
};
