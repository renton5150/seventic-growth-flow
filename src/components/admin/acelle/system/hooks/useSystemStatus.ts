import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { testAcelleConnection } from "@/services/acelle/api/connection";
import { useQuery } from '@tanstack/react-query';
import { getAcelleAccounts } from '@/services/acelle/api/accounts';
import { AcelleAccount, AcelleConnectionDebug } from '@/types/acelle.types';
import { isSupabaseAuthenticated } from "@/services/missions-service/auth/supabaseAuth";
import { toast } from "sonner";

export const useSystemStatus = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState<{[key: string]: boolean}>({});
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);
  const [authStatus, setAuthStatus] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<string>("status");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<{
    count: number;
    lastUpdate: string | null;
    status: string;
  }>({
    count: 0,
    lastUpdate: null,
    status: "unknown"
  });

  // Test account for API check
  const testAccount: AcelleAccount = {
    id: 'system-test',
    name: 'Test Account',
    api_endpoint: 'https://emailing.plateforme-solution.net/api/v1',
    api_token: 'test-token',
    status: 'inactive',
    created_at: new Date().toISOString(),
    lastSyncDate: null,
    lastSyncError: null,
    cachePriority: 0
  };

  // Run authentication check and get token on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        const isAuthenticated = await isSupabaseAuthenticated();
        setAuthStatus(isAuthenticated);
        
        if (isAuthenticated) {
          // Try to refresh the session to ensure we have a valid token
          await supabase.auth.refreshSession();
          
          // Get the refreshed token
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          
          if (token) {
            console.log("Auth token obtained for system status");
            setAuthToken(token);
          } else {
            console.error("No auth token available despite being authenticated");
          }
        }
      } catch (error) {
        console.error("Error during authentication check:", error);
        setAuthStatus(false);
      }
    };
    
    checkAuth();
  }, []);

  // Fetch cache information for diagnostic purposes
  const fetchCacheInfo = async () => {
    try {
      // Get total count of cached campaigns
      const { data, error, count } = await supabase
        .from('email_campaigns_cache')
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.error("Error fetching cache info:", error);
        setCacheInfo(prev => ({ ...prev, status: "error" }));
        return;
      }
      
      // Get the most recent cache update time
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
    if (activeTab === "cache" || activeTab === "status") {
      fetchCacheInfo();
    }
  }, [activeTab]);

  // Function to refresh the authentication token
  const refreshAuthToken = async (): Promise<string | null> => {
    try {
      toast.loading("Rafraîchissement du token...", { id: "refresh-token" });
      
      // Explicitly refresh the session
      const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("Failed to refresh session:", refreshError);
        toast.error(`Échec du rafraîchissement: ${refreshError.message}`, { id: "refresh-token" });
        return null;
      }
      
      if (refreshResult.session) {
        const token = refreshResult.session.access_token;
        console.log("Successfully refreshed authentication token");
        setAuthToken(token);
        setAuthStatus(true);
        toast.success("Token rafraîchi avec succès", { id: "refresh-token" });
        return token;
      } else {
        toast.error("Pas de session après rafraîchissement", { id: "refresh-token" });
        return null;
      }
    } catch (e) {
      console.error("Exception during auth refresh:", e);
      toast.error(`Erreur: ${e instanceof Error ? e.message : "Erreur inconnue"}`, { id: "refresh-token" });
      return null;
    }
  };

  // Wake up Edge Functions with improved authentication handling
  const wakeUpEdgeFunctions = async () => {
    try {
      // Make sure we have a valid token first
      const token = authToken || await refreshAuthToken();
      
      if (!token) {
        console.log("No auth session available for wake-up request");
        toast.error("Impossible de réveiller les services: authentification requise", { id: "wake-services" });
        return false;
      }
      
      toast.loading("Réveil des services en cours...", { id: "wake-services" });
      
      const wakeUpPromises = [
        // Wake up the CORS proxy first
        fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy/ping', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-store',
            'X-Wake-Request': 'true'
          }
        }).then(response => {
          if (response.ok) {
            console.log("cors-proxy service awakened successfully");
            return true;
          } else {
            console.log(`cors-proxy wake-up responded with status ${response.status}`);
            return false;
          }
        }).catch(() => {
          console.log("Wake-up attempt for cors-proxy completed with error (expected in dev)");
          return false;
        }),
        
        // Also wake up the sync-email-campaigns function
        fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-store'
          }
        }).then(response => {
          console.log("sync-email-campaigns service ping response:", response.status);
          return true;
        }).catch(() => {
          console.log("Wake-up attempt for sync-email-campaigns completed with error (expected in dev)");
          return false;
        })
      ];
      
      const results = await Promise.all(wakeUpPromises);
      const success = results.some(r => r === true);
      
      // Add a small delay to allow services to fully initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (success) {
        toast.success("Services réveillés avec succès", { id: "wake-services" });
      } else {
        toast.warning("Services réveillés avec des avertissements", { id: "wake-services" });
      }
      
      return success;
    } catch (e) {
      console.error("Error waking up services:", e);
      toast.error(`Erreur lors du réveil des services: ${e instanceof Error ? e.message : 'Erreur inconnue'}`, { id: "wake-services" });
      return false;
    }
  };

  // Check API availability with enhanced error handling
  const checkApiAvailability = async () => {
    try {
      // First, verify authentication status
      const isAuthenticated = await isSupabaseAuthenticated();
      setAuthStatus(isAuthenticated);
      
      if (!isAuthenticated) {
        console.log("User not authenticated, skipping API check");
        return {
          available: false,
          debugInfo: null,
          error: "Authentication required"
        };
      }
      
      // Make sure we have a valid token
      const token = authToken || await refreshAuthToken();
      
      if (!token) {
        return {
          available: false,
          error: "No valid authentication token available",
          debugInfo: null
        };
      }
      
      // Test the connection
      const connectionDebug = await testAcelleConnection(testAccount);
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

  // Refresh cache info with updated token
  const refreshCacheInfo = async () => {
    try {
      toast.loading("Actualisation des informations du cache...", { id: "refresh-cache" });
      
      // Make sure we have a valid authentication token
      if (!authToken) {
        await refreshAuthToken();
      }
      
      await fetchCacheInfo();
      toast.success("Informations du cache actualisées", { id: "refresh-cache" });
    } catch (e) {
      console.error("Error refreshing cache info:", e);
      toast.error("Erreur lors de l'actualisation du cache", { id: "refresh-cache" });
    }
  };

  // Run full system diagnostics
  const runDiagnostics = async () => {
    setIsTesting(true);
    try {
      toast.loading("Test des services en cours...", { id: "api-test" });
      
      // Verify authentication status first
      const isAuthenticated = await isSupabaseAuthenticated();
      setAuthStatus(isAuthenticated);
      
      if (!isAuthenticated) {
        toast.error("Authentification Supabase requise", { id: "api-test" });
        setIsTesting(false);
        return;
      }
      
      // Refresh the token to ensure it's valid
      const token = await refreshAuthToken();
      
      if (!token) {
        toast.error("Impossible d'obtenir un token valide", { id: "api-test" });
        setIsTesting(false);
        return;
      }
      
      // Wake up Edge Functions with the fresh token
      await wakeUpEdgeFunctions();
      
      // Check API accessibility
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
        // If API is not available on first attempt, try another token refresh and wake-up
        toast.warning("Services indisponibles, tentative de réveil...", { id: "api-test" });
        
        // Force token refresh
        const freshToken = await refreshAuthToken();
        
        if (!freshToken) {
          toast.error("Impossible d'obtenir un token valide", { id: "api-test" });
          setIsTesting(false);
          return;
        }
        
        // Wake up services again with fresh token
        await wakeUpEdgeFunctions();
        
        // Retry API check with fresh token
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

  // Check Edge Function status
  const checkEdgeFunctionStatus = useCallback(async () => {
    try {
      const { data: edgeFunctionStatus } = await supabase
        .from('edge_functions')
        .select('*')
        .eq('name', 'cors-proxy')
        .eq('status', 'active');
      
      if (edgeFunctionStatus && edgeFunctionStatus.length > 0) {
        console.log("Edge Function 'cors-proxy' is active");
      } else {
        console.log("Edge Function 'cors-proxy' is not active");
      }
    } catch (error) {
      console.error("Error checking Edge Function status:", error);
    }
  }, []);

  // Check database status
  const checkDatabaseStatus = useCallback(async () => {
    try {
      const { data: databaseStatus } = await supabase
        .from('database')
        .select('*')
        .eq('name', 'emailing')
        .eq('status', 'active');
      
      if (databaseStatus && databaseStatus.length > 0) {
        console.log("Database 'emailing' is active");
      } else {
        console.log("Database 'emailing' is not active");
      }
    } catch (error) {
      console.error("Error checking database status:", error);
    }
  }, []);

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
    runDiagnostics,
    refreshAuthToken,
    authToken
  };
};
