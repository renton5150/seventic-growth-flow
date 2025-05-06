
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount } from "@/types/acelle.types";
import { getAcelleAccounts, getAcelleAccountById, createAcelleAccount, updateAcelleAccount, deleteAcelleAccount } from "./api/accounts";
import { forceSyncCampaigns, getAcelleCampaigns } from "./api/campaigns";

/**
 * Construit l'URL pour l'API Acelle
 */
export const buildAcelleApiUrl = (
  account: AcelleAccount, 
  endpoint: string, 
  params?: Record<string, string>
): string => {
  // S'assurer que l'endpoint n'a pas de slash au début
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // S'assurer que l'api_endpoint n'a pas de slash à la fin
  const baseUrl = account.api_endpoint.endsWith('/') 
    ? account.api_endpoint.slice(0, -1) 
    : account.api_endpoint;
  
  // Construire l'URL avec les paramètres
  const url = new URL(`${baseUrl}/${cleanEndpoint}`);
  
  // Ajouter le token API
  url.searchParams.append('api_token', account.api_token);
  
  // Ajouter d'autres paramètres si fournis
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  return url.toString();
};

/**
 * Fonction de délai (sleep) pour les retry
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Appelle directement l'API Acelle avec gestion des erreurs et retries
 */
export const callAcelleApi = async (
  url: string, 
  options: RequestInit = {},
  retries = 2,
  retryDelay = 1000
): Promise<any> => {
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Tentative ${attempt}/${retries} pour l'appel à ${url}`);
        await delay(retryDelay * attempt); // Délai exponentiel entre les tentatives
      }
      
      console.log(`Appel API Acelle: ${url}`);
      
      // S'assurer que les headers sont définis
      const headers = {
        'Accept': 'application/json',
        ...options.headers
      };
      
      const response = await fetch(url, {
        ...options,
        headers,
        // Assurer que les requêtes échouent rapidement en cas de problème réseau
        signal: AbortSignal.timeout(15000) // 15 secondes timeout
      });
      
      // Vérifier si la réponse est OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur API Acelle (${response.status}): ${errorText}`);
        
        // Stocker l'erreur pour la dernière tentative
        lastError = new Error(`API Acelle: ${response.status} ${response.statusText} - ${errorText}`);
        
        // Si c'est une erreur de serveur (5xx) ou certaines erreurs 4xx qui peuvent être transitoires
        // On continue la boucle pour réessayer
        if (response.status >= 500 || response.status === 429 || response.status === 408) {
          continue;
        }
        
        // Pour les autres erreurs (400, 401, 403, etc.), on abandonne directement
        throw lastError;
      }
      
      // Si on arrive ici, la requête a réussi
      const data = await response.json();
      return data;
      
    } catch (error: any) {
      console.error(`Erreur lors de l'appel API Acelle (tentative ${attempt}/${retries}):`, error);
      lastError = error;
      
      // Si c'est une erreur de timeout ou de réseau et qu'il nous reste des tentatives, on continue
      if ((error.name === 'AbortError' || error.name === 'TypeError') && attempt < retries) {
        continue;
      }
      
      // Pour les autres erreurs ou si c'était la dernière tentative, on abandonne
      if (attempt >= retries) {
        console.error(`Échec après ${retries} tentatives pour ${url}`);
      }
      
      throw lastError;
    }
  }
  
  // On ne devrait jamais arriver ici, mais au cas où
  throw lastError || new Error(`Échec inexpliqué de l'appel API: ${url}`);
};

/**
 * Construit l'URL pour le proxy CORS (pour compatibilité)
 */
export const buildProxyUrl = (endpoint: string, params?: Record<string, string>): string => {
  const baseUrl = '/api/proxy/acelle';
  
  // S'assurer que l'endpoint n'a pas de slash au début
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Construire l'URL
  let url = `${baseUrl}/${cleanEndpoint}`;
  
  // Ajouter les paramètres d'URL
  if (params) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    
    url += `?${queryParams.toString()}`;
  }
  
  return url;
};

/**
 * Service pour gérer les appels à l'API Acelle
 */
export const acelleService = {
  // Exporter les fonctions d'API
  getAcelleAccounts,
  getAcelleAccountById,
  createAcelleAccount,
  updateAcelleAccount,
  deleteAcelleAccount,
  forceSyncCampaigns,
  getAcelleCampaigns,
  
  // Exporter les fonctions utilitaires
  buildAcelleApiUrl,
  callAcelleApi,
  buildProxyUrl
};

export default acelleService;
