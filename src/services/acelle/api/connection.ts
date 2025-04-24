
import { AcelleConnectionDebug } from "@/types/acelle.types";

const ACELLE_PROXY_BASE_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy";

// Test Acelle API connection
export const testAcelleConnection = async (
  apiEndpoint: string, 
  apiToken: string, 
  debug: boolean = false
): Promise<boolean | AcelleConnectionDebug> => {
  try {
    const url = `${ACELLE_PROXY_BASE_URL}/me?api_token=${apiToken}`;
    
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json"
    };
    
    const debugInfo: AcelleConnectionDebug = {
      success: false,
      request: {
        url,
        headers
      }
    };
    
    const response = await fetch(url, {
      method: "GET",
      headers
    });
    
    if (debug) {
      debugInfo.statusCode = response.status;
      
      try {
        debugInfo.responseData = await response.clone().json();
      } catch (e) {
        debugInfo.responseData = await response.clone().text();
      }
    }
    
    if (!response.ok) {
      if (debug) {
        debugInfo.errorMessage = `API Error: ${response.status} ${response.statusText}`;
        return debugInfo;
      }
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    const success = !!data.id;
    
    if (debug) {
      debugInfo.success = success;
      return debugInfo;
    }
    
    return success;
  } catch (error) {
    console.error("Error testing Acelle API connection:", error);
    
    if (debug) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        request: {
          url: `${ACELLE_PROXY_BASE_URL}/me?api_token=${apiToken}`,
          headers: { "Accept": "application/json" }
        }
      };
    }
    
    return false;
  }
};

