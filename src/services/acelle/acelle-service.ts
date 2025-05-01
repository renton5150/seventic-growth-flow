
import { getAcelleAccounts, getAcelleAccountById, createAcelleAccount, updateAcelleAccount, deleteAcelleAccount, updateLastSyncDate } from './api/accounts';
import { testAcelleConnection } from './api/connection';
import { checkApiAccess, fetchCampaignDetails, getAcelleCampaigns, calculateDeliveryStats } from './api/campaigns';

// Configuration API proxy améliorée avec URLs cohérentes
export const ACELLE_PROXY_CONFIG = {
  BASE_URL: "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy",
  ACELLE_API_URL: "https://emailing.plateforme-solution.net/api/v1",
  AUTH_METHOD: "token"
};

/**
 * Fonction utilitaire optimisée pour construire des URLs proxy correctement encodées
 * avec une meilleure gestion des erreurs et contrôle de qualité
 */
export const buildProxyUrl = (endpoint: string, queryParams: Record<string, string> = {}): string => {
  try {
    // Nettoyer l'endpoint pour éviter les slashes en début/fin
    const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
    
    // Construire l'URL cible d'Acelle avec le bon format
    const targetUrl = `${ACELLE_PROXY_CONFIG.ACELLE_API_URL}/${cleanEndpoint}`;
    
    // Construire les paramètres d'URL avec vérification stricte
    const urlSearchParams = new URLSearchParams();
    
    // Ajouter les paramètres fournis s'ils existent
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        urlSearchParams.append(key, encodeURIComponent(value));
      }
    }
    
    // Ajouter un paramètre d'horodatage pour éviter le cache si non présent
    if (!queryParams.t && !queryParams.timestamp && !queryParams.cache_bust) {
      urlSearchParams.append('cache_bust', Date.now().toString());
    }
    
    // Construire l'URL finale avec les paramètres
    let finalTargetUrl = targetUrl;
    const queryString = urlSearchParams.toString();
    if (queryString) {
      finalTargetUrl += `?${queryString}`;
    }
    
    // Log pour débogage
    console.log(`URL proxy construite: ${ACELLE_PROXY_CONFIG.BASE_URL}?url=${encodeURIComponent(finalTargetUrl)}`);
    
    // Retourner l'URL proxy complète avec l'URL cible correctement encodée
    return `${ACELLE_PROXY_CONFIG.BASE_URL}?url=${encodeURIComponent(finalTargetUrl)}`;
  } catch (error) {
    console.error("Erreur lors de la construction de l'URL proxy:", error);
    throw new Error(`Échec de la construction de l'URL proxy pour l'endpoint ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Exporter tous les services sous un seul objet acelleService
export const acelleService = {
  // Gestion des comptes
  getAcelleAccounts,
  getAcelleAccountById,
  createAcelleAccount,
  updateAcelleAccount,
  deleteAcelleAccount,
  
  // Test de connexion
  testAcelleConnection,
  checkApiAccess,
  
  // Opérations sur les campagnes
  getAcelleCampaigns,
  fetchCampaignDetails,
  updateLastSyncDate,
  calculateDeliveryStats,
  
  // Utilitaires
  buildProxyUrl,
  
  // Configuration
  config: ACELLE_PROXY_CONFIG
};

// Exporter aussi les fonctions individuelles pour les imports directs
export {
  getAcelleAccounts,
  getAcelleAccountById,
  createAcelleAccount,
  updateAcelleAccount,
  deleteAcelleAccount,
  testAcelleConnection,
  checkApiAccess,
  getAcelleCampaigns,
  fetchCampaignDetails,
  updateLastSyncDate
};
