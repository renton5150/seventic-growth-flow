import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Amélioré avec des entêtes CORS complets selon les recommandations
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key, x-debug-level, x-auth-method, x-api-key',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 heures de cache pour les préflights
};

const supabaseUrl = 'https://dupguifqyjchlmzbadav.supabase.co';
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const DEFAULT_TIMEOUT = 30000; // 30 seconds default timeout
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

// Configuration des niveaux de log
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
  VERBOSE: 5
};

// Niveau de log par défaut
let currentLogLevel = LOG_LEVELS.INFO;

// Service activity tracking
let lastActivity = Date.now();

// Logger amélioré avec niveaux de log et formatage JSON
function debugLog(message: string, data?: any, level: number = LOG_LEVELS.INFO) {
  // Skip logging if current log level is lower than requested
  if (level > currentLogLevel) return;
  
  const timestamp = new Date().toISOString();
  let levelName = "INFO";
  let logMethod = console.log;
  
  switch(level) {
    case LOG_LEVELS.ERROR:
      levelName = "ERROR";
      logMethod = console.error;
      break;
    case LOG_LEVELS.WARN:
      levelName = "WARN";
      logMethod = console.warn;
      break;
    case LOG_LEVELS.INFO:
      levelName = "INFO";
      logMethod = console.log;
      break;
    case LOG_LEVELS.DEBUG:
      levelName = "DEBUG";
      logMethod = console.log;
      break;
    case LOG_LEVELS.TRACE:
      levelName = "TRACE";
      logMethod = console.log;
      break;
    case LOG_LEVELS.VERBOSE:
      levelName = "VERBOSE";
      logMethod = console.log;
      break;
  }
  
  const logEntry = {
    timestamp,
    level: levelName,
    message,
    ...(data !== undefined ? { data: typeof data === 'object' ? data : { value: data } } : {})
  };
  
  logMethod(JSON.stringify(logEntry));
}

// Helper function pour tester l'accessibilité d'une URL avec diagnostic extensif
async function testEndpointAccess(url: string, options: { 
  timeout?: number, 
  headers?: Record<string, string>,
  authToken?: string,
  authMethod?: string
} = {}): Promise<{
  success: boolean,
  message: string,
  statusCode?: number,
  responseTime?: number,
  headers?: Record<string, string>,
  responseText?: string
}> {
  const startTime = Date.now();
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const authMethod = options.authMethod || 'token';
  
  try {
    debugLog(`Testing API accessibility for endpoint ${url}`, { timeout, headers: options.headers }, LOG_LEVELS.DEBUG);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Seventic-Acelle-Sync/1.5',
      ...(options.headers || {})
    };
    
    // Add authentication based on method if token is provided
    if (options.authToken) {
      if (authMethod === 'basic') {
        headers['Authorization'] = `Basic ${btoa(`${options.authToken}:`)}`;
      } else if (authMethod === 'header') {
        headers['X-API-Key'] = options.authToken;
      }
      // For 'token' method, the token is part of the URL query params
    }
    
    // Construct the final URL with token if using token auth method
    let finalUrl = url;
    if (options.authToken && authMethod === 'token') {
      const separator = url.includes('?') ? '&' : '?';
      finalUrl = `${url}${separator}api_token=${options.authToken}`;
    }
    
    debugLog(`Making API request to: ${finalUrl}`, { headers }, LOG_LEVELS.VERBOSE);
    
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    // Capture and log response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    // Attempt to read response text for diagnostics
    let responseText = '';
    try {
      responseText = await response.text();
    } catch (e) {
      debugLog(`Could not read response text: ${e instanceof Error ? e.message : String(e)}`, {}, LOG_LEVELS.WARN);
    }
    
    if (response.ok) {
      debugLog(`URL accessible: ${finalUrl}, status: ${response.status}, time: ${responseTime}ms`, 
        { headers: responseHeaders, responseText: responseText.substring(0, 200) }, 
        LOG_LEVELS.DEBUG);
        
      return { 
        success: true, 
        message: `URL accessible: ${url}, status: ${response.status}, time: ${responseTime}ms`, 
        statusCode: response.status,
        responseTime,
        headers: responseHeaders,
        responseText: responseText.substring(0, 1000) // Limit response text size
      };
    } else {
      debugLog(`URL inaccessible: ${finalUrl}, status: ${response.status}, statusText: ${response.statusText}, time: ${responseTime}ms`,
        { headers: responseHeaders, responseText }, 
        LOG_LEVELS.WARN);
        
      return { 
        success: false, 
        message: `URL inaccessible: ${url}, status: ${response.status}, statusText: ${response.statusText}`, 
        statusCode: response.status,
        responseTime,
        headers: responseHeaders,
        responseText: responseText.substring(0, 1000) // Limit response text size
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    debugLog(`Error testing URL: ${url}, error: ${errorMessage}, time: ${responseTime}ms`, 
      { error }, 
      LOG_LEVELS.ERROR);
      
    return { 
      success: false, 
      message: `Erreur lors du test d'URL: ${url}, erreur: ${errorMessage}`,
      responseTime
    };
  }
}

// Fonction pour tester différentes méthodes d'authentification
async function testAuthMethods(baseUrl: string, endpoint: string, apiToken: string, options: { 
  timeout?: number,
  authMethods?: string[]
} = {}): Promise<{
  success: boolean,
  method?: string,
  statusCode?: number,
  message: string,
  responseText?: string,
  responseTime?: number,
  authDetails?: any
}> {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const methods = options.authMethods || ["token", "basic", "header"]; // Default methods to try
  
  // Résultats pour chaque méthode
  const results: Record<string, any> = {};
  
  debugLog(`Testing authentication methods for ${baseUrl + endpoint}`, { methods }, LOG_LEVELS.INFO);
  
  // Méthode 1: Auth par token dans l'URL
  if (methods.includes("token")) {
    const tokenResult = await testEndpointAccess(`${baseUrl}${endpoint}`, {
      timeout,
      authToken: apiToken,
      authMethod: 'token',
      headers: {
        'X-Auth-Method': 'token'
      }
    });
    
    results.token = tokenResult;
    
    // Si réussi, retourner immédiatement
    if (tokenResult.success) {
      debugLog(`Token auth successful for ${baseUrl + endpoint}`, { statusCode: tokenResult.statusCode }, LOG_LEVELS.INFO);
      return {
        success: true,
        method: 'token',
        statusCode: tokenResult.statusCode,
        message: `Authentication successful using token method`,
        responseText: tokenResult.responseText,
        responseTime: tokenResult.responseTime,
        authDetails: { url: `${baseUrl}${endpoint}?api_token=${apiToken}` }
      };
    }
  }
  
  // Méthode 2: Basic Auth
  if (methods.includes("basic")) {
    const basicResult = await testEndpointAccess(`${baseUrl}${endpoint}`, {
      timeout,
      authToken: apiToken,
      authMethod: 'basic',
      headers: {
        'X-Auth-Method': 'basic'
      }
    });
    
    results.basic = basicResult;
    
    // Si réussi, retourner immédiatement
    if (basicResult.success) {
      debugLog(`Basic auth successful for ${baseUrl + endpoint}`, { statusCode: basicResult.statusCode }, LOG_LEVELS.INFO);
      return {
        success: true,
        method: 'basic',
        statusCode: basicResult.statusCode,
        message: `Authentication successful using Basic Auth method`,
        responseText: basicResult.responseText,
        responseTime: basicResult.responseTime,
        authDetails: { headers: { 'Authorization': `Basic ${btoa(`${apiToken}:`)}` } }
      };
    }
  }
  
  // Méthode 3: X-API-Key header
  if (methods.includes("header")) {
    const headerResult = await testEndpointAccess(`${baseUrl}${endpoint}`, {
      timeout,
      authToken: apiToken,
      authMethod: 'header',
      headers: {
        'X-Auth-Method': 'header'
      }
    });
    
    results.header = headerResult;
    
    // Si réussi, retourner immédiatement
    if (headerResult.success) {
      debugLog(`Header auth successful for ${baseUrl + endpoint}`, { statusCode: headerResult.statusCode }, LOG_LEVELS.INFO);
      return {
        success: true,
        method: 'header',
        statusCode: headerResult.statusCode,
        message: `Authentication successful using X-API-Key header method`,
        responseText: headerResult.responseText,
        responseTime: headerResult.responseTime,
        authDetails: { headers: { 'X-API-Key': apiToken } }
      };
    }
  }
  
  // Si aucune méthode n'a réussi, retourner échec avec détails
  debugLog(`All authentication methods failed for ${baseUrl + endpoint}`, results, LOG_LEVELS.WARN);
  return {
    success: false,
    message: `Toutes les méthodes d'authentification ont échoué pour ${baseUrl}${endpoint}`,
    authDetails: results
  };
}

// Heartbeat recording function
async function recordHeartbeat() {
  try {
    await supabase.from('edge_function_stats').upsert({
      function_name: 'sync-email-campaigns',
      last_heartbeat: new Date().toISOString(),
      status: 'active'
    }, { onConflict: 'function_name' });
    
    debugLog("Heartbeat recorded for sync-email-campaigns", {}, LOG_LEVELS.DEBUG);
    lastActivity = Date.now();
  } catch (error) {
    debugLog("Failed to record heartbeat:", error, LOG_LEVELS.ERROR);
  }
}

// Start heartbeat interval
setInterval(async () => {
  // Only log if the function has been idle for a while
  if (Date.now() - lastActivity > HEARTBEAT_INTERVAL) {
    debugLog(`Heartbeat at ${new Date().toISOString()} - Service active`, {}, LOG_LEVELS.INFO);
    await recordHeartbeat();
  }
}, HEARTBEAT_INTERVAL);

async function fetchCampaignsForAccount(account: any, options: {
  authMethods?: string[],
  timeout?: number,
  debug?: boolean
} = {}) {
  const startTime = Date.now();
  
  try {
    // Update debug level if requested
    if (options.debug) {
      currentLogLevel = LOG_LEVELS.DEBUG;
    }
    
    // Ensure endpoint is formatted correctly (remove trailing slash if present)
    const apiEndpoint = account.api_endpoint?.endsWith('/') 
      ? account.api_endpoint.slice(0, -1) 
      : account.api_endpoint;
      
    const apiToken = account.api_token;
    const accountName = account.name || `Account ID ${account.id}`;
    
    debugLog(`Processing account: ${accountName}, API endpoint: ${apiEndpoint}`, {
      id: account.id,
      options
    }, LOG_LEVELS.INFO);
    
    // Vérification des paramètres d'API
    if (!apiToken || !apiEndpoint) {
      const errorMessage = `Invalid API configuration for account ${accountName}: missing API token or endpoint`;
      debugLog(errorMessage, { account: { id: account.id, name: accountName } }, LOG_LEVELS.ERROR);
      await updateAccountStatus(account.id, 'error: invalid API configuration');
      return { 
        success: false, 
        error: 'Invalid API configuration',
        diagnostic: {
          apiEndpoint: Boolean(apiEndpoint),
          apiToken: Boolean(apiToken),
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Test d'accessibilité de l'endpoint avant de procéder
    // Use token authentication as recommended by Acelle Mail API docs
    const accessTest = await testEndpointAccess(apiEndpoint, { 
      timeout: options.timeout || DEFAULT_TIMEOUT,
      headers: {
        'User-Agent': 'Seventic-Acelle-Sync/1.5 (Diagnostic)',
        'X-Debug-Marker': 'true'
      }
    });
    
    debugLog(`API endpoint accessibility test for ${accountName}:`, accessTest, LOG_LEVELS.INFO);
    
    if (!accessTest.success) {
      const statusMessage = `error: API endpoint inaccessible - ${accessTest.message}`;
      await updateAccountStatus(account.id, statusMessage);
      return { 
        success: false, 
        error: 'API endpoint inaccessible', 
        details: accessTest.message,
        diagnostic: {
          accessTest,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Test des méthodes d'authentification disponibles
    const authMethods = options.authMethods || ['token'];
    const authTest = await testAuthMethods(apiEndpoint, '/me', apiToken, {
      timeout: options.timeout || DEFAULT_TIMEOUT,
      authMethods
    });
    
    debugLog(`Authentication test for ${accountName}:`, authTest, LOG_LEVELS.DEBUG);
    
    if (!authTest.success) {
      const statusMessage = `error: API authentication failed - ${authTest.message}`;
      await updateAccountStatus(account.id, statusMessage);
      return { 
        success: false, 
        error: 'API authentication failed', 
        details: authTest.message,
        diagnostic: {
          authTest,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // FIXED: Avoid duplicate api/v1 in the URL path
    // Check if the API endpoint already includes /api/v1
    const apiPath = apiEndpoint.includes('/api/v1') ? '' : '/api/v1';
    
    // Use token auth as recommended by Acelle Mail API
    // https://api.acellemail.com/ recommends adding api_token as parameter
    // Make sure to include include_stats=true to get full statistics
    const url = `${apiEndpoint}${apiPath}/campaigns?api_token=${apiToken}&include_stats=true`;
    
    let headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'Seventic-Acelle-Sync/1.5',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Auth-Method': 'token'
    };
    
    debugLog(`Making request to: ${url} with headers:`, headers, LOG_LEVELS.DEBUG);
    
    // Set up timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Log basic response info
      debugLog(`Response from API for ${accountName}: ${response.status} ${response.statusText}`, {
        timeTaken: `${Date.now() - startTime}ms`
      }, LOG_LEVELS.DEBUG);

      // Log response headers for debugging
      const responseHeadersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeadersObj[key] = value;
      });
      debugLog(`Response headers for ${accountName}:`, responseHeadersObj, LOG_LEVELS.DEBUG);

      if (!response.ok) {
        const errorText = await response.text();
        debugLog(`Error fetching campaigns for ${accountName}: Status ${response.status}, Response: ${errorText}`, {}, LOG_LEVELS.ERROR);
        await updateAccountStatus(account.id, `error: API returned ${response.status}`);
        return { 
          success: false, 
          error: `API Error: ${response.status}`, 
          details: errorText,
          endpoint: apiEndpoint,
          diagnostic: {
            status: response.status,
            responseHeaders: responseHeadersObj,
            errorText: errorText.substring(0, 1000),
            url,
            timestamp: new Date().toISOString()
          }
        };
      }

      const campaignsData = await response.json();
      
      if (!Array.isArray(campaignsData)) {
        debugLog(`API returned non-array data for ${accountName}:`, campaignsData, LOG_LEVELS.ERROR);
        await updateAccountStatus(account.id, `error: API returned invalid data format`);
        return { 
          success: false, 
          error: `API returned invalid data format`, 
          details: typeof campaignsData,
          endpoint: apiEndpoint,
          diagnostic: {
            dataType: typeof campaignsData,
            sample: JSON.stringify(campaignsData).substring(0, 200),
            timestamp: new Date().toISOString()
          }
        };
      }
      
      debugLog(`Retrieved ${campaignsData.length} campaigns for account ${accountName}`, {
        timeTaken: `${Date.now() - startTime}ms`
      }, LOG_LEVELS.INFO);
      
      // Debug sample data
      if (campaignsData.length > 0) {
        debugLog(`Sample campaign data for ${accountName}:`, campaignsData[0], LOG_LEVELS.DEBUG);
      }
      
      // Update cache for each campaign with improved statistics handling
      for (const campaign of campaignsData) {
        // Ensure the delivery_info is properly structured as a JSON object
        // with all required fields for client-side display
        const deliveryInfo = {
          total: parseInt(campaign.statistics?.subscriber_count) || 0,
          delivered: parseInt(campaign.statistics?.delivered_count) || 0,
          delivery_rate: parseFloat(campaign.statistics?.delivered_rate) || 0,
          opened: parseInt(campaign.statistics?.open_count) || 0,
          unique_open_rate: parseFloat(campaign.statistics?.uniq_open_rate) || 0,
          clicked: parseInt(campaign.statistics?.click_count) || 0,
          click_rate: parseFloat(campaign.statistics?.click_rate) || 0,
          bounced: {
            soft: parseInt(campaign.statistics?.soft_bounce_count) || 0,
            hard: parseInt(campaign.statistics?.hard_bounce_count) || 0,
            total: parseInt(campaign.statistics?.bounce_count) || 0
          },
          unsubscribed: parseInt(campaign.statistics?.unsubscribe_count) || 0,
          complained: parseInt(campaign.statistics?.abuse_complaint_count) || 0,
          unsubscribe_rate: parseFloat(campaign.statistics?.unsubscribe_rate) || 0,
          bounce_rate: parseFloat(campaign.statistics?.bounce_rate) || 0
        };
        
        // Log the delivery_info for debugging
        debugLog(`Storing delivery info for campaign ${campaign.name}:`, deliveryInfo, LOG_LEVELS.DEBUG);

        await supabase.from('email_campaigns_cache').upsert({
          campaign_uid: campaign.uid,
          account_id: account.id,
          name: campaign.name,
          subject: campaign.subject,
          status: campaign.status,
          created_at: campaign.created_at,
          updated_at: campaign.updated_at,
          delivery_date: campaign.delivery_at || campaign.run_at,
          run_at: campaign.run_at,
          last_error: campaign.last_error,
          delivery_info: deliveryInfo,
          cache_updated_at: new Date().toISOString()
        }, {
          onConflict: 'campaign_uid'
        });
      }

      // Update last sync time for account
      await updateAccountStatus(account.id);

      return { 
        success: true, 
        count: campaignsData.length,
        diagnostic: {
          timeTaken: Date.now() - startTime,
          url,
          timestamp: new Date().toISOString()
        }
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        debugLog(`Request to ${apiEndpoint} timed out`, {timeout: options.timeout || DEFAULT_TIMEOUT}, LOG_LEVELS.ERROR);
        await updateAccountStatus(account.id, 'error: API request timed out');
        return { 
          success: false, 
          error: 'Request timed out', 
          endpoint: apiEndpoint,
          diagnostic: {
            timeout: options.timeout || DEFAULT_TIMEOUT,
            url,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      debugLog(`Fetch error for ${accountName}:`, fetchError, LOG_LEVELS.ERROR);
      await updateAccountStatus(account.id, `error: ${fetchError.message}`);
      return { 
        success: false, 
        error: fetchError.message || 'Unknown fetch error',
        endpoint: apiEndpoint,
        diagnostic: {
          errorName: fetchError.name,
          errorMessage: fetchError.message,
          url,
          timestamp: new Date().toISOString()
        }
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    debugLog(`Error syncing account ${account.name}:`, { errorMessage, errorStack }, LOG_LEVELS.ERROR);
    await updateAccountStatus(account.id, `error: ${errorMessage}`);
    return { 
      success: false, 
      error: errorMessage,
      account: account.name,
      endpoint: account.api_endpoint,
      diagnostic: {
        errorStack,
        timestamp: new Date().toISOString(),
        timeTaken: Date.now() - startTime
      }
    };
  }
}

// Helper function to update account status
async function updateAccountStatus(accountId: string, errorMessage?: string) {
  try {
    const updateData: Record<string, any> = { 
      last_sync_date: new Date().toISOString() 
    };
    
    if (errorMessage) {
      debugLog(`Setting error status for account ${accountId}: ${errorMessage}`, {}, LOG_LEVELS.WARN);
      updateData.last_sync_error = errorMessage;
    } else {
      updateData.last_sync_error = null;
    }
    
    const { error } = await supabase
      .from('acelle_accounts')
      .update(updateData)
      .eq('id', accountId);
      
    if (error) {
      debugLog(`Failed to update status for account ${accountId}:`, error, LOG_LEVELS.ERROR);
    }
  } catch (err) {
    debugLog(`Failed to update status for account ${accountId}:`, err, LOG_LEVELS.ERROR);
  }
}

serve(async (req) => {
  // Record activity and update heartbeat
  lastActivity = Date.now();
  await recordHeartbeat();
  
  // Ajuster le niveau de log en fonction des paramètres de requête
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      if (body.debug) {
        currentLogLevel = body.debug_level === 'verbose' ? LOG_LEVELS.VERBOSE : LOG_LEVELS.DEBUG;
      }
    } catch (e) {
      // Silently ignore JSON parse errors
    }
  }
  
  // Log the authorization header to help debug authentication issues
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    debugLog("Authorization header provided:", authHeader.substring(0, 15) + "...", LOG_LEVELS.DEBUG);
  } else {
    debugLog("No authorization header provided", {}, LOG_LEVELS.WARN);
  }
  
  // Enhanced CORS handling for preflight requests
  if (req.method === 'OPTIONS') {
    debugLog("Handling OPTIONS preflight request for sync-email-campaigns with complete CORS headers", {}, LOG_LEVELS.DEBUG);
    return new Response(null, { 
      status: 204, // Standard status for successful OPTIONS requests
      headers: corsHeaders 
    });
  }

  try {
    debugLog("Starting sync-email-campaigns function", {}, LOG_LEVELS.INFO);
    
    // Parse request body
    let startServices = false;
    let forceSync = false;
    let requestOptions: {
      authMethods?: string[];
      timeout?: number;
      debug?: boolean;
    } = {};
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        startServices = !!body.startServices;
        forceSync = !!body.forceSync;
        
        // Extract advanced options
        requestOptions = {
          authMethods: body.authMethods || ['token'],
          timeout: body.timeout || DEFAULT_TIMEOUT,
          debug: !!body.debug
        };
        
        // Set debug level based on request
        if (body.debug) {
          currentLogLevel = body.debug_level === 'verbose' ? LOG_LEVELS.VERBOSE : 
                           (body.debug_level === 'trace' ? LOG_LEVELS.TRACE : LOG_LEVELS.DEBUG);
        }
        
        debugLog("Request options:", { startServices, forceSync, ...requestOptions }, LOG_LEVELS.DEBUG);
      } catch (e) {
        debugLog("Could not parse request body", e, LOG_LEVELS.WARN);
      }
    }
    
    // Fetch active accounts
    const { data: accounts, error } = await supabase
      .from('acelle_accounts')
      .select('*')
      .eq('status', 'active')
      .order('cache_priority', { ascending: false });

    if (error) {
      debugLog("Error fetching accounts:", error, LOG_LEVELS.ERROR);
      throw error;
    }

    debugLog(`Found ${accounts?.length || 0} active Acelle accounts to sync`, {}, LOG_LEVELS.INFO);
    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No active accounts to sync',
        timestamp: new Date().toISOString(),
        diagnostic: {
          requestTime: new Date().toISOString()
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];
    const diagnostics = [];
    
    for (const account of accounts) {
      debugLog(`Processing account: ${account.name}, API endpoint: ${account.api_endpoint}`, {
        id: account.id,
        options: requestOptions
      }, LOG_LEVELS.INFO);
      
      const result = await fetchCampaignsForAccount(account, requestOptions);
      
      // Store diagnostic info separately to avoid cluttering the main response
      if (result.diagnostic) {
        diagnostics.push({
          accountId: account.id,
          accountName: account.name,
          ...result.diagnostic
        });
        
        // Remove diagnostic from main result
        delete result.diagnostic;
      }
      
      results.push({ 
        account: account.name, 
        accountId: account.id,
        endpoint: account.api_endpoint,
        ...result 
      });
    }

    // Update edge function stats
    await supabase.from('edge_function_stats').upsert({
      function_name: 'sync-email-campaigns',
      last_heartbeat: new Date().toISOString(),
      last_run_success: true,
      last_run_time: new Date().toISOString(),
      status: 'active'
    }, { onConflict: 'function_name' });

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      diagnostics: requestOptions.debug ? diagnostics : undefined,
      nextScheduledSync: new Date(Date.now() + 30 * 60 * 1000).toISOString() // estimate next sync
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    debugLog("Error in sync-email-campaigns:", errorMessage, LOG_LEVELS.ERROR);
    
    return new Response(JSON.stringify({
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
