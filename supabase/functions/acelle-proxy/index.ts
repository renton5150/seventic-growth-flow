
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Configuration améliorée des entêtes CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key, x-acelle-endpoint, x-debug-level, x-auth-method, x-api-key',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 heures de cache pour les préflights
};

// Configuration de base
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://dupguifqyjchlmzbadav.supabase.co';
const SUPABASE_SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY') || '';
const DEFAULT_TIMEOUT = 30000; // 30 seconds timeout par défaut

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

// Dernière activité pour la surveillance du service
let lastActivity = Date.now();

// Create Supabase client for heartbeat recording
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Start heartbeat
setInterval(async () => {
  // Only log if the function has been idle for a while
  if (Date.now() - lastActivity > HEARTBEAT_INTERVAL) {
    debugLog(`Heartbeat at ${new Date().toISOString()} - Service active`, {}, LOG_LEVELS.INFO);
    
    // Record heartbeat in database to track function status
    try {
      await supabase.from('edge_function_stats').upsert({
        function_name: 'acelle-proxy',
        last_heartbeat: new Date().toISOString(),
        status: 'active'
      }, { onConflict: 'function_name' });
    } catch (error) {
      debugLog("Failed to record heartbeat:", error, LOG_LEVELS.ERROR);
    }
  }
  
  lastActivity = Date.now();
}, HEARTBEAT_INTERVAL);

// Proactive service check with auto-restart
setInterval(async () => {
  try {
    // Check last activity to see if function is unresponsive
    const inactiveTime = Date.now() - lastActivity;
    if (inactiveTime > HEARTBEAT_INTERVAL * 3) {
      debugLog(`Service appears inactive for ${Math.floor(inactiveTime/1000)}s, attempting restart`, {}, LOG_LEVELS.WARN);
      
      // Update status to restarting
      await supabase.from('edge_function_stats').upsert({
        function_name: 'acelle-proxy',
        last_heartbeat: new Date().toISOString(),
        status: 'restarting'
      }, { onConflict: 'function_name' });
      
      // Update last activity to prevent multiple restart attempts
      lastActivity = Date.now();
    }
  } catch (error) {
    debugLog("Error during service check:", error, LOG_LEVELS.ERROR);
  }
}, HEARTBEAT_INTERVAL * 2);

// Helper function pour tester l'accessibilité d'une URL avec diagnostic extensif
async function testEndpointAccess(url: string, options: { timeout?: number, headers?: Record<string, string> } = {}): Promise<{
  success: boolean,
  message: string,
  statusCode?: number,
  responseTime?: number,
  headers?: Record<string, string>,
  responseText?: string
}> {
  const startTime = Date.now();
  const timeout = options.timeout || 10000; // 10 seconds default timeout
  
  try {
    debugLog(`Testing API accessibility for endpoint ${url}`, { timeout, headers: options.headers }, LOG_LEVELS.DEBUG);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Seventic-Acelle-Proxy/1.5',
      ...(options.headers || {})
    };
    
    const response = await fetch(url, {
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
      debugLog(`URL accessible: ${url}, status: ${response.status}, time: ${responseTime}ms`, 
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
      debugLog(`URL inaccessible: ${url}, status: ${response.status}, statusText: ${response.statusText}, time: ${responseTime}ms`,
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
    const tokenResult = await testEndpointAccess(`${baseUrl}${endpoint}?api_token=${apiToken}`, {
      timeout,
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
    const basicAuthToken = btoa(`${apiToken}:`); // Convert to Base64
    const basicResult = await testEndpointAccess(`${baseUrl}${endpoint}`, {
      timeout,
      headers: {
        'Authorization': `Basic ${basicAuthToken}`,
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
        authDetails: { headers: { 'Authorization': `Basic ${basicAuthToken}` } }
      };
    }
  }
  
  // Méthode 3: X-API-Key header
  if (methods.includes("header")) {
    const headerResult = await testEndpointAccess(`${baseUrl}${endpoint}`, {
      timeout,
      headers: {
        'X-API-Key': apiToken,
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

// Point d'entrée principal de la fonction edge
serve(async (req) => {
  // Update last activity time
  lastActivity = Date.now();

  // Ajuster le niveau de log en fonction des paramètres de requête
  const url = new URL(req.url);
  const debugParam = url.searchParams.get('debug');
  const debugLevel = url.searchParams.get('debug_level') || req.headers.get('x-debug-level');
  
  if (debugParam === 'true') {
    if (debugLevel === 'verbose') {
      currentLogLevel = LOG_LEVELS.VERBOSE;
    } else if (debugLevel === 'trace') {
      currentLogLevel = LOG_LEVELS.TRACE;
    } else if (debugLevel === 'debug') {
      currentLogLevel = LOG_LEVELS.DEBUG;
    } else {
      currentLogLevel = LOG_LEVELS.DEBUG; // Default debug level
    }
  } else {
    currentLogLevel = LOG_LEVELS.INFO; // Default info level
  }
  
  // Handle CORS preflight requests with en-têtes complets
  if (req.method === 'OPTIONS') {
    debugLog("Handling OPTIONS preflight request with complete CORS headers", {}, LOG_LEVELS.DEBUG);
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Capture request start time for performance metrics
    const requestStartTime = Date.now();
    
    // Get authorization header from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      debugLog("No authorization header provided", null, LOG_LEVELS.ERROR);
    } else {
      debugLog("Authorization header provided:", authHeader.substring(0, 15) + "...", LOG_LEVELS.DEBUG);
    }

    // Extraire le body s'il est présent
    let requestBody;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      try {
        requestBody = await req.json();
        debugLog("Request body:", requestBody, LOG_LEVELS.DEBUG);
      } catch (e) {
        debugLog("Failed to parse request body as JSON", e, LOG_LEVELS.WARN);
      }
    }

    // Gérer les actions spécifiques
    if (requestBody && requestBody.action === 'test-connection') {
      debugLog("Processing test-connection action", requestBody, LOG_LEVELS.INFO);
      
      const apiEndpoint = requestBody.apiEndpoint;
      const apiToken = requestBody.apiToken;
      const debug = requestBody.debug || false;
      const authMethods = requestBody.authMethods || ['token', 'basic', 'header'];
      
      if (!apiEndpoint || !apiToken) {
        return new Response(JSON.stringify({
          success: false,
          message: "API endpoint and token are required",
          debugInfo: {
            success: false,
            errorMessage: "Missing required parameters: apiEndpoint and apiToken",
            statusCode: 400,
            request: { url: apiEndpoint || "N/A" }
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Vérifier d'abord l'accessibilité de base de l'endpoint
      const baseAccessTest = await testEndpointAccess(apiEndpoint, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Seventic-Acelle-Proxy/1.5'
        }
      });
      
      // Puis tester l'authentification si l'endpoint est accessible
      let authTest = null;
      let finalResult: any = {
        success: false, 
        message: ""
      };
      
      if (baseAccessTest.success) {
        // L'endpoint est accessible, on teste l'authentification
        authTest = await testAuthMethods(
          apiEndpoint, 
          '/api/v1/me', // Standard endpoint for testing auth
          apiToken,
          { timeout: 20000, authMethods }
        );
        
        finalResult = {
          success: authTest.success,
          message: authTest.message,
          method: authTest.method,
          baseAccessible: true
        };
      } else {
        // L'endpoint n'est pas accessible
        finalResult = {
          success: false,
          message: `L'API n'est pas accessible: ${baseAccessTest.message}`,
          baseAccessible: false
        };
      }
      
      // Si debug est activé, ajouter les informations détaillées
      if (debug) {
        finalResult.debugInfo = {
          success: finalResult.success,
          errorMessage: finalResult.success ? undefined : finalResult.message,
          statusCode: (authTest?.statusCode || baseAccessTest.statusCode),
          request: {
            url: apiEndpoint,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          },
          responseData: authTest?.responseText || baseAccessTest.responseText,
          endpointTested: apiEndpoint,
          baseAccessTest,
          authTest
        };
      }
      
      return new Response(JSON.stringify(finalResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Special case for ping/health check
    if (url.pathname.endsWith('/ping') || requestBody?.action === 'ping') {
      debugLog("Received ping request - service is active", {}, LOG_LEVELS.INFO);
      
      // Test API accessibility with extended debugging
      const baseUrl = url.searchParams.get('endpoint') || requestBody?.endpoint || 'https://emailing.plateforme-solution.net/api/v1';
      
      // Test different auth methods for the endpoint
      const authMethodsToTest = url.searchParams.get('auth_methods')?.split(',') || requestBody?.authMethods || ['token'];
      const accessTest = await testEndpointAccess(baseUrl, {
        timeout: 10000, // 10 seconds timeout for quick response
        headers: {
          'User-Agent': 'Seventic-Acelle-Proxy/1.5 (Diagnostic)',
          'Accept': 'application/json',
          'X-Debug-Marker': 'true'
        }
      });
      
      // Test authentication methods if basic connection works
      let authTest = null;
      if (accessTest.success) {
        authTest = await testAuthMethods(
          baseUrl, 
          '/api/v1/me', // Standard endpoint for testing auth
          url.searchParams.get('test_token') || requestBody?.testToken || 'test', 
          { 
            timeout: 8000,
            authMethods: authMethodsToTest
          }
        );
      }
      
      debugLog("API endpoint accessibility test:", accessTest, LOG_LEVELS.DEBUG);
      
      return new Response(JSON.stringify({ 
        status: 'active', 
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - lastActivity) / 1000),
        endpoint_test: accessTest,
        auth_test: authTest,
        debug_level: currentLogLevel
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (requestBody && requestBody.action === 'check-availability') {
      debugLog("Processing check-availability action", requestBody, LOG_LEVELS.INFO);
      
      const baseUrl = 'https://emailing.plateforme-solution.net/api/v1';
      
      // Tester si l'API est accessible de base
      const baseAccessTest = await testEndpointAccess(`${baseUrl}`, {
        timeout: 10000
      });
      
      // Tester des endpoints spécifiques
      const campaignsTest = await testEndpointAccess(`${baseUrl}/campaigns`, {
        timeout: 5000
      });
      
      const detailsTest = await testEndpointAccess(`${baseUrl}/templates`, {
        timeout: 5000
      });
      
      const result = {
        available: baseAccessTest.success,
        endpoints: {
          campaigns: campaignsTest.success,
          details: detailsTest.success
        },
        debugInfo: {
          success: baseAccessTest.success,
          errorMessage: baseAccessTest.success ? undefined : baseAccessTest.message,
          statusCode: baseAccessTest.statusCode,
          responseData: baseAccessTest.responseText,
          endpointTested: baseUrl,
          request: {
            url: baseUrl,
            method: 'GET'
          }
        }
      };
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Traitement générique pour les requêtes au service Acelle
    // Get API token from query parameters
    const apiToken = url.searchParams.get('api_token') || requestBody?.apiToken;
    
    if (!apiToken) {
      debugLog("Missing API token in request", {}, LOG_LEVELS.ERROR);
      return new Response(JSON.stringify({ 
        error: 'API token is required',
        timestamp: new Date().toISOString()
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the Acelle API endpoint from the request headers with fallback
    const acelleEndpoint = req.headers.get('x-acelle-endpoint') || 
                           url.searchParams.get('endpoint') || 
                           requestBody?.apiEndpoint ||
                           'https://emailing.plateforme-solution.net/api/v1';
    
    if (!acelleEndpoint) {
      debugLog("Missing Acelle endpoint in request headers", {}, LOG_LEVELS.ERROR);
      return new Response(JSON.stringify({ 
        error: 'Acelle endpoint is missing',
        timestamp: new Date().toISOString()
      }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    debugLog(`Received request to endpoint: ${acelleEndpoint} with method ${req.method}`, {
      params: Object.fromEntries(url.searchParams.entries())
    }, LOG_LEVELS.DEBUG);

    // Parse the URL path
    const parts = url.pathname.split('/');
    const resource = parts[parts.length - 2] === 'acelle-proxy' ? parts[parts.length - 1] : parts[parts.length - 2];
    const resourceId = parts[parts.length - 2] === 'acelle-proxy' ? null : parts[parts.length - 1];

    // Build Acelle API URL - FIXED: Avoid double api/v1 path
    // Make sure the endpoint doesn't end with a slash to properly join with the path
    const cleanEndpoint = acelleEndpoint.endsWith('/') ? acelleEndpoint.slice(0, -1) : acelleEndpoint;
    
    let acelleApiUrl;
    
    // Select auth method if specified
    const authMethod = req.headers.get('x-auth-method') || 'token'; // Default to token auth
    
    // Determine if we should use URL token or alternative auth
    const useUrlToken = authMethod === 'token';
    
    if (resourceId) {
      // Don't add api/v1 if it's already in the endpoint
      const apiPath = cleanEndpoint.includes('/api/v1') ? '' : '/api/v1';
      acelleApiUrl = useUrlToken ?
        `${cleanEndpoint}${apiPath}/${resource}/${resourceId}?api_token=${apiToken}` :
        `${cleanEndpoint}${apiPath}/${resource}/${resourceId}`;
    } else {
      // Copy all query parameters except api_token which is handled specially
      const queryParams = new URLSearchParams();
      for (const [key, value] of url.searchParams.entries()) {
        if (key !== 'api_token' && key !== 'cache_key' && key !== 'debug' && key !== 'debug_level' && key !== 'auth_method') {
          queryParams.append(key, value);
        }
      }
      
      // Add API token to URL only with token auth method
      if (useUrlToken) {
        queryParams.append('api_token', apiToken);
      }
      
      // Don't add api/v1 if it's already in the endpoint
      const apiPath = cleanEndpoint.includes('/api/v1') ? '' : '/api/v1';
      acelleApiUrl = `${cleanEndpoint}${apiPath}/${resource}?${queryParams.toString()}`;
    }

    debugLog(`Proxying request to Acelle API: ${acelleApiUrl}`, { authMethod }, LOG_LEVELS.DEBUG);

    // Prepare headers for the Acelle API request with selected auth method
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'Seventic-Acelle-Proxy/1.5', // Updated version
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Origin': 'https://dupguifqyjchlmzbadav.supabase.co'
    };

    // Add appropriate authentication based on selected method
    if (authMethod === 'basic') {
      // Use Basic Auth with token as username
      headers['Authorization'] = `Basic ${btoa(`${apiToken}:`)}`;
    } else if (authMethod === 'header') {
      // Use X-API-Key header
      headers['X-API-Key'] = apiToken;
    }
    
    // Also forward the auth header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Only add Content-Type for requests with body
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      headers['Content-Type'] = req.headers.get('Content-Type') || 'application/json';
    }

    // Log les en-têtes pour débogage
    debugLog("Request headers being sent:", headers, LOG_LEVELS.DEBUG);

    // Forward the request to Acelle API with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
      // Récupérer le body de la requête si nécessaire
      let requestBodyText = '';
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        requestBodyText = await req.text();
        debugLog("Request body (text):", requestBodyText, LOG_LEVELS.VERBOSE);
      }

      // Log the full request information
      debugLog("Full request details:", {
        method: req.method,
        url: acelleApiUrl,
        headers,
        body: requestBodyText || null,
        authMethod,
        timestamp: new Date().toISOString()
      }, LOG_LEVELS.VERBOSE);

      const response = await fetch(acelleApiUrl, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : requestBodyText,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Log the response status
      debugLog(`Acelle API response: ${response.status} ${response.statusText} for ${acelleApiUrl}`, {
        timeTaken: `${Date.now() - requestStartTime}ms`
      }, LOG_LEVELS.DEBUG);
      
      // Log response headers for debugging
      const responseHeadersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeadersObj[key] = value;
      });
      debugLog("Response headers:", responseHeadersObj, LOG_LEVELS.DEBUG);

      // Read response data
      const data = await response.text();
      
      // Log raw response for full diagnostics
      debugLog("Raw response data:", data.substring(0, 10000) + (data.length > 10000 ? "..." : ""), LOG_LEVELS.VERBOSE);
      
      let responseData;
      
      try {
        responseData = JSON.parse(data);
        debugLog(`Successfully parsed JSON response for ${resource}`, {}, LOG_LEVELS.DEBUG);
      } catch (e) {
        debugLog('Error parsing response from Acelle API:', e, LOG_LEVELS.ERROR);
        debugLog('Raw response data:', data.substring(0, 1000) + (data.length > 1000 ? '...' : ''), LOG_LEVELS.DEBUG);
        responseData = { 
          error: 'Failed to parse response from Acelle API', 
          status: response.status,
          message: data.substring(0, 2000),
          url: acelleApiUrl,
          timestamp: new Date().toISOString()
        };
      }

      // Record the completed request for diagnostics
      const requestDuration = Date.now() - requestStartTime;
      debugLog("Request completed", { 
        status: response.status, 
        duration: requestDuration + "ms", 
        resource, 
        resourceId 
      }, LOG_LEVELS.INFO);

      // Return the response with all required CORS headers
      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        debugLog(`Request to ${acelleApiUrl} timed out`, { timeout: DEFAULT_TIMEOUT }, LOG_LEVELS.ERROR);
        return new Response(JSON.stringify({ 
          error: 'Request timed out', 
          endpoint: acelleEndpoint,
          url: acelleApiUrl,
          timeout: DEFAULT_TIMEOUT,
          timestamp: new Date().toISOString()
        }), { 
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw fetchError; // Re-throw for the outer catch block
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    debugLog('Error in Acelle Proxy:', { errorMessage, errorStack }, LOG_LEVELS.ERROR);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorStack,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
