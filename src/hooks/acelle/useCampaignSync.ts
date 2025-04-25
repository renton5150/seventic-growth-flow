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
              'X-Acelle-Endpoint': 'ping',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'X-Debug-Level': 'verbose'
            },
            method: 'GET'
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
          return { available: true, data: pingData, debugInfo: debugData };
        } else {
          console.warn("Ping returned non-200 status:", pingResponse.status);
          return { available: false, status: pingResponse.status, debugInfo: debugData };
        }
      } catch (pingError) {
        clearTimeout(timeoutId);
        
        // Capture detailed error information
        const errorDebug: AcelleConnectionDebug = {
          success: false,
          errorMessage: pingError instanceof Error ? pingError.message : String(pingError),
          timestamp: new Date().toISOString(),
          request: {
            url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/me?api_token=ping&debug=true',
            headers: {
              'X-Acelle-Endpoint': 'ping',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'X-Debug-Level': 'verbose'
            },
            method: 'GET'
          }
        };
        
        // Store the error debug info
        setDebugInfo(errorDebug);
        console.log("Ping failed, debug info:", errorDebug);
        
        return { available: false, error: pingError.message, debugInfo: errorDebug };
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
              url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Debug-Level': 'verbose'
              },
              body: {
                forceSync: true,
                startServices: true,
                debug: true,
                authMethods: ["token", "basic", "header"],
                timeout: 30000
              }
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
            url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Debug-Level': 'verbose'
            },
            body: {
              forceSync: true,
              startServices: true,
              debug: true,
              authMethods: ["token", "basic", "header"],
              timeout: 30000
            }
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
              url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Debug-Level': 'verbose'
              },
              body: {
                forceSync: true,
                startServices: true,
                debug: true,
                authMethods: ["token", "basic", "header"],
                timeout: 30000
              }
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
            url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Debug-Level': 'verbose'
            },
            body: {
              forceSync: true,
              startServices: true,
              debug: true,
              authMethods: ["token", "basic", "header"],
              timeout: 30000
            }
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

      // Attempt to wake up acelle-proxy with ping and advanced diagnostics
      try {
        const proxyResponse = await fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/me?api_token=ping&debug=true', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Acelle-Endpoint': 'ping',
            'Content-Type': 'application/json',
            'X-Debug-Level': 'verbose',
            'X-Wake-Request': 'true'
          },
          signal: AbortSignal.timeout(15000)
        });
        
        if (proxyResponse.ok) {
          const proxyData = await proxyResponse.json();
          console.log("Wake-up response from acelle-proxy:", proxyData);
        }
      } catch (error) {
        console.log("First wake-up attempt for acelle-proxy failed as expected if service is cold starting:", error);
      }
      
      // Attempt to wake up sync-email-campaigns function with diagnostics
      try {
        const syncResponse = await fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Debug-Level': 'verbose',
            'X-Wake-Request': 'true'
          },
          signal: AbortSignal.timeout(15000)
        });
        
        if (syncResponse.ok) {
          console.log("Wake-up response from sync-email-campaigns successful");
        }
      } catch (error) {
        console.log("First wake-up attempt for sync-email-campaigns failed as expected if service is cold starting:", error);
      }

      // Try a second time after a short delay
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
          url: 'Multiple wake-up requests to edge functions',
          method: 'MULTIPLE',
          headers: {
            'X-Debug-Level': 'verbose',
            'X-Wake-Request': 'true'
          }
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

  return { syncCampaignsCache, wakeUpEdgeFunctions, checkApiAvailability, isSyncing, getDebugInfo };
};
