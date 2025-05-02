
import { AcelleConnectionDebug, AcelleAccount } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";

// Configuration for the Acelle proxy
const ACELLE_PROXY_CONFIG = {
  // Use the full URL for the CORS proxy
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
    // Get authentication session first
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData?.session?.access_token) {
      debug.errorMessage = sessionError?.message || "No authentication session available";
      debug.statusCode = 401;
      return debug;
    }
    
    const accessToken = sessionData.session.access_token;
    
    // Add anti-cache timestamp to avoid stale responses
    const cacheBuster = Date.now().toString();
    
    // Use the customers endpoint which should be available in all Acelle instances
    const testUrl = buildProxyUrl('customers', { 
      api_token: account.apiToken,
      _t: cacheBuster // Add timestamp to prevent caching
    });
    
    debug.request!.url = testUrl;
    
    console.log(`Testing connection to Acelle API: ${testUrl}`);
    
    // Send the request with proper authentication headers
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Requested-With': 'XMLHttpRequest'
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
      
      console.log(`Connection successful! Response:`, data);
      
      // Update account with success information
      if (account.id !== 'system-test') {
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
      }
      
      return debug;
    } 
    
    // Handle error response
    debug.errorMessage = `API returned status ${response.status}`;
    
    // Try to get detailed error info for better diagnostics
    try {
      const errorData = await response.json();
      debug.responseData = errorData;
      console.error(`API error: Status ${response.status}`, errorData);
      
      // Add helpful error details for authentication errors
      if (response.status === 401) {
        debug.errorMessage = "Authentication failed. Please check your API token.";
      }
    } catch (e) {
      debug.errorMessage += ". Could not parse error response.";
      try {
        // Try to get text response if JSON parsing fails
        const errorText = await response.text();
        console.error(`API error text: ${errorText}`);
        debug.errorMessage += ` Response: ${errorText.substring(0, 500)}`;
      } catch (textError) {
        console.error('Could not read response as text either', textError);
      }
    }
    
    // Update account with error information
    if (account.id !== 'system-test') {
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
    }
    
    return debug;
  } catch (error) {
    const duration = Date.now() - start;
    debug.duration = duration;
    debug.errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Connection test error:', debug.errorMessage);
    
    // Update account with error information
    if (account.id !== 'system-test') {
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
    }
    
    return debug;
  }
};
