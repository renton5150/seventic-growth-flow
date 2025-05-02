
import * as accountsModule from './api/accounts';
import * as campaignsModule from './api/campaigns';
import * as connectionModule from './api/connection';
import { AcelleCampaign } from '@/types/acelle.types';

// Définir la configuration du proxy Acelle
export const ACELLE_PROXY_CONFIG = {
  BASE_URL: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy',
  ACELLE_API_URL: 'https://emailing.plateforme-solution.net/api/v1',
  ACELLE_TOKEN: 'E7yCMWfRiDD1Gd4ycEAk4g0iQrCJFLgLIARgJ56KtBfKpXuQVkSep0OTacWB' // Token par défaut
};

// Construire l'URL du proxy avec les paramètres
export const buildProxyUrl = (path: string, params: Record<string, string> = {}): string => {
  try {
    // Déterminer l'URL de base du proxy
    const baseProxyUrl = ACELLE_PROXY_CONFIG.BASE_URL;
    
    // Déterminer si nous utilisons le nouveau format de chemin direct
    // ou l'ancien format avec paramètre url
    if (path.startsWith('/')) {
      // Nouveau format: /cors-proxy/campaigns/123/stats
      const apiPath = path.substring(1); // Supprimer le premier slash
      return `${baseProxyUrl}/${apiPath}`;
    } else {
      // Ancien format avec paramètre URL
      // Construire l'URL Acelle complète avec tous les paramètres
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
    }
  } catch (error) {
    console.error("Error building proxy URL:", error);
    // Return a fallback URL that will show as invalid but won't crash
    return ACELLE_PROXY_CONFIG.BASE_URL + "?error=true";
  }
};

// Fonction pour appeler l'API Acelle avec authentification
export async function callAcelleApi(
  path: string, 
  params: Record<string, string> = {}, 
  accessToken?: string
): Promise<any> {
  try {
    const proxyUrl = buildProxyUrl(path, params);
    console.log(`Making authenticated API call to: ${proxyUrl}`);
    
    // Préparer les en-têtes avec l'authentification
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      // Utiliser le format d'en-tête standardisé pour Acelle
      'X-Acelle-Token': accessToken || ACELLE_PROXY_CONFIG.ACELLE_TOKEN,
      'X-Acelle-Endpoint': ACELLE_PROXY_CONFIG.ACELLE_API_URL,
      // Ajouter l'en-tête d'autorisation pour s'assurer qu'il est transmis
      'Authorization': `Bearer ${accessToken || ACELLE_PROXY_CONFIG.ACELLE_TOKEN}`
    };
    
    // Définir un timeout pour la requête
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    try {
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error(`API error ${response.status}:`, responseText);
        throw new Error(`API request failed with status ${response.status}: ${responseText.substring(0, 100)}`);
      }
      
      // Essayer d'analyser la réponse comme JSON
      const responseText = await response.text();
      console.log(`API response received (${responseText.length} chars)`);
      
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse API response as JSON:", parseError);
        console.log("Response excerpt:", responseText.substring(0, 200));
        throw new Error("Invalid JSON response from API");
      }
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.error("API request timed out");
        throw new Error("API request timed out after 30 seconds");
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Error calling Acelle API:", error);
    throw error;
  }
}

// Fonction pour générer des campagnes fictives pour la démonstration
export function generateMockCampaigns(count: number = 5): AcelleCampaign[] {
  const statuses = ['new', 'queued', 'sending', 'sent', 'paused', 'failed'];
  const now = new Date();
  
  return Array.from({ length: count }).map((_, index) => {
    const campaignId = `mock-${index + 1}`;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdDate = new Date(now);
    createdDate.setDate(now.getDate() - (index + 5));
    
    const runDate = new Date(createdDate);
    runDate.setDate(createdDate.getDate() + 2);
    
    // Créer des métriques réalistes
    const totalSubscribers = 100 * (index + 1);
    const deliveredRate = 0.95 - (Math.random() * 0.1);
    const delivered = Math.floor(totalSubscribers * deliveredRate);
    const openRate = 0.4 - (Math.random() * 0.2);
    const opens = Math.floor(delivered * openRate);
    const clickRate = 0.2 - (Math.random() * 0.1);
    const clicks = Math.floor(opens * clickRate);
    const bounceRate = 0.05 + (Math.random() * 0.05);
    const bounces = Math.floor(totalSubscribers * bounceRate);
    const unsubscribeRate = 0.01 + (Math.random() * 0.02);
    const unsubscribes = Math.floor(delivered * unsubscribeRate);
    
    return {
      uid: campaignId,
      campaign_uid: campaignId,
      name: `Campagne Exemple ${index + 1}`,
      subject: `Sujet de test ${index + 1}`,
      status: status,
      created_at: createdDate.toISOString(),
      updated_at: now.toISOString(),
      delivery_date: runDate.toISOString(),
      run_at: runDate.toISOString(),
      last_error: status === 'failed' ? 'Erreur de démonstration' : '',
      statistics: {
        subscriber_count: totalSubscribers,
        delivered_count: delivered,
        delivered_rate: deliveredRate * 100,
        open_count: opens,
        uniq_open_rate: openRate * 100,
        click_count: clicks,
        click_rate: clickRate * 100,
        bounce_count: bounces,
        soft_bounce_count: Math.floor(bounces * 0.7),
        hard_bounce_count: Math.floor(bounces * 0.3),
        unsubscribe_count: unsubscribes,
        abuse_complaint_count: Math.floor(unsubscribes * 0.1)
      },
      delivery_info: {
        total: totalSubscribers,
        delivered: delivered,
        delivery_rate: deliveredRate * 100,
        opened: opens,
        unique_open_rate: openRate * 100,
        clicked: clicks,
        click_rate: clickRate * 100,
        bounced: {
          soft: Math.floor(bounces * 0.7),
          hard: Math.floor(bounces * 0.3),
          total: bounces
        },
        unsubscribed: unsubscribes,
        complained: Math.floor(unsubscribes * 0.1)
      }
    };
  });
}

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
  buildProxyUrl,
  generateMockCampaigns,
  callAcelleApi
};
