
/**
 * Utilitaires pour interagir avec le proxy CORS
 */
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// URL de base pour le proxy
const CORS_PROXY_BASE_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy";

// États du proxy
type ProxyStatus = 'unknown' | 'waking' | 'ready' | 'error';
let proxyStatus: ProxyStatus = 'unknown';
let lastWakeupAttempt: number = 0;
let wakeupPromise: Promise<boolean> | null = null;
const WAKEUP_COOLDOWN = 30000; // 30 secondes minimum entre les tentatives

/**
 * Réveille le proxy CORS si nécessaire et teste sa disponibilité
 * Implémente un système de cooldown pour éviter les tentatives répétées
 */
export async function wakeupCorsProxy(authToken: string): Promise<boolean> {
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
      
      // URL de l'endpoint de heartbeat du proxy
      const proxyUrl = `${CORS_PROXY_BASE_URL}/heartbeat`;
      
      // Effectuer une requête pour réveiller le proxy avec retry
      let attempts = 0;
      const maxAttempts = 2;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          
          // Ajouter un timestamp unique pour éviter le cache
          const requestId = `wakeup_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          
          const response = await fetch(proxyUrl, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${authToken}`,
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "X-Request-ID": requestId,
              "X-Wake-Request": "true"
            },
            // Important: désactiver complètement le cache du navigateur
            cache: "no-store"
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log("Proxy CORS réveillé avec succès:", data);
            proxyStatus = 'ready';
            resolve(true);
            return;
          } else {
            console.warn(`Échec du réveil du proxy CORS (tentative ${attempts}/${maxAttempts}):`, 
              await response.text());
            
            if (attempts >= maxAttempts) {
              proxyStatus = 'error';
              resolve(false);
              return;
            }
            
            // Attendre avant la prochaine tentative
            await new Promise(r => setTimeout(r, 1000));
          }
        } catch (error) {
          console.error(`Erreur lors de la tentative ${attempts}/${maxAttempts}:`, error);
          
          if (attempts >= maxAttempts) {
            proxyStatus = 'error';
            resolve(false);
            return;
          }
          
          // Attendre avant la prochaine tentative
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      
      // Si toutes les tentatives ont échoué
      proxyStatus = 'error';
      resolve(false);
    } catch (error) {
      console.error("Erreur non gérée lors du réveil du CORS proxy:", error);
      proxyStatus = 'error';
      resolve(false);
    } finally {
      // Réinitialiser la promesse après un court délai
      setTimeout(() => {
        wakeupPromise = null;
      }, 1000);
    }
  });
  
  return wakeupPromise;
}

/**
 * Récupère un token d'authentification valide
 * Avec système de cache et retry
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    // Vérifier d'abord si nous avons une session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Erreur lors de la récupération du token d'authentification:", error);
      
      // Tenter un refresh explicite
      try {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("Erreur lors du rafraîchissement de la session:", refreshError);
          return null;
        }
        
        // Récupérer la nouvelle session
        const { data: refreshedData, error: getError } = await supabase.auth.getSession();
        if (getError || !refreshedData?.session?.access_token) {
          return null;
        }
        
        return refreshedData.session.access_token;
      } catch (refreshError) {
        console.error("Exception lors du rafraîchissement du token:", refreshError);
        return null;
      }
    }
    
    return data?.session?.access_token || null;
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
  aceileToken: string,
  acelleEndpoint: string,
  maxRetries: number = 1
): Promise<Response> {
  // Récupérer un token d'authentification
  const authToken = await getAuthToken();
  if (!authToken) {
    throw new Error("Authentication requise");
  }
  
  // S'assurer que le proxy est réveillé
  const isProxyReady = await wakeupCorsProxy(authToken);
  if (!isProxyReady) {
    toast.error("Impossible de réveiller le proxy CORS. Veuillez réessayer plus tard.");
    throw new Error("Le proxy CORS n'est pas disponible");
  }
  
  // Construire l'URL complète pour le proxy
  const url = buildCorsProxyUrl(path);
  
  // Ajouter les en-têtes nécessaires
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${authToken}`);
  headers.set("X-Acelle-Token", aceileToken);
  headers.set("X-Acelle-Endpoint", acelleEndpoint);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  headers.set("Accept", "application/json");
  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  
  // Créer les options de requête finales
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    cache: "no-store"
  };
  
  // Effectuer la requête avec système de retry
  let attempts = 0;
  
  while (true) {
    try {
      const response = await fetch(url, fetchOptions);
      
      // Si la requête a réussi, retourner la réponse
      if (response.ok) {
        return response;
      }
      
      // Gérer les cas d'erreur spécifiques
      if (response.status === 401) {
        // Tenter un refresh du token et réessayer une dernière fois
        if (attempts === 0) {
          console.warn("Erreur 401 détectée, tentative de rafraîchissement du token...");
          const newAuthToken = await refreshAuthTokenExplicitly();
          
          if (newAuthToken) {
            headers.set("Authorization", `Bearer ${newAuthToken}`);
            attempts++;
            continue;
          }
        }
        
        throw new Error("Erreur d'authentification (401)");
      }
      
      // Si c'est une erreur 500, tenter de réessayer
      if (response.status === 500 && attempts < maxRetries) {
        console.warn(`Erreur serveur (500), tentative ${attempts + 1}/${maxRetries + 1}...`);
        attempts++;
        
        // Attendre un peu avant de réessayer
        await new Promise(r => setTimeout(r, 1000 * attempts));
        continue;
      }
      
      // Pour les autres erreurs, retourner la réponse telle quelle
      return response;
    } catch (error) {
      // Si c'est une erreur réseau et qu'on n'a pas dépassé le nombre de tentatives
      if (error instanceof TypeError && error.message.includes('fetch') && attempts < maxRetries) {
        console.warn(`Erreur réseau, tentative ${attempts + 1}/${maxRetries + 1}...`);
        attempts++;
        
        // Attendre un peu avant de réessayer
        await new Promise(r => setTimeout(r, 1000 * attempts));
        continue;
      }
      
      // Sinon, propager l'erreur
      throw error;
    }
  }
}

/**
 * Force un rafraîchissement explicite du token d'authentification
 */
async function refreshAuthTokenExplicitly(): Promise<string | null> {
  try {
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
    
    return refreshedData.session.access_token;
  } catch (error) {
    console.error("Exception lors du rafraîchissement explicite du token:", error);
    return null;
  }
}
