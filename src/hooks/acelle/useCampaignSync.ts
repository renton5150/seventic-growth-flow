
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AcelleConnectionDebug } from "@/types/acelle.types";
import { ACELLE_PROXY_CONFIG } from "@/services/acelle/acelle-service";

export const useCampaignSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);

  // Fonction utilitaire pour construire l'URL du proxy
  const buildProxyUrl = (targetUrl: string): string => {
    return `${ACELLE_PROXY_CONFIG.BASE_URL}?url=${encodeURIComponent(targetUrl)}`;
  };

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
        // Proactive wake-up attempt for Edge Functions
        console.log("Attempting preemptive wake of Edge Functions...");
        
        const wakeupPromises = [
          // Wake cors-proxy with a simple request
          fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy?url=https://emailing.plateforme-solution.net/api/v1/ping', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Cache-Control': 'no-store',
              'X-Wake-Request': 'true'
            },
            signal: AbortSignal.timeout(8000)
          }).catch(() => console.log("Wake-up cors-proxy completed")),
          
          // Wake sync-email-campaigns with OPTIONS request
          fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', {
            method: 'OPTIONS',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Cache-Control': 'no-store'
            },
            signal: AbortSignal.timeout(8000)
          }).catch(() => console.log("Wake-up options completed"))
        ];
        
        await Promise.allSettled(wakeupPromises);
        
        // Wait a short time to allow services to wake up
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Now check if the API is responsive with a ping through our proxy
        const pingTargetUrl = `${ACELLE_PROXY_CONFIG.ACELLE_API_URL}/me?api_token=ping&debug=true`;
        const pingProxyUrl = buildProxyUrl(pingTargetUrl);
        
        const pingResponse = await fetch(
          pingProxyUrl, 
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Debug-Level': 'verbose'
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        // Capture detailed response information
        let pingData;
        try {
          pingData = await pingResponse.json();
        } catch (e) {
          pingData = { error: "Unable to parse response" };
        }
        
        const duration = Date.now() - startTime;
        
        // Store diagnostic information
        const debugData: AcelleConnectionDebug = {
          success: pingResponse.ok,
          statusCode: pingResponse.status,
          responseData: pingData,
          duration,
          timestamp: new Date().toISOString(),
          request: {
            url: pingProxyUrl,
            headers: {
              'Authorization': `Bearer ${accessToken}`, 
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
        
        // Store the debug info for UI display
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
        
        // Capture detailed error information
        const errorDebug: AcelleConnectionDebug = {
          success: false,
          errorMessage: pingError instanceof Error ? pingError.message : String(pingError),
          timestamp: new Date().toISOString(),
          request: {
            url: buildProxyUrl(`${ACELLE_PROXY_CONFIG.ACELLE_API_URL}/me?api_token=ping&debug=true`),
            headers: {
              'Authorization': `Bearer ${accessToken}`, 
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
          error: pingError instanceof Error ? pingError.message : String(pingError), 
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
        error: error instanceof Error ? error.message : String(error),
        endpoints: {
          campaigns: false,
          details: false
        }
      };
    }
  }, []);

  const syncCampaignsCache = useCallback(async (options: { 
    forceSync?: boolean, 
    quietMode?: boolean 
  } = {}) => {
    const { forceSync = false, quietMode = false } = options;
    
    if (isSyncing && !forceSync) {
      console.log("Sync already in progress, skipping...");
      return { skipped: true };
    }

    setIsSyncing(true);
    const syncStartTime = Date.now();
    
    try {
      // Check API availability first
      const apiStatus = await checkApiAvailability();
      setDebugInfo(apiStatus.debugInfo || null);
      
      if (!apiStatus.available) {
        console.log("API not available, trying to wake up services...");
        if (!quietMode) toast.warning("Les services sont indisponibles, tentative de réveil...");
        await wakeUpEdgeFunctions();
        if (!quietMode) toast.info("Services en cours d'initialisation, veuillez réessayer dans quelques instants");
        return { 
          error: "Services unavailable, wake-up initiated", 
          debugInfo: apiStatus.debugInfo 
        };
      }
      
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("No auth token available");
        if (!quietMode) toast.error("Authentification requise");
        return { error: "Authentication required" };
      }

      console.log("Initiating campaign sync...");
      if (!quietMode) toast.loading("Synchronisation des campagnes en cours...", { id: "sync-toast" });
      
      // Use AbortController for timeout
      const controller = new AbortController();
      // Extended timeout to 35 seconds to account for cold starts
      const timeoutId = setTimeout(() => controller.abort(), 35000);
      
      try {
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
        const responseTime = Date.now() - syncStartTime;
        
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
          
          if (!quietMode) toast.error("Erreur lors de la synchronisation des campagnes", { id: "sync-toast" });
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
          if (!quietMode) {
            if (failedAccounts.length === syncResult.results.length) {
              const mainError = failedAccounts[0];
              toast.error(`Erreur de synchronisation: ${mainError.error || "Échec de connexion"}`, { id: "sync-toast" });
              return { error: `Échec de la synchronisation: ${mainError.error || "Problème de connexion API"}`, debugInfo: syncDebugInfo };
            } else {
              toast.warning(`${failedAccounts.length} compte(s) n'ont pas pu être synchronisés`, { id: "sync-toast" });
            }
          }
        } else if (!quietMode) {
          toast.success("Synchronisation réussie", { id: "sync-toast" });
        }

        return { success: true, data: syncResult, debugInfo: syncDebugInfo };
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === "AbortError") {
          console.error("Sync request timed out");
          if (!quietMode) toast.error("Délai d'attente dépassé lors de la synchronisation. Tentative de réveil des services...", { id: "sync-toast" });
          
          try {
            await wakeUpEdgeFunctions();
            if (!quietMode) toast.info("Services en cours d'initialisation, veuillez réessayer dans quelques instants");
          } catch (wakeUpError) {
            console.error("Error during wake-up attempt:", wakeUpError);
          }
          
          // Store timeout error diagnostic information
          const timeoutDebugInfo: AcelleConnectionDebug = {
            success: false,
            errorMessage: "Request timeout exceeded",
            timestamp: new Date().toISOString(),
            duration: Date.now() - syncStartTime,
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
          duration: Date.now() - syncStartTime,
          request: {
            url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns'
          }
        };
        
        setDebugInfo(errorDebugInfo);
        
        if (!quietMode) toast.error(`Erreur: ${fetchError.message}`, { id: "sync-toast" });
        return { error: `Erreur: ${fetchError.message}`, debugInfo: errorDebugInfo };
      }
    } catch (error: any) {
      console.error("Error syncing campaigns cache:", error);
      if (!quietMode) toast.error(`Erreur lors de la synchronisation: ${error.message}`, { id: "sync-toast" });
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

      // Multiple wake-up attempts with different methods
      const wakeupEndpoints = [
        // Wake acelle-proxy with me endpoint (first attempt)
        {
          url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/me',
          params: 'api_token=ping&debug=true',
          retries: 1
        },
        // Wake acelle-proxy with ping endpoint (second attempt)
        {
          url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/ping',
          params: 'wake=true',
          retries: 1
        },
        // Wake sync-email-campaigns with OPTIONS request (may wake function)
        {
          url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns',
          method: 'OPTIONS',
          retries: 2
        },
        // Make direct POST to sync-email-campaigns with minimal payload
        {
          url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns',
          method: 'POST',
          body: {
            startServices: true
          },
          retries: 1
        }
      ];

      // Execute all wake-up attempts in parallel for faster response
      const wakeupPromises = wakeupEndpoints.map(async endpoint => {
        for (let i = 0; i < endpoint.retries; i++) {
          try {
            const requestInit: RequestInit = {
              method: endpoint.method || 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Debug-Level': 'verbose',
                'X-Wake-Request': 'true',
                'Cache-Control': 'no-store'
              },
              signal: AbortSignal.timeout(10000)
            };
            
            // Add body for POST requests
            if (endpoint.method === 'POST' && endpoint.body) {
              requestInit.body = JSON.stringify(endpoint.body);
            }
            
            const response = await fetch(
              `${endpoint.url}${endpoint.params ? `?${endpoint.params}` : ''}`, 
              requestInit
            );
            
            if (response.ok) {
              console.log(`Wake-up successful for ${endpoint.url}`);
              return true;
            }
          } catch (error) {
            console.log(`Wake-up attempt ${i+1} for ${endpoint.url} failed:`, error);
            // Wait between retry attempts
            if (i < endpoint.retries - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        return false;
      });
      
      // Wait for all wake-up attempts to complete
      const results = await Promise.all(wakeupPromises);
      const anySuccessful = results.some(result => result);
      
      // Wait for services to initialize
      await new Promise(resolve => setTimeout(resolve, anySuccessful ? 3000 : 5000));

      // Check if services are now responsive
      const apiStatus = await checkApiAvailability();
      
      // Record diagnostic information
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
        // Wait more before final check
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
  const getDebugInfo = useCallback(() => debugInfo, [debugInfo]);

  return { 
    syncCampaignsCache, 
    wakeUpEdgeFunctions, 
    checkApiAvailability, 
    isSyncing, 
    getDebugInfo 
  };
};
