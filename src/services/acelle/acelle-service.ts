
/**
 * Utilities pour l'API Acelle
 */
import { AcelleAccount } from "@/types/acelle.types";

/**
 * Construit l'URL pour l'API Acelle en tenant compte de la configuration du compte
 */
export const buildAcelleApiUrl = (account: AcelleAccount, path: string): string => {
  // Normaliser le endpoint en supprimant le slash final si présent
  const apiBase = account.api_endpoint?.endsWith("/") 
    ? account.api_endpoint.slice(0, -1) 
    : account.api_endpoint;
  
  // Vérifier si le path commence par un slash et l'ajuster
  const apiPath = path.startsWith("/") ? path.substring(1) : path;
  
  // Déterminer si l'API contient déjà "api/v1" dans son URL
  const needsApiV1 = !apiBase.includes("/api/v1");
  const apiV1Path = needsApiV1 ? "/api/v1/" : "/";
  
  // Construire l'URL finale avec le token d'API
  const apiToken = account.api_token;
  const separator = apiPath.includes("?") ? "&" : "?";
  const finalPath = `${apiPath}${separator}api_token=${apiToken}`;
  
  return `${apiBase}${apiV1Path}${finalPath}`;
};

/**
 * Construit l'URL pour le proxy CORS
 */
export const buildProxyUrl = (account: AcelleAccount, path: string): string => {
  // URL de base pour le proxy CORS
  const proxyBase = 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy';
  
  // Normaliser le endpoint en supprimant le slash final si présent
  const apiBase = account.api_endpoint?.endsWith("/") 
    ? account.api_endpoint.slice(0, -1) 
    : account.api_endpoint;
  
  // Vérifier si le path commence par un slash et l'ajuster
  const apiPath = path.startsWith("/") ? path.substring(1) : path;
  
  // Déterminer si l'API contient déjà "api/v1" dans son URL
  const needsApiV1 = !apiBase.includes("/api/v1");
  const apiV1Path = needsApiV1 ? "/api/v1/" : "/";
  
  // Construire l'URL de l'API cible (sans token, car il sera passé en en-tête)
  const targetUrl = `${apiBase}${apiV1Path}${apiPath}`;
  
  // Construire l'URL finale pour le proxy
  return `${proxyBase}/${apiPath}`;
};

/**
 * Effectue un appel à l'API Acelle
 */
export const callAcelleApi = async (url: string, options?: {
  method?: string;
  body?: any;
  maxRetries?: number;
  useProxy?: boolean;
  headers?: Record<string, string>;
}, retryCount = 0): Promise<any> => {
  try {
    // Configuration par défaut
    const method = options?.method || "GET";
    const maxRetries = options?.maxRetries || 1;
    const useProxy = options?.useProxy || false;

    // Construire les en-têtes HTTP
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...options?.headers
    };
    
    console.log(`Appel API Acelle (${retryCount + 1}/${maxRetries + 1}): ${url}`, { method, useProxy });

    // Configuration de la requête
    const requestOptions: RequestInit = {
      method,
      headers,
      cache: "no-store"
    };

    // Ajouter le corps de la requête si nécessaire
    if (options?.body && method !== "GET") {
      requestOptions.body = JSON.stringify(options.body);
    }

    // Exécuter la requête
    const response = await fetch(url, requestOptions);
    
    // Vérifier le statut de la réponse
    if (!response.ok) {
      console.error(`Erreur API Acelle: ${response.status} - ${response.statusText}`, { url });
      
      if (response.status === 404) {
        console.error("URL introuvable:", url);
      }
      
      // Tentative avec le body de l'erreur
      try {
        const errorBody = await response.text();
        console.error("Détails de l'erreur:", errorBody);
      } catch (e) {
        // Ignorer l'erreur de lecture du corps
      }
      
      // Si on n'a pas atteint le nombre max de tentatives, réessayer
      if (retryCount < maxRetries) {
        console.log(`Nouvelle tentative (${retryCount + 2}/${maxRetries + 1}) pour: ${url}`);
        
        // Attendre un délai avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        
        return callAcelleApi(url, options, retryCount + 1);
      }
      
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }

    // Traiter la réponse
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API Acelle:", error);
    
    // Si on n'a pas atteint le nombre max de tentatives, réessayer
    if (retryCount < (options?.maxRetries || 1)) {
      console.log(`Nouvelle tentative après erreur (${retryCount + 2}/${(options?.maxRetries || 1) + 1}) pour: ${url}`);
      
      // Attendre un délai avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      
      return callAcelleApi(url, options, retryCount + 1);
    }
    
    throw error;
  }
};
