
/**
 * Utilitaires pour interagir avec le proxy CORS
 */
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// URL de base pour le proxy
const CORS_PROXY_BASE_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy";
const ACELLE_PROXY_BASE_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy";

// États du proxy
type ProxyStatus = 'unknown' | 'waking' | 'ready' | 'error';
let proxyStatus: ProxyStatus = 'unknown';
let lastWakeupAttempt: number = 0;
let wakeupPromise: Promise<boolean> | null = null;
const WAKEUP_COOLDOWN = 5000; // 5 secondes minimum entre les tentatives (réduit pour plus de réactivité)

/**
 * Réveille le proxy CORS si nécessaire et teste sa disponibilité
 * Implémente un système de cooldown pour éviter les tentatives répétées
 */
export async function wakeupCorsProxy(authToken: string | null): Promise<boolean> {
  // Si on a déjà essayé récemment, retourner l'état actuel
  const now = Date.now();
  if (now - lastWakeupAttempt < WAKEUP_COOLDOWN) {
    return proxyStatus === 'ready';
  }
  
  // Si une tentative est déjà en cours, attendre son résultat
  if (wakeupPromise) {
    return wakeupPromise;
  }
  
  lastWakeupAttempt = now;
  proxyStatus = 'waking';
  
  // Créer une nouvelle promesse pour le réveil
  wakeupPromise = new Promise<boolean>(async (resolve) => {
    try {
      console.log("Tentative de réveil du CORS proxy...");
      
      if (!authToken) {
        // Tenter d'obtenir un token si non fourni
        authToken = await getAuthToken();
        if (!authToken) {
          console.error("Pas de session d'authentification disponible pour la requête de réveil");
          proxyStatus = 'error';
          resolve(false);
          return;
        }
      }
      
      // Essayer les deux proxies pour assurer qu'ils sont réveillés
      const corsProxyAwake = await wakeupSpecificProxy(CORS_PROXY_BASE_URL, authToken);
      const acelleProxyAwake = await wakeupSpecificProxy(ACELLE_PROXY_BASE_URL, authToken);
      
      const proxyReady = corsProxyAwake && acelleProxyAwake;
      proxyStatus = proxyReady ? 'ready' : 'error';
      
      // Ajouter un délai pour s'assurer que les services sont complètement réveillés
      if (proxyReady) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`État du proxy CORS: ${proxyStatus}`);
      resolve(proxyReady);
    } catch (error) {
      console.error("Erreur non gérée lors du réveil du CORS proxy:", error);
      proxyStatus = 'error';
      resolve(false);
    } finally {
      // Réinitialiser la promesse
      setTimeout(() => {
        wakeupPromise = null;
      }, 1000);
    }
  });
  
  return wakeupPromise;
}

/**
 * Tente de réveiller un proxy spécifique
 */
async function wakeupSpecificProxy(baseUrl: string, authToken: string): Promise<boolean> {
  const maxAttempts = 3;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      const requestId = `wake_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // URL de ping
      const pingUrl = `${baseUrl}/ping`;
      
      const response = await fetch(pingUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "X-Wake-Request": "true",
          "X-Request-ID": requestId,
          "Accept": "application/json"
        },
        cache: "no-store",
        // Ajouter un timeout court pour ne pas bloquer trop longtemps
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log(`Proxy ${baseUrl} réveillé avec succès:`, data);
          return true;
        } catch (e) {
          console.warn(`Le proxy ${baseUrl} a répondu mais avec un format invalide:`, e);
        }
      } else {
        console.warn(`Le proxy ${baseUrl} a répondu avec le code: ${response.status} - Tentative ${attempts}/${maxAttempts}`);
      }
      
      // Attendre avant la prochaine tentative
      if (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (error) {
      console.error(`Erreur lors de la tentative ${attempts}/${maxAttempts} de réveil du proxy ${baseUrl}:`, error);
      
      if (attempts >= maxAttempts) {
        return false;
      }
      
      // Attendre avant la prochaine tentative
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  return false;
}

/**
 * Récupère un token d'authentification valide
 * Avec système de cache et retry
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    // Vérifier d'abord si nous avons une session
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data?.session?.access_token) {
      console.error("Erreur lors de la récupération du token d'authentification:", error);
      
      // Tenter un refresh explicite
      try {
        console.log("Tentative de rafraîchissement de la session...");
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error("Erreur lors du rafraîchissement de la session:", refreshError);
          return null;
        }
        
        // Récupérer la nouvelle session
        const { data: refreshedData, error: getError } = await supabase.auth.getSession();
        if (getError || !refreshedData?.session?.access_token) {
          console.error("Impossible de récupérer la session après rafraîchissement:", getError);
          return null;
        }
        
        console.log("Session rafraîchie avec succès");
        return refreshedData.session.access_token;
      } catch (refreshError) {
        console.error("Exception lors du rafraîchissement du token:", refreshError);
        return null;
      }
    }
    
    return data.session.access_token;
  } catch (error) {
    console.error("Exception lors de la récupération du token d'authentification:", error);
    return null;
  }
}

/**
 * Construit une URL pour le proxy CORS
 */
export function buildCorsProxyUrl(path: string): string {
  // Nettoyer le chemin des éventuels slashes en début
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${CORS_PROXY_BASE_URL}/${cleanPath}`;
}

/**
 * Effectue une requête via le proxy CORS avec gestion automatique du réveil
 */
export async function fetchViaProxy(
  path: string,
  options: RequestInit,
  acelleToken: string,
  acelleEndpoint: string,
  maxRetries: number = 3  // Augmentation du nombre de retries par défaut
): Promise<Response> {
  // Récupérer un token d'authentification
  let authToken = await getAuthToken();
  if (!authToken) {
    toast.error("Session expirée. Veuillez vous reconnecter.");
    throw new Error("Authentification requise");
  }
  
  // S'assurer que le proxy est réveillé
  let isProxyReady = await wakeupCorsProxy(authToken);
  if (!isProxyReady) {
    console.warn("Le proxy n'a pas pu être réveillé au premier essai, nouvelle tentative...");
    
    // Tenter de rafraîchir le token et réessayer
    authToken = await refreshAuthTokenExplicitly();
    if (authToken) {
      isProxyReady = await wakeupCorsProxy(authToken);
    }
    
    if (!isProxyReady) {
      toast.error("Le proxy CORS n'est pas disponible. Veuillez réessayer.");
      throw new Error("Le proxy CORS n'est pas disponible");
    }
  }
  
  // Nettoyer l'endpoint Acelle
  const cleanEndpoint = acelleEndpoint.endsWith('/') ? 
    acelleEndpoint.substring(0, acelleEndpoint.length - 1) : 
    acelleEndpoint;
  
  // Construire l'URL complète pour le proxy
  const url = buildCorsProxyUrl(path);
  
  // Ajouter les en-têtes nécessaires
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${authToken}`);
  headers.set("X-Acelle-Token", acelleToken);
  headers.set("X-Acelle-Endpoint", cleanEndpoint);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  headers.set("Accept", "application/json");
  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  headers.set("X-Request-ID", `req_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  
  // Créer les options de requête finales
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    cache: "no-store",
    // Ajouter un timeout pour éviter les attentes infinies
    signal: AbortSignal.timeout(30000)
  };
  
  // Effectuer la requête avec système de retry
  let attempts = 0;
  let lastError = null;
  
  while (attempts <= maxRetries) {
    try {
      // Indiquer qu'une requête est en cours dans les logs
      console.log(`Tentative ${attempts + 1}/${maxRetries + 1} - Requête vers: ${url}`);
      
      const response = await fetch(url, fetchOptions);
      
      // Si la requête a réussi, retourner la réponse
      if (response.ok) {
        return response;
      }
      
      console.warn(`Réponse non-OK: ${response.status} - ${response.statusText}`);
      
      // Gérer les cas d'erreur spécifiques
      if (response.status === 401 || response.status === 403) {
        if (attempts < maxRetries) {
          console.warn("Erreur d'authentification détectée, tentative de rafraîchissement du token...");
          const newAuthToken = await refreshAuthTokenExplicitly();
          
          if (newAuthToken) {
            headers.set("Authorization", `Bearer ${newAuthToken}`);
            attempts++;
            // Tenter de réveiller le proxy avec le nouveau token
            await wakeupCorsProxy(newAuthToken);
            continue;
          }
        }
        
        throw new Error(`Erreur d'authentification (${response.status})`);
      }
      
      // Pour les erreurs serveur, tenter de réessayer
      if ((response.status >= 500 && response.status < 600) || response.status === 429) {
        console.warn(`Erreur serveur (${response.status}), tentative ${attempts + 1}/${maxRetries + 1}...`);
        
        if (attempts < maxRetries) {
          attempts++;
          
          // Attendre un peu plus longtemps à chaque tentative
          const delay = 1000 * Math.pow(2, attempts);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }
      
      // Pour les autres erreurs HTTP comme 404, 400, etc., retourner la réponse telle quelle
      return response;
    } catch (error) {
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.warn(`Timeout de la requête, tentative ${attempts + 1}/${maxRetries + 1}...`);
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn(`Erreur réseau, tentative ${attempts + 1}/${maxRetries + 1}...`);
      } else {
        console.error(`Erreur lors de la requête:`, error);
      }
      
      if (attempts < maxRetries) {
        attempts++;
        
        // Tenter de réveiller le proxy avant de réessayer
        await wakeupCorsProxy(authToken);
        
        // Attendre un peu plus longtemps à chaque tentative
        const delay = 1000 * Math.min(30, Math.pow(1.5, attempts));
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      // Si toutes les tentatives ont échoué, propager l'erreur
      throw error;
    }
  }
  
  throw lastError || new Error("Échec des requêtes après plusieurs tentatives");
}

/**
 * Force un rafraîchissement explicite du token d'authentification
 */
async function refreshAuthTokenExplicitly(): Promise<string | null> {
  try {
    console.log("Rafraîchissement explicite du token d'authentification");
    
    // Tenter un refresh explicite
    const { error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error("Erreur lors du rafraîchissement explicite de la session:", refreshError);
      return null;
    }
    
    // Récupérer la nouvelle session
    const { data: refreshedData, error: getError } = await supabase.auth.getSession();
    
    if (getError || !refreshedData?.session?.access_token) {
      console.error("Erreur après le rafraîchissement de la session:", getError);
      return null;
    }
    
    console.log("Token d'authentification rafraîchi avec succès");
    return refreshedData.session.access_token;
  } catch (error) {
    console.error("Exception lors du rafraîchissement explicite du token:", error);
    return null;
  }
}
