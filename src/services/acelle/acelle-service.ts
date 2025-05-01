
import * as accountsModule from './api/accounts';
import * as campaignsModule from './api/campaigns';
import * as connectionModule from './api/connection';

// Définir la configuration du proxy Acelle
export const ACELLE_PROXY_CONFIG = {
  BASE_URL: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy',
  ACELLE_API_URL: 'https://emailing.plateforme-solution.net/api/v1'
};

// Construire l'URL du proxy avec les paramètres
export const buildProxyUrl = (path: string, params: Record<string, string> = {}): string => {
  // Déterminer l'URL de base du proxy
  const baseProxyUrl = ACELLE_PROXY_CONFIG.BASE_URL;
  
  // Construire l'URL Acelle complète avec tous les paramètres
  // Note: l'API Acelle finit généralement par /api/v1/
  const apiPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Créer l'URL de l'API avec les paramètres
  let apiUrl = `${ACELLE_PROXY_CONFIG.ACELLE_API_URL}/${apiPath}`;
  
  // Ajouter les paramètres à l'URL
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, value);
    }
    
    apiUrl += '?' + searchParams.toString();
  }
  
  // Encoder l'URL pour le proxy
  const encodedApiUrl = encodeURIComponent(apiUrl);
  
  // Retourner l'URL finalisée
  return `${baseProxyUrl}?url=${encodedApiUrl}`;
};

// Exporter toutes les fonctions de chaque module individuellement pour faciliter l'import
export const {
  getAcelleAccounts,
  getAcelleAccountById,
  createAcelleAccount,
  updateAcelleAccount,
  deleteAcelleAccount,
  updateLastSyncDate
} = accountsModule;

export const {
  getAcelleCampaigns,
  fetchCampaignDetails,
  checkApiAccess,
  calculateDeliveryStats,
  extractCampaignsFromCache
} = campaignsModule;

export const {
  testAcelleConnection
} = connectionModule;

// Exporter aussi sous forme d'objet global
export const acelleService = {
  // Comptes
  getAcelleAccounts,
  getAcelleAccountById,
  createAcelleAccount,
  updateAcelleAccount,
  deleteAcelleAccount,
  updateLastSyncDate,
  
  // Campagnes
  getAcelleCampaigns,
  fetchCampaignDetails,
  checkApiAccess,
  calculateDeliveryStats,
  extractCampaignsFromCache,
  
  // Connexion
  testAcelleConnection,
  
  // Utilitaire
  buildProxyUrl
};
