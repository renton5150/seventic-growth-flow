
import { useState } from 'react';
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { testAcelleConnection } from "@/services/acelle/api/connection";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for managing API connections and diagnostics
 */
export const useApiConnection = (account: AcelleAccount) => {
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);

  // Wake up edge functions 
  const wakeUpEdgeFunctions = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        console.log("No auth session available for wake-up request");
        return false;
      }
      
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
      return true;
    } catch (e) {
      console.error("Error waking up services:", e);
      return false;
    }
  };
  
  // Check if API endpoints are available
  const checkApiAvailability = async () => {
    try {
      const connectionDebug = await testAcelleConnection(account);
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
  
  // Get debug info
  const getDebugInfo = () => {
    return debugInfo;
  };

  return {
    wakeUpEdgeFunctions,
    checkApiAvailability,
    getDebugInfo,
    debugInfo
  };
};
