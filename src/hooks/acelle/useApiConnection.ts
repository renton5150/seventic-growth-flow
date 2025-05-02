
import { useState, useEffect } from 'react';
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { testAcelleConnection } from "@/services/acelle/api/connection";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for managing API connections and diagnostics
 */
export const useApiConnection = (account: AcelleAccount) => {
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);
  const [wakeupAttempts, setWakeupAttempts] = useState(0);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isTokenRefreshing, setIsTokenRefreshing] = useState(false);

  // Effect to get authentication token on mount
  useEffect(() => {
    const fetchAuthToken = async () => {
      try {
        setIsTokenRefreshing(true);
        // Try to refresh the session to ensure we have a valid token
        await supabase.auth.refreshSession();
        
        // Get session after refresh
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        if (token) {
          console.log("Obtained valid authentication token");
          setAuthToken(token);
        } else {
          console.error("No authentication token available in session");
        }
      } catch (e) {
        console.error("Error getting authentication token:", e);
      } finally {
        setIsTokenRefreshing(false);
      }
    };
    
    fetchAuthToken();
  }, []);

  // Function to get a fresh authentication token
  const refreshAuthToken = async (): Promise<string | null> => {
    try {
      setIsTokenRefreshing(true);
      console.log("Refreshing authentication token");
      
      // Try to refresh the session to ensure we have a valid token
      await supabase.auth.refreshSession();
      
      // Get session after refresh
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error refreshing auth token:", error.message);
        return null;
      }
      
      const token = sessionData?.session?.access_token;
      if (!token) {
        console.error("No access token available after refresh");
        return null;
      }
      
      console.log("Successfully refreshed authentication token");
      setAuthToken(token);
      return token;
    } catch (e) {
      console.error("Exception during token refresh:", e);
      return null;
    } finally {
      setIsTokenRefreshing(false);
    }
  };

  // Wake up edge functions 
  const wakeUpEdgeFunctions = async () => {
    try {
      // Get a valid token
      const token = authToken || await refreshAuthToken();
      if (!token) {
        console.log("No auth session available for wake-up request");
        return false;
      }
      
      console.log("Attempting to wake up edge functions...");
      setWakeupAttempts(prev => prev + 1);
      
      // Direct ping to the proxy function to wake it up
      try {
        const response = await fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy/ping', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-store',
            'X-Wake-Request': 'true'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Edge function wake-up successful:", data);
        } else {
          console.warn(`Edge function responded with status: ${response.status}`);
        }
      } catch (e) {
        console.warn("Wake-up attempt error (expected in dev environment):", e);
      }
      
      // Also wake up the sync-email-campaigns function
      try {
        const response = await fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-store'
          }
        });
        
        console.log(`Sync function wake status: ${response.status}`);
      } catch (e) {
        console.warn("Sync function wake error (expected in dev environment):", e);
      }
      
      // Add a small delay to allow services to fully initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (e) {
      console.error("Error waking up services:", e);
      return false;
    }
  };
  
  // Check if API endpoints are available
  const checkApiAvailability = async () => {
    try {
      // Make sure we have a valid token
      const token = authToken || await refreshAuthToken();
      if (!token) {
        return {
          available: false,
          error: "No valid authentication token available",
          debugInfo: null
        };
      }
      
      // Try to wake up first
      await wakeUpEdgeFunctions();
      
      // Test the connection with the current token
      const connectionDebug = await testAcelleConnection(account);
      setDebugInfo(connectionDebug);
      
      // If first attempt fails, try again with a fresh token
      if (!connectionDebug.success && wakeupAttempts < 2) {
        console.log("First API check failed, refreshing token and trying again...");
        
        const freshToken = await refreshAuthToken();
        if (!freshToken) {
          return {
            available: false,
            error: "Failed to refresh authentication token",
            debugInfo: connectionDebug
          };
        }
        
        // Wake up services again with fresh token
        await wakeUpEdgeFunctions();
        
        // Retry with fresh token
        const retryConnectionDebug = await testAcelleConnection(account);
        setDebugInfo(retryConnectionDebug);
        
        return {
          available: retryConnectionDebug.success,
          debugInfo: retryConnectionDebug
        };
      }
      
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

  return {
    wakeUpEdgeFunctions,
    checkApiAvailability,
    getDebugInfo: () => debugInfo,
    debugInfo,
    wakeupAttempts,
    authToken,
    isTokenRefreshing,
    refreshAuthToken
  };
};
