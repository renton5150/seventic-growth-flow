
import { debugLog, LOG_LEVELS } from './logger.ts';

/**
 * Teste l'accessibilité d'un endpoint avec diagnostic extensif
 * 
 * @param url - L'URL à tester
 * @param options - Options pour le test (timeout, headers)
 * @returns Résultat du test avec diagnostics
 */
export async function testEndpointAccess(
  url: string, 
  options: { timeout?: number, headers?: Record<string, string> } = {}
): Promise<{
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
      signal: controller.signal,
      redirect: 'follow' // Allow redirects to be followed automatically
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    // Capture and log response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    // Log the final URL after redirects
    debugLog(`Response URL after redirects: ${response.url}`, {}, LOG_LEVELS.DEBUG);
    
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

/**
 * Teste différentes méthodes d'authentification à un endpoint d'API
 * 
 * @param baseUrl - L'URL de base de l'API
 * @param endpoint - Le point de terminaison à tester
 * @param apiToken - Le token d'API à utiliser
 * @param options - Options additionnelles (timeout, méthodes d'auth à tester)
 * @returns Résultat du test d'authentification
 */
export async function testAuthMethods(
  baseUrl: string, 
  endpoint: string, 
  apiToken: string, 
  options: { 
    timeout?: number,
    authMethods?: string[]
  } = {}
): Promise<{
  success: boolean,
  method?: string,
  statusCode?: number,
  message: string,
  responseText?: string,
  responseTime?: number,
  authDetails?: any
}> {
  const timeout = options.timeout || 30000;
  const methods = options.authMethods || ["token", "basic", "header"]; // Default methods to try
  
  // Résultats pour chaque méthode
  const results: Record<string, any> = {};
  
  debugLog(`Testing authentication methods for ${baseUrl + endpoint}`, { methods }, LOG_LEVELS.INFO);
  
  // Méthode 1: Auth par token dans l'URL (recommandée par la documentation Acelle)
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
