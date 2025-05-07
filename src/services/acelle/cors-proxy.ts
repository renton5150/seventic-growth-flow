
/**
 * Système de proxy unifié avec gestion robuste de l'authentification
 * Résout les problèmes de CORS, de tokens expirés et de reconnexion
 */
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// URL de base pour les proxys
const CORS_PROXY_BASE_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy";
const ACELLE_PROXY_BASE_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy";

// Cache du token avec expiration
interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes avant expiration réelle

// États du système de proxy
type ProxyStatus = 'unknown' | 'waking' | 'ready' | 'error';
let proxyStatus: ProxyStatus = 'unknown';
let lastWakeupAttempt: number = 0;
let wakeupPromise: Promise<boolean> | null = null;
const WAKEUP_COOLDOWN = 3000; // 3 secondes minimum entre les tentatives

/**
 * Obtient un token d'authentification valide avec gestion de cache
 * Rafraîchit automatiquement si nécessaire
 */
export async function getAuthToken(force: boolean = false): Promise<string | null> {
  const now = Date.now();
  
  // Utiliser le token en cache s'il est valide et si on ne force pas le rafraîchissement
  if (!force && tokenCache && tokenCache.expiresAt > now + TOKEN_EXPIRY_BUFFER) {
    console.log("Utilisation du token en cache (valide pour encore", Math.floor((tokenCache.expiresAt - now)/1000), "secondes)");
    return tokenCache.token;
  }
  
  try {
    console.log(force ? "Forçage du rafraîchissement du token" : "Token expiré ou absent, obtention d'un nouveau token");
    
    // Tenter d'abord un rafraîchissement explicite
    try {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn("Avertissement lors du rafraîchissement de la session:", refreshError.message);
      }
    } catch (e) {
      console.warn("Exception lors du rafraîchissement de la session:", e);
      // Continuer malgré l'erreur
    }
    
    // Récupérer la session après tentative de rafraîchissement
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data?.session?.access_token) {
      console.error("Erreur lors de la récupération du token:", error || "Aucun token disponible");
      return null;
    }
    
    const token = data.session.access_token;
    const expiresAt = data.session.expires_at ? new Date(data.session.expires_at).getTime() : (now + 3600 * 1000);
    
    // Mettre en cache le token avec son expiration
    tokenCache = {
      token,
      expiresAt
    };
    
    console.log("Nouveau token obtenu, valide jusqu'à", new Date(expiresAt).toLocaleTimeString());
    return token;
  } catch (error) {
    console.error("Exception lors de l'obtention du token d'authentification:", error);
    return null;
  }
}

/**
 * Force un rafraîchissement explicite du token d'authentification
 * Efface le cache et demande un nouveau token
 */
export async function forceRefreshAuthToken(): Promise<string | null> {
  // Effacer le cache pour forcer un vrai rafraîchissement
  tokenCache = null;
  return await getAuthToken(true);
}

/**
 * Réveille tous les proxies avec une gestion intelligente des tentatives
 */
export async function wakeupCorsProxy(authToken?: string | null): Promise<boolean> {
  // Si on a déjà essayé récemment, retourner l'état actuel
  const now = Date.now();
  if (now - lastWakeupAttempt < WAKEUP_COOLDOWN) {
    return proxyStatus === 'ready';
  }
  
  // Si une tentative est déjà en cours, attendre son résultat
  if (wakeupPromise) {
    return await wakeupPromise;
  }
  
  lastWakeupAttempt = now;
  proxyStatus = 'waking';
  
  // Si pas de token fourni, en obtenir un nouveau
  if (!authToken) {
    authToken = await getAuthToken();
    if (!authToken) {
      console.error("Impossible d'obtenir un token pour réveiller le proxy");
      proxyStatus = 'error';
      return false;
    }
  }
  
  // Créer une nouvelle promesse pour le réveil
  wakeupPromise = new Promise<boolean>(async (resolve) => {
    try {
      console.log("Réveil des services de proxy...");
      
      // Réveiller les deux proxies en parallèle pour plus de rapidité
      const [corsProxyAwake, acelleProxyAwake] = await Promise.all([
        wakeupSpecificProxy(CORS_PROXY_BASE_URL, authToken!),
        wakeupSpecificProxy(ACELLE_PROXY_BASE_URL, authToken!)
      ]);
      
      const allAwake = corsProxyAwake && acelleProxyAwake;
      
      if (allAwake) {
        console.log("Tous les proxies sont réveillés et prêts");
        proxyStatus = 'ready';
        
        // Petit délai pour stabilisation
        await new Promise(r => setTimeout(r, 500));
        resolve(true);
      } else {
        console.error("Échec du réveil d'au moins un proxy");
        proxyStatus = 'error';
        resolve(false);
      }
    } catch (error) {
      console.error("Erreur lors du réveil des proxies:", error);
      proxyStatus = 'error';
      resolve(false);
    } finally {
      // Réinitialiser la promesse après un court délai
      setTimeout(() => {
        wakeupPromise = null;
      }, 500);
    }
  });
  
  return await wakeupPromise;
}

/**
 * Réveille un service de proxy spécifique avec plusieurs tentatives
 */
async function wakeupSpecificProxy(baseUrl: string, authToken: string): Promise<boolean> {
  const maxAttempts = 3;
  let attempts = 0;
  const proxyName = baseUrl.includes('cors-proxy') ? 'CORS Proxy' : 'Acelle Proxy';
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      const requestId = `wake_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      console.log(`Tentative ${attempts}/${maxAttempts} de réveil du ${proxyName}...`);
      
      // URL de ping avec timestamp pour éviter le cache
      const pingUrl = `${baseUrl}/ping?t=${Date.now()}`;
      
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
        // Essayer de lire le corps de la réponse pour vérifier que le service est vraiment prêt
        try {
          const data = await response.json();
          console.log(`${proxyName} réveillé avec succès:`, data);
          return true;
        } catch (e) {
          console.warn(`Le ${proxyName} a répondu mais avec un format invalide:`, e);
          if (attempts >= maxAttempts) return true; // Accepter quand même au dernier essai
        }
      } else {
        console.warn(`Le ${proxyName} a répondu avec le code: ${response.status} - Tentative ${attempts}/${maxAttempts}`);
      }
      
      // Attendre avant la prochaine tentative avec délai exponentiel
      if (attempts < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(1.5, attempts), 5000);
        await new Promise(r => setTimeout(r, delay));
      }
    } catch (error) {
      console.error(`Erreur lors de la tentative ${attempts}/${maxAttempts} de réveil du ${proxyName}:`, error);
      
      if (attempts >= maxAttempts) {
        return false;
      }
      
      // Attendre avant la prochaine tentative avec délai exponentiel
      const delay = Math.min(1000 * Math.pow(2, attempts), 5000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  return false;
}

/**
 * Construit une URL pour le proxy CORS
 */
export function buildCorsProxyUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${CORS_PROXY_BASE_URL}/${cleanPath}`;
}

/**
 * Construit une URL pour le proxy Acelle spécifique
 */
export function buildAcelleProxyUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${ACELLE_PROXY_BASE_URL}/${cleanPath}`;
}

/**
 * Effectue une requête à travers le proxy avec retry et gestion d'erreur
 * Unifie la logique entre les différents types de requêtes API
 */
export async function fetchViaProxy(
  path: string,
  options: RequestInit = {},
  apiToken: string,
  apiEndpoint: string,
  maxRetries: number = 1
): Promise<Response> {
  // S'assurer que les options et headers existent
  options.headers = options.headers || {};
  let headers = options.headers as Record<string, string>;
  
  // Ajouter les en-têtes pour le proxy Acelle
  headers["X-Acelle-Token"] = apiToken;
  headers["X-Acelle-Endpoint"] = apiEndpoint;
  headers["Accept"] = "application/json";
  headers["Content-Type"] = headers["Content-Type"] || "application/json";
  headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
  
  // Ajouter un ID de requête unique pour le traçage
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  headers["X-Request-ID"] = requestId;
  
  // Déterminer l'URL de proxy à utiliser (cors-proxy par défaut)
  const proxyUrl = buildCorsProxyUrl(path);
  
  let lastError: Error | null = null;
  let remainingRetries = maxRetries;
  
  // Boucle de tentatives avec backoff exponentiel
  while (remainingRetries >= 0) {
    try {
      const retryNum = maxRetries - remainingRetries;
      if (retryNum > 0) {
        console.log(`Tentative ${retryNum}/${maxRetries} pour ${path}...`);
        // Backoff exponentiel entre les tentatives
        const delay = Math.min(1000 * Math.pow(2, retryNum - 1), 4000);
        await new Promise(r => setTimeout(r, delay));
      }
      
      // Effectuer la requête avec abort controller pour timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(proxyUrl, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Gérer les erreurs d'authentification en relançant une exception
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Erreur d'authentification (${response.status}). Vérifiez le token API.`);
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Erreur de requête fetch pour ${path} (tentative ${maxRetries - remainingRetries}/${maxRetries}):`, lastError);
      remainingRetries--;
      
      // Si abort (timeout) et qu'il reste des tentatives, on réessaie
      if (lastError.name === 'AbortError' && remainingRetries >= 0) {
        console.warn("Timeout sur la requête, nouvelle tentative...");
        continue;
      }
      
      // Si c'est la dernière tentative, on relance l'erreur
      if (remainingRetries < 0) {
        throw new Error(`Échec après ${maxRetries} tentative(s): ${lastError.message}`);
      }
    }
  }
  
  // On ne devrait jamais arriver ici (mais TypeScript a besoin de ce retour)
  throw lastError || new Error("Erreur inattendue dans fetchViaProxy");
}

// Variables pour le service de heartbeat
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Configure un service de heartbeat pour maintenir les services en vie
 * @param interval - Intervalle en ms entre les heartbeats (défaut: 3 minutes)
 * @returns Fonction de nettoyage pour arrêter le heartbeat
 */
export function setupHeartbeatService(interval: number = 3 * 60 * 1000): () => void {
  // Ne pas démarrer un nouveau heartbeat si un est déjà actif
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  
  // Fonction de heartbeat qui sera appelée périodiquement
  const sendHeartbeat = async () => {
    try {
      console.log("Envoi d'un heartbeat pour maintenir les services en vie...");
      const token = await getAuthToken();
      
      if (!token) {
        console.warn("Pas de token disponible pour le heartbeat");
        return;
      }
      
      // Réveiller les services avec le token
      await wakeupCorsProxy(token);
    } catch (error) {
      console.error("Erreur lors du heartbeat:", error);
    }
  };
  
  // Démarrer immédiatement un premier heartbeat
  sendHeartbeat();
  
  // Puis programmer les suivants à intervalle régulier
  heartbeatInterval = setInterval(sendHeartbeat, interval);
  
  // Renvoyer une fonction de nettoyage
  return () => {
    if (heartbeatInterval) {
      console.log("Arrêt du service de heartbeat");
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };
}

/**
 * Diagnostic complet de la connexion Acelle
 * Vérifie tous les aspects de la connexion et retourne des informations détaillées
 */
export async function runAcelleDiagnostic(): Promise<{
  success: boolean;
  results: {
    auth: {
      success: boolean;
      token: string | null;
      error?: string;
    };
    proxy: {
      corsProxy: boolean;
      acelleProxy: boolean;
      error?: string;
    };
  };
  timestamp: string;
}> {
  try {
    // 1. Vérifier l'authentification
    const authResult = { success: false, token: null as string | null, error: undefined as string | undefined };
    try {
      // Force un nouveau token pour le diagnostic
      const token = await forceRefreshAuthToken();
      authResult.token = token;
      authResult.success = !!token;
      
      if (!token) {
        authResult.error = "Échec de l'obtention d'un token valide";
      }
    } catch (e) {
      authResult.error = e instanceof Error ? e.message : String(e);
    }
    
    // 2. Vérifier les proxies si on a un token
    const proxyResult = { corsProxy: false, acelleProxy: false, error: undefined as string | undefined };
    if (authResult.token) {
      try {
        // Vérifier chaque proxy individuellement
        const corsAwake = await wakeupSpecificProxy(CORS_PROXY_BASE_URL, authResult.token);
        const acelleAwake = await wakeupSpecificProxy(ACELLE_PROXY_BASE_URL, authResult.token);
        
        proxyResult.corsProxy = corsAwake;
        proxyResult.acelleProxy = acelleAwake;
        
        if (!corsAwake || !acelleAwake) {
          proxyResult.error = "Au moins un service proxy n'a pas pu être réveillé";
        }
      } catch (e) {
        proxyResult.error = e instanceof Error ? e.message : String(e);
      }
    }
    
    // 3. Construire et retourner le résultat complet
    return {
      success: authResult.success && proxyResult.corsProxy && proxyResult.acelleProxy,
      results: {
        auth: authResult,
        proxy: proxyResult
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    // En cas d'erreur globale
    return {
      success: false,
      results: {
        auth: { success: false, token: null, error: "Erreur générale du diagnostic" },
        proxy: { corsProxy: false, acelleProxy: false, error: error instanceof Error ? error.message : String(error) }
      },
      timestamp: new Date().toISOString()
    };
  }
}
