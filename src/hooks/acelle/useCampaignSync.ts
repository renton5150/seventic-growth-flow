
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AcelleConnectionDebug } from "@/types/acelle.types";

export const useCampaignSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);

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
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      const startTime = Date.now();
      
      try {
        // Essayer de réveiller les Edge Functions avant même de faire le ping
        console.log("Tentative de réveil préventif des Edge Functions...");
        await fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/ping?api_token=wake&debug=true', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Acelle-Endpoint': 'wake',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'X-Wake-Request': 'true'
          }
        }).catch(e => console.log("Erreur de réveil ignorée:", e));
        
        // Attendre un court instant pour laisser les fonctions se réveiller
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Ping service to check availability with advanced debugging
        const pingResponse = await fetch(
          'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/me?api_token=ping&debug=true', 
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Acelle-Endpoint': 'ping',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'X-Debug-Level': 'verbose'
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        // Capture detailed response information
        const pingData = await pingResponse.json();
        const duration = Date.now() - startTime;
        
        // Store diagnostic information
        const debugData: AcelleConnectionDebug = {
          success: pingResponse.ok,
          statusCode: pingResponse.status,
          responseData: pingData,
          duration,
          timestamp: new Date().toISOString(),
          request: {
            url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/me?api_token=ping&debug=true',
            headers: {
              'Authorization': `Bearer ${accessToken}`, 
              'X-Acelle-Endpoint': 'ping',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'X-Debug-Level': 'verbose'
            }
          },
          response: {
            statusCode: pingResponse.status,
            body: pingData
          }
        };
        
        // Store the debug info for UI display if needed
        setDebugInfo(debugData);
        console.log("API availability check debug info:", debugData);
        
        if (pingResponse.ok) {
          console.log("Ping successful, service status:", pingData);
          return { 
            available: true, 
            data: pingData, 
            debugInfo: debugData,
            endpoints: {
              campaigns: true,
              details: true
            }
          };
        } else {
          console.warn("Ping returned non-200 status:", pingResponse.status);
          // Essayer une seconde tentative de réveil si le ping initial échoue
          await wakeUpEdgeFunctions();
          
          return { 
            available: false, 
            status: pingResponse.status, 
            debugInfo: debugData,
            endpoints: {
              campaigns: false,
              details: false
            }
          };
        }
      } catch (pingError) {
        clearTimeout(timeoutId);
        
        // Si erreur pendant le ping, tenter de réveiller les services
        console.log("Erreur lors du ping, tentative de réveil des services...");
        await wakeUpEdgeFunctions();
        
        // Capture detailed error information
        const errorDebug: AcelleConnectionDebug = {
          success: false,
          errorMessage: pingError instanceof Error ? pingError.message : String(pingError),
          timestamp: new Date().toISOString(),
          request: {
            url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/me?api_token=ping&debug=true',
            headers: {
              'Authorization': `Bearer ${accessToken}`, 
              'X-Acelle-Endpoint': 'ping',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'X-Debug-Level': 'verbose'
            }
          }
        };
        
        // Store the error debug info
        setDebugInfo(errorDebug);
        console.log("Ping failed, debug info:", errorDebug);
        
        return { 
          available: false, 
          error: pingError.message, 
          debugInfo: errorDebug,
          endpoints: {
            campaigns: false,
            details: false
          }
        };
      }
    } catch (error) {
      console.error("Error checking API availability:", error);
      return { 
        available: false, 
        error: error.message,
        endpoints: {
          campaigns: false,
          details: false
        }
      };
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
      setDebugInfo(apiStatus.debugInfo || null);
      
      if (!apiStatus.available) {
        console.log("API not available, trying to wake up services...");
        toast.warning("Les services sont indisponibles, tentative de réveil...");
        await wakeUpEdgeFunctions();
        toast.info("Services en cours d'initialisation, veuillez réessayer dans quelques instants");
        return { error: "Services unavailable, wake-up initiated", debugInfo: apiStatus.debugInfo };
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
      
      // Add diagnostic options to the sync request
      const requestStartTime = Date.now();

      try {
        // First check if the service is responsive with a ping
        console.log("Service is responsive, proceeding with sync");
        
        // Proceed with actual sync with diagnostic data
        const syncResponse = await fetch(
          'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', 
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Debug-Level': 'verbose'  // Request verbose logging
            },
            body: JSON.stringify({
              forceSync: true,
              startServices: true,
              debug: true,            // Enable debug mode
              authMethods: ["token", "basic", "header"],  // Try alternative auth methods
              timeout: 30000,         // 30 seconds timeout
              requestId: `sync-${Date.now()}`  // For tracking in logs
            }),
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);
        
        // Capture detailed response information
        const responseTime = Date.now() - requestStartTime;
        
        if (!syncResponse.ok) {
          let errorMessage = `Erreur ${syncResponse.status}`;
          let errorData;
          
          try {
            errorData = await syncResponse.json();
            console.error("Sync error details:", errorData);
            errorMessage += `: ${errorData.error || "Erreur de synchronisation"}`;
          } catch (e) {
            const errorText = await syncResponse.text();
            console.error(`Error syncing campaigns cache: ${syncResponse.status}`, errorText);
            errorMessage += `: ${errorText.substring(0, 200)}`;
          }
          
          // Store diagnostic information for troubleshooting
          const syncDebugInfo: AcelleConnectionDebug = {
            success: false,
            statusCode: syncResponse.status,
            responseData: errorData || {},
            errorMessage,
            duration: responseTime,
            timestamp: new Date().toISOString(),
            request: {
              url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns'
            },
            response: {
              statusCode: syncResponse.status,
              body: errorData || {}
            }
          };
          
          setDebugInfo(syncDebugInfo);
          console.log("Sync failed, debug info:", syncDebugInfo);
          
          toast.error("Erreur lors de la synchronisation des campagnes", { id: "sync-toast" });
          return { error: errorMessage, debugInfo: syncDebugInfo };
        }

        const syncResult = await syncResponse.json();
        console.log("Sync result:", syncResult);
        
        // Store successful sync diagnostic information
        const syncDebugInfo: AcelleConnectionDebug = {
          success: true,
          statusCode: syncResponse.status,
          responseData: syncResult,
          duration: responseTime,
          timestamp: new Date().toISOString(),
          request: {
            url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns'
          },
          response: {
            statusCode: syncResponse.status,
            body: syncResult
          }
        };
        
        setDebugInfo(syncDebugInfo);
        
        const failedAccounts = syncResult.results?.filter((r: any) => !r.success);
        if (failedAccounts && failedAccounts.length > 0) {
          console.warn("Some accounts failed to sync:", failedAccounts);
          if (failedAccounts.length === syncResult.results.length) {
            const mainError = failedAccounts[0];
            toast.error(`Erreur de synchronisation: ${mainError.error || "Échec de connexion"}`, { id: "sync-toast" });
            return { error: `Échec de la synchronisation: ${mainError.error || "Problème de connexion API"}`, debugInfo: syncDebugInfo };
          } else {
            toast.warning(`${failedAccounts.length} compte(s) n'ont pas pu être synchronisés`, { id: "sync-toast" });
          }
        } else {
          toast.success("Synchronisation réussie", { id: "sync-toast" });
        }

        return { success: true, data: syncResult, debugInfo: syncDebugInfo };
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
          
          // Store timeout error diagnostic information
          const timeoutDebugInfo: AcelleConnectionDebug = {
            success: false,
            errorMessage: "Request timeout exceeded",
            timestamp: new Date().toISOString(),
            duration: Date.now() - requestStartTime,
            request: {
              url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns'
            }
          };
          
          setDebugInfo(timeoutDebugInfo);
          
          return { error: "Délai d'attente dépassé. Services en cours de démarrage.", debugInfo: timeoutDebugInfo };
        }
        
        // Store fetch error diagnostic information
        const errorDebugInfo: AcelleConnectionDebug = {
          success: false,
          errorMessage: fetchError.message || "Unknown fetch error",
          timestamp: new Date().toISOString(),
          duration: Date.now() - requestStartTime,
          request: {
            url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns'
          }
        };
        
        setDebugInfo(errorDebugInfo);
        
        toast.error(`Erreur: ${fetchError.message}`, { id: "sync-toast" });
        return { error: `Erreur: ${fetchError.message}`, debugInfo: errorDebugInfo };
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
      
      const startTime = Date.now();

      // Tentatives multiples de réveil des services
      const wakeupEndpoints = [
        // Réveil d'acelle-proxy
        {
          url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/me',
          params: 'api_token=ping&debug=true',
          retries: 2
        },
        // Réveil de sync-email-campaigns 
        {
          url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns',
          method: 'OPTIONS',
          retries: 2
        },
        // Ping acelle-proxy sans paramètres
        {
          url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/ping',
          retries: 1
        }
      ];

      // Exécuter toutes les tentatives de réveil en parallèle
      const wakeupPromises = wakeupEndpoints.map(async endpoint => {
        for (let i = 0; i < endpoint.retries; i++) {
          try {
            const response = await fetch(
              `${endpoint.url}${endpoint.params ? `?${endpoint.params}` : ''}`, 
              {
                method: endpoint.method || 'GET',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'X-Acelle-Endpoint': 'ping',
                  'Content-Type': 'application/json',
                  'X-Debug-Level': 'verbose',
                  'X-Wake-Request': 'true',
                  'Cache-Control': 'no-store'
                },
                signal: AbortSignal.timeout(10000)
              }
            );
            
            if (response.ok) {
              console.log(`Wake-up successful for ${endpoint.url}`);
              return true;
            }
          } catch (error) {
            console.log(`Wake-up attempt ${i+1} for ${endpoint.url} failed:`, error);
            // Attendre un peu entre les tentatives
            if (i < endpoint.retries - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        return false;
      });
      
      await Promise.all(wakeupPromises);
      
      // Attendre un peu pour laisser les services démarrer
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check if services are now responsive
      const apiStatus = await checkApiAvailability();
      
      const wakeUpDebugInfo: AcelleConnectionDebug = {
        success: apiStatus.available || false,
        responseData: apiStatus.data || {},
        errorMessage: apiStatus.available ? undefined : "Service wake-up check failed",
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        request: {
          url: 'Multiple wake-up requests to edge functions'
        }
      };
      
      setDebugInfo(wakeUpDebugInfo);
      
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

  // Export debug info for troubleshooting in UI
  const getDebugInfo = () => debugInfo;

  return { 
    syncCampaignsCache, 
    wakeUpEdgeFunctions, 
    checkApiAvailability, 
    isSyncing, 
    getDebugInfo 
  };
};
