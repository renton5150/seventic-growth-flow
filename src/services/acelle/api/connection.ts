
import { AcelleConnectionDebug, AcelleAccount } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";

// Configuration for the Acelle proxy
const ACELLE_PROXY_CONFIG = {
  BASE_URL: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy',
  ACELLE_API_URL: 'https://emailing.plateforme-solution.net/api/v1'
};

// Build proxy URL with parameters
const buildProxyUrl = (path: string, params: Record<string, string> = {}): string => {
  const baseProxyUrl = ACELLE_PROXY_CONFIG.BASE_URL;
  
  const apiPath = path.startsWith('/') ? path.substring(1) : path;
  
  let apiUrl = `${ACELLE_PROXY_CONFIG.ACELLE_API_URL}/${apiPath}`;
  
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, value);
    }
    
    apiUrl += '?' + searchParams.toString();
  }
  
  const encodedApiUrl = encodeURIComponent(apiUrl);
  
  return `${baseProxyUrl}?url=${encodedApiUrl}`;
};

/**
 * Test the connection to the Acelle API
 */
export const testAcelleConnection = async (account: AcelleAccount): Promise<AcelleConnectionDebug> => {
  const start = Date.now();
  const debug: AcelleConnectionDebug = {
    success: false,
    timestamp: new Date().toISOString(),
    request: {
      url: '',
      method: 'GET'
    }
  };
  
  try {
    // Build the API URL for testing
    const testUrl = buildProxyUrl('ping', { api_token: account.apiToken });
    debug.request!.url = testUrl;
    
    // Send the request
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const duration = Date.now() - start;
    debug.duration = duration;
    debug.statusCode = response.status;
    
    // Handle successful response
    if (response.ok) {
      const data = await response.json();
      debug.success = true;
      debug.responseData = data;
      
      // Store the debug info using a simplified approach
      // We're not using a table that doesn't exist
      try {
        await supabase.from('acelle_accounts')
          .update({ 
            last_sync_date: new Date().toISOString(),
            last_sync_error: null
          })
          .eq('id', account.id);
      } catch (e) {
        console.error('Failed to update connection status:', e);
      }
      
      return debug;
    } 
    
    // Handle error response
    debug.errorMessage = `API returned status ${response.status}`;
    try {
      const errorData = await response.json();
      debug.responseData = errorData;
    } catch (e) {
      debug.errorMessage += ". Could not parse error response.";
    }
    
    // Update account with error information
    try {
      await supabase.from('acelle_accounts')
        .update({ 
          last_sync_error: debug.errorMessage,
          last_sync_date: new Date().toISOString()
        })
        .eq('id', account.id);
    } catch (e) {
      console.error('Failed to store connection debug info:', e);
    }
    
    return debug;
  } catch (error) {
    const duration = Date.now() - start;
    debug.duration = duration;
    debug.errorMessage = error instanceof Error ? error.message : String(error);
    
    // Update account with error information
    try {
      await supabase.from('acelle_accounts')
        .update({ 
          last_sync_error: debug.errorMessage,
          last_sync_date: new Date().toISOString()
        })
        .eq('id', account.id);
    } catch (e) {
      console.error('Failed to store connection debug info:', e);
    }
    
    return debug;
  }
};
