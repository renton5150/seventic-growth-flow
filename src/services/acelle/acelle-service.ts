
import * as accountsModule from './api/accounts';
import * as campaignsModule from './api/campaigns';
import * as connectionModule from './api/connection';

// Construire l'URL du proxy avec les paramètres
export const buildProxyUrl = (path: string, params: Record<string, string> = {}): string => {
  // Déterminer l'URL de base du proxy
  const baseProxyUrl = 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy';
  
  // Construire l'URL Acelle complète avec tous les paramètres
  // Note: l'API Acelle finit généralement par /api/v1/
  const apiPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Créer l'URL de l'API avec les paramètres
  let apiUrl = `https://emailing.plateforme-solution.net/api/v1/${apiPath}`;
  
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

// Exporter toutes les fonctions de chaque module sous le namespace apropprié
export const acelleService = {
  // Comptes
  getAcelleAccounts: accountsModule.getAcelleAccounts,
  getAcelleAccount: accountsModule.getAcelleAccount,
  createAcelleAccount: accountsModule.createAcelleAccount,
  updateAcelleAccount: accountsModule.updateAcelleAccount,
  deleteAcelleAccount: accountsModule.deleteAcelleAccount,
  updateLastSyncDate: accountsModule.updateLastSyncDate,
  
  // Campagnes
  getAcelleCampaigns: campaignsModule.getAcelleCampaigns,
  fetchCampaignDetails: campaignsModule.fetchCampaignDetails,
  checkApiAccess: campaignsModule.checkApiAccess,
  calculateDeliveryStats: campaignsModule.calculateDeliveryStats,
  extractCampaignsFromCache: campaignsModule.extractCampaignsFromCache,
  
  // Connexion
  testConnection: connectionModule.testConnection,
  
  // Utilitaire
  buildProxyUrl
};
