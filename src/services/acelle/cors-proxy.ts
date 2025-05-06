
import { AcelleAccount } from "@/types/acelle.types";

/**
 * Constantes pour le proxy CORS
 */
export const CORS_PROXY_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy";

/**
 * Construit l'URL complète pour le proxy CORS
 * 
 * @param path - Le chemin de l'API à appeler
 * @returns L'URL complète pour le proxy CORS
 */
export const buildCorsProxyUrl = (path: string): string => {
  // Normaliser le chemin
  const normalizedPath = path.startsWith("/") ? path.substring(1) : path;
  return `${CORS_PROXY_URL}/${normalizedPath}`;
};

/**
 * Construit les en-têtes pour une requête via le proxy CORS
 * 
 * @param account - Le compte Acelle avec les informations d'API
 * @param additionalHeaders - En-têtes supplémentaires à inclure
 * @returns Les en-têtes HTTP pour la requête
 */
export const buildCorsProxyHeaders = (
  account: AcelleAccount,
  additionalHeaders?: Record<string, string>
): Record<string, string> => {
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Acelle-Token": account.api_token,
    "X-Acelle-Endpoint": account.api_endpoint,
    "X-Auth-Method": "token", // Méthode d'authentification préférée
    ...(additionalHeaders || {})
  };
};

/**
 * Effectue un appel à l'API Acelle via le proxy CORS
 * 
 * @param account - Le compte Acelle avec les informations d'API
 * @param path - Le chemin de l'API à appeler
 * @param options - Options supplémentaires pour la requête
 * @returns Les données de la réponse JSON
 */
export const callAcelleViaProxy = async (
  account: AcelleAccount,
  path: string,
  options?: {
    method?: string;
    body?: any;
    additionalHeaders?: Record<string, string>;
    timeout?: number;
  }
): Promise<any> => {
  try {
    // Configuration de base
    const method = options?.method || "GET";
    const timeout = options?.timeout || 30000; // 30 secondes par défaut
    
    // Construction de l'URL et des en-têtes
    const url = buildCorsProxyUrl(path);
    const headers = buildCorsProxyHeaders(account, options?.additionalHeaders);
    
    console.log(`Appel API via proxy CORS: ${url}`, { method });
    
    // Configuration du timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Configuration de la requête
    const requestOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal
    };
    
    // Ajout du corps si nécessaire
    if (options?.body && method !== "GET") {
      requestOptions.body = JSON.stringify(options.body);
    }
    
    // Exécution de la requête
    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);
    
    // Vérification de la réponse
    if (!response.ok) {
      console.error(`Erreur API via proxy CORS: ${response.status} - ${response.statusText}`);
      
      // Tentative de récupération du corps de l'erreur
      try {
        const errorText = await response.text();
        console.error("Détails de l'erreur:", errorText);
      } catch (e) {}
      
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }
    
    // Traitement de la réponse JSON
    const data = await response.json();
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("aborted")) {
      console.error(`Timeout de la requête après ${options?.timeout || 30000}ms: ${path}`);
      throw new Error(`Délai d'attente dépassé pour la requête: ${path}`);
    }
    
    console.error("Erreur lors de l'appel à l'API via proxy CORS:", error);
    throw error;
  }
};
