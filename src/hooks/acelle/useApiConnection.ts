
import { useState, useCallback } from 'react';
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { testAcelleConnection } from "@/services/acelle/api/connection";
import { useAuthToken } from './useAuthToken';
import { useEdgeFunctionWakeup } from './useEdgeFunctionWakeup';

/**
 * Hook for managing API connections and diagnostics
 */
export const useApiConnection = (account: AcelleAccount) => {
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);
  
  // Utiliser les hooks extraits
  const { authToken, isRefreshing, getValidAuthToken } = useAuthToken();
  const { wakeupAttempts, wakeUpEdgeFunctions } = useEdgeFunctionWakeup();
  
  // Check if API endpoints are available
  const checkApiAvailability = useCallback(async () => {
    try {
      // Make sure we have a valid token
      const token = authToken || await getValidAuthToken();
      if (!token) {
        return {
          available: false,
          error: "No valid authentication token available",
          debugInfo: null
        };
      }
      
      // Try to wake up first
      await wakeUpEdgeFunctions(token);
      
      // Test the connection with the current token
      const connectionDebug = await testAcelleConnection(account);
      setDebugInfo(connectionDebug);
      
      // If first attempt fails, try again with a fresh token
      if (!connectionDebug.success && wakeupAttempts < 2) {
        console.log("First API check failed, refreshing token and trying again...");
        
        const freshToken = await getValidAuthToken();
        if (!freshToken) {
          return {
            available: false,
            error: "Failed to refresh authentication token",
            debugInfo: connectionDebug
          };
        }
        
        // Wake up services again with fresh token
        await wakeUpEdgeFunctions(freshToken);
        
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
  }, [account, authToken, getValidAuthToken, wakeUpEdgeFunctions, wakeupAttempts]);

  return {
    wakeUpEdgeFunctions: (token: string | null) => wakeUpEdgeFunctions(token),
    checkApiAvailability,
    getDebugInfo: () => debugInfo,
    debugInfo,
    wakeupAttempts,
    authToken,
    isRefreshing,
    refreshAuthToken: getValidAuthToken
  };
};
