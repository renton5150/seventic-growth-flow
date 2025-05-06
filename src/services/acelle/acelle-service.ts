
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
 * Appelle directement l'API Acelle avec gestion des erreurs et retries
 */
export const callAcelleApi = async (
  url: string, 
  options: RequestInit = {},
  retries = 2
): Promise<any> => {
  try {
    console.log(`Appel API Acelle: ${url}`);
    
    // S'assurer que les headers sont définis
    const headers = {
      'Accept': 'application/json',
      ...options.headers
    };
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur API Acelle (${response.status}): ${errorText}`);
      
      // Réessayer en cas d'erreur de serveur (5xx)
      if (response.status >= 500 && retries > 0) {
        console.log(`Réessai de l'appel API (${retries} tentatives restantes)...`);
        return callAcelleApi(url, options, retries - 1);
      }
      
      throw new Error(`API Acelle: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Erreur lors de l'appel API Acelle:`, error);
    throw error;
  }
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
