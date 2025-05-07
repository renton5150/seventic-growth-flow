
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
      // Réinitialiser la promesse
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
      
      // Attendre avant la prochaine tentative
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
 * Effectue une requête via le proxy CORS avec gestion automatique des erreurs
 * Réveille automatiquement les services si nécessaire
 */
export async function fetchViaProxy(
  path: string,
  options: RequestInit,
  acelleToken: string,
  acelleEndpoint: string,
  maxRetries: number = 3
): Promise<Response> {
  let authToken = await getAuthToken();
  if (!authToken) {
    toast.error("Session expirée. Veuillez vous reconnecter.");
    throw new Error("Authentification requise");
  }
  
  // Vérifier et réveiller le proxy si nécessaire
  if (proxyStatus !== 'ready') {
    console.log("Proxy non prêt, tentative de réveil...");
    const isProxyReady = await wakeupCorsProxy(authToken);
    
    if (!isProxyReady) {
      // Tenter une dernière fois avec un nouveau token
      authToken = await forceRefreshAuthToken();
      if (!authToken || !(await wakeupCorsProxy(authToken))) {
        toast.error("Services de connexion indisponibles. Veuillez réessayer.");
        throw new Error("Services indisponibles");
      }
    }
  }
  
  // Standardiser l'endpoint Acelle
  const cleanEndpoint = acelleEndpoint.endsWith('/') ? 
    acelleEndpoint.substring(0, acelleEndpoint.length - 1) : 
    acelleEndpoint;
  
  // URL du proxy
  const url = buildCorsProxyUrl(path);
  
  // En-têtes standardisés
  const headersObj = {
    ...(options.headers || {}),
    "Authorization": `Bearer ${authToken}`,
    "X-Acelle-Token": acelleToken,
    "X-Acelle-Endpoint": cleanEndpoint,
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "X-Request-ID": `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
  };
  
  // Options finales
  const fetchOptions: RequestInit = {
    ...options,
    headers: headersObj,
    cache: "no-store",
    // Timeout pour éviter les attentes infinies
    signal: AbortSignal.timeout(30000)
  };
  
  // Système de retentative intelligent
  let attempts = 0;
  let lastError: Error | null = null;
  
  while (attempts <= maxRetries) {
    try {
      console.log(`Tentative ${attempts + 1}/${maxRetries + 1} - Requête vers: ${url}`);
      
      const response = await fetch(url, fetchOptions);
      
      // Vérifier si la réponse est valide
      if (response.ok) {
        return response;
      }
      
      console.warn(`Réponse non-OK: ${response.status} - ${response.statusText}`);
      
      // Gérer les erreurs d'authentification
      if (response.status === 401 || response.status === 403) {
        if (attempts < maxRetries) {
          console.log("Erreur d'authentification détectée, rafraîchissement du token...");
          const newToken = await forceRefreshAuthToken();
          
          if (newToken) {
            // Créer de nouveaux en-têtes avec le nouveau token
            const updatedHeaders = {
              ...headersObj,
              "Authorization": `Bearer ${newToken}`
            };
            
            // Mettre à jour les options de fetch avec les nouveaux en-têtes
            fetchOptions.headers = updatedHeaders;
            
            attempts++;
            // Réveiller le proxy avec le nouveau token
            await wakeupCorsProxy(newToken);
            continue;
          }
        }
        
        throw new Error(`Erreur d'authentification (${response.status})`);
      }
      
      // Pour les erreurs serveur, tenter à nouveau
      if (response.status >= 500 || response.status === 429 || response.status === 404) {
        if (attempts < maxRetries) {
          attempts++;
          console.log(`Erreur ${response.status}, nouvelle tentative ${attempts}/${maxRetries}...`);
          
          // Si c'est un 404, essayer avec un chemin alternatif
          if (response.status === 404 && attempts === 1 && path.includes('/ping')) {
            // Essayer avec un autre endpoint
            const newPath = path.replace('/ping', '/campaigns?page=1&per_page=1');
            const newUrl = buildCorsProxyUrl(newPath);
            console.log(`Tentative avec un chemin alternatif: ${newPath}`);
            
            const newOptions = { ...fetchOptions };
            const newHeaders = { 
              ...headersObj,
              "X-Request-ID": `req_alt_${Date.now()}`
            };
            fetchOptions.headers = newHeaders;
            
            const altResponse = await fetch(newUrl, newOptions);
            if (altResponse.ok) {
              return altResponse;
            }
          }
          
          // Attendre un peu plus longtemps à chaque tentative
          const delay = 1000 * Math.min(30, Math.pow(1.5, attempts));
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }
      
      // Pour les autres erreurs HTTP, retourner la réponse
      return response;
    } catch (error: any) {
      lastError = error;
      const isTimeout = error.name === 'AbortError';
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      
      if (isTimeout) {
        console.warn(`Timeout de la requête après ${attempts + 1} tentative(s)`);
      } else if (isNetworkError) {
        console.warn(`Erreur réseau après ${attempts + 1} tentative(s)`);
      } else {
        console.error(`Erreur lors de la requête:`, error);
      }
      
      if (attempts < maxRetries) {
        attempts++;
        
        // Si erreur réseau ou timeout, tenter de réveiller le proxy
        if (isTimeout || isNetworkError) {
          await wakeupCorsProxy(await getAuthToken());
        }
        
        // Délai exponentiel
        const delay = 1000 * Math.min(30, Math.pow(1.5, attempts));
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      // Si toutes les tentatives ont échoué
      throw error;
    }
  }
  
  throw lastError || new Error("Échec après plusieurs tentatives");
}

/**
 * Programme un rappel périodique pour maintenir les services actifs
 * @returns fonction de nettoyage pour arrêter les rappels
 */
export function setupHeartbeatService(intervalMs: number = 5 * 60 * 1000): () => void {
  console.log(`Configuration du heartbeat toutes les ${intervalMs/1000} secondes`);
  
  // Première vérification immédiate
  const checkServices = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        await wakeupCorsProxy(token);
      }
    } catch (e) {
      console.error("Erreur lors du heartbeat:", e);
    }
  };
  
  // Lancer la première vérification après un court délai
  const initialTimeout = setTimeout(() => {
    checkServices();
  }, 5000);
  
  // Configurer l'intervalle régulier
  const intervalId = setInterval(checkServices, intervalMs);
  
  // Fonction de nettoyage
  return () => {
    clearTimeout(initialTimeout);
    clearInterval(intervalId);
  };
}
