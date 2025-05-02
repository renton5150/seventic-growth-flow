
import { useState } from 'react';
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { testAcelleConnection } from "@/services/acelle/api/connection";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for managing API connections and diagnostics
 */
export const useApiConnection = (account: AcelleAccount) => {
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);
  const [wakeupAttempts, setWakeupAttempts] = useState(0);

  // Wake up edge functions 
  const wakeUpEdgeFunctions = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        console.log("No auth session available for wake-up request");
        return false;
      }
      
      console.log("Attempting to wake up edge functions...");
      setWakeupAttempts(prev => prev + 1);
      
      // Direct ping to the proxy function to wake it up
      const wakeUpPromises = [
        fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy/ping', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Cache-Control': 'no-store',
            'X-Wake-Request': 'true'
          }
        })
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error(`Wake-up request failed with status ${response.status}`);
        })
        .then(data => {
          console.log("Edge function wake-up successful:", data);
          return true;
        })
        .catch(err => {
          console.log("Wake-up attempt error:", err.message);
          return false;
        })
      ];
      
      const results = await Promise.all(wakeUpPromises);
      return results.some(result => result === true);
    } catch (e) {
      console.error("Error waking up services:", e);
      return false;
    }
  };
  
  // Check if API endpoints are available
  const checkApiAvailability = async () => {
    try {
      // Try to wake up first
      await wakeUpEdgeFunctions();
      
      const connectionDebug = await testAcelleConnection(account);
      setDebugInfo(connectionDebug);
      
      // If first attempt fails, try one more time after waking up
      if (!connectionDebug.success && wakeupAttempts < 2) {
        console.log("First API check failed, attempting to wake up services again...");
        await wakeUpEdgeFunctions();
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
  
  // Get debug info
  const getDebugInfo = () => {
    return debugInfo;
  };

  return {
    wakeUpEdgeFunctions,
    checkApiAvailability,
    getDebugInfo,
    debugInfo,
    wakeupAttempts
  };
};
