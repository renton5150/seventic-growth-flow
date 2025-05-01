
import { useState, useEffect } from "react";
import { AcelleConnectionDebug, AcelleAccount } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle/acelle-service";
import { isSupabaseAuthenticated } from "@/services/missions-service/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useSystemStatus = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState<{[key: string]: boolean}>({});
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);
  const [authStatus, setAuthStatus] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<string>("status");
  const [cacheInfo, setCacheInfo] = useState<{
    count: number;
    lastUpdate: string | null;
    status: string;
  }>({
    count: 0,
    lastUpdate: null,
    status: "unknown"
  });

  // Create a test account to use for API checks
  const testAccount: AcelleAccount = {
    id: "system-test",
    apiEndpoint: "https://emailing.plateforme-solution.net",
    apiToken: "test-token",
    name: "System Test",
    status: "active" as "active" | "inactive" | "error",
    created_at: new Date().toISOString(),
    lastSyncDate: null,
    lastSyncError: null,
    cachePriority: 0
  };

  // Fetch cache information for diagnostic purposes
  const fetchCacheInfo = async () => {
    try {
      const { data, error, count } = await supabase
        .from('email_campaigns_cache')
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.error("Error fetching cache info:", error);
        setCacheInfo(prev => ({ ...prev, status: "error" }));
        return;
      }
      
      // Get the most recent cache update
      const { data: latestData } = await supabase
        .from('email_campaigns_cache')
        .select('cache_updated_at')
        .order('cache_updated_at', { ascending: false })
        .limit(1);
        
      setCacheInfo({
        count: count || 0,
        lastUpdate: latestData && latestData.length > 0 ? latestData[0].cache_updated_at : null,
        status: count && count > 0 ? "available" : "empty"
      });
      
    } catch (e) {
      console.error("Error in fetchCacheInfo:", e);
      setCacheInfo(prev => ({ ...prev, status: "error" }));
    }
  };

  // Load cache info when component mounts and when tab changes
  useEffect(() => {
    if (activeTab === "cache") {
      fetchCacheInfo();
    }
  }, [activeTab]);

  const wakeUpEdgeFunctions = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        console.log("No auth session available for wake-up request");
        return false;
      }
      
      toast.loading("Réveil des services en cours...", { id: "wake-services" });
      
      const wakeUpPromises = [
        fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy/ping', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Cache-Control': 'no-store',
            'X-Wake-Request': 'true'
          }
        }).catch(() => console.log("Wake-up attempt for cors-proxy completed"))
      ];
      
      await Promise.all(wakeUpPromises);
      toast.success("Services réveillés avec succès", { id: "wake-services" });
      return true;
    } catch (e) {
      console.error("Error waking up services:", e);
      toast.error(`Erreur lors du réveil des services: ${e instanceof Error ? e.message : 'Erreur inconnue'}`, { id: "wake-services" });
      return false;
    }
  };

  const checkApiAvailability = async () => {
    try {
      const connectionDebug = await acelleService.testAcelleConnection(testAccount);
      setDebugInfo(connectionDebug);
      return {
        available: connectionDebug.success,
        debugInfo: connectionDebug
      };
    } catch (e) {
      console.error("API availability check failed:", e);
      return {
        available: false,
        error: e instanceof Error ? e.message : "Unknown error",
        debugInfo: null
      };
    }
  };

  const refreshCacheInfo = async () => {
    toast.loading("Actualisation des informations du cache...", { id: "refresh-cache" });
    await fetchCacheInfo();
    toast.success("Informations du cache actualisées", { id: "refresh-cache" });
  };

  const runDiagnostics = async () => {
    setIsTesting(true);
    try {
      toast.loading("Test des services en cours...", { id: "api-test" });
      
      // Vérifier d'abord l'état de l'authentification Supabase
      const isAuthenticated = await isSupabaseAuthenticated();
      setAuthStatus(isAuthenticated);
      
      if (!isAuthenticated) {
        toast.error("Authentification Supabase requise", { id: "api-test" });
        setIsTesting(false);
        return;
      }
      
      // Tenter de réveiller les fonctions Edge avant le test principal
      await wakeUpEdgeFunctions();
      
      // First check API accessibility
      const apiStatus = await checkApiAvailability();
      
      if (apiStatus.debugInfo) {
        setDebugInfo(apiStatus.debugInfo);
      }
      
      const status = {
        endpoints: {
          campaigns: apiStatus.available,
          details: apiStatus.available
        }
      };
      
      setEndpointStatus(status.endpoints || {});
      setLastTestTime(new Date());
      
      if (apiStatus.available) {
        toast.success("Tous les services sont opérationnels", { id: "api-test" });
      } else {
        // If API is not available, try to wake up services
        toast.warning("Services indisponibles, tentative de réveil...", { id: "api-test" });
        await wakeUpEdgeFunctions();
        
        // Check again after wake up attempt
        const retryStatus = await checkApiAvailability();
        
        if (retryStatus.debugInfo) {
          setDebugInfo(retryStatus.debugInfo);
        }
        
        if (retryStatus.available) {
          toast.success("Services réveillés avec succès", { id: "api-test" });
          setEndpointStatus({
            campaigns: true,
            details: true
          });
        } else {
          toast.error("Certains services restent indisponibles", { id: "api-test" });
          
          // Add more specific error information
          if (retryStatus.error) {
            toast.error(`Erreur: ${retryStatus.error}`, { id: "api-test-details", duration: 5000 });
          }
        }
      }
      
      // Update cache status after API test
      if (activeTab === "cache" || activeTab === "status") {
        await fetchCacheInfo();
      }
    } catch (error) {
      console.error("Erreur lors du diagnostic:", error);
      toast.error(`Erreur lors du test des services: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, { id: "api-test" });
    } finally {
      setIsTesting(false);
    }
  };

  return {
    isTesting,
    endpointStatus,
    lastTestTime,
    debugInfo,
    authStatus,
    activeTab,
    setActiveTab,
    cacheInfo,
    wakeUpEdgeFunctions,
    checkApiAvailability,
    refreshCacheInfo,
    runDiagnostics
  };
};
