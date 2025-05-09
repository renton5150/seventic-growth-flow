
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount } from "@/types/acelle.types";
import { getAcelleAccounts, getAcelleAccountById, createAcelleAccount, updateAcelleAccount, deleteAcelleAccount } from "./api/accounts";
import { forceSyncCampaigns, getCampaigns } from "./api/campaigns";

/**
 * Service pour gérer les appels à l'API Acelle
 */
export const acelleService = {
  // Exporter les fonctions d'API
  accounts: {
    getAll: getAcelleAccounts,
    getById: getAcelleAccountById,
    create: createAcelleAccount,
    update: updateAcelleAccount,
    delete: deleteAcelleAccount
  },
  campaigns: {
    getAll: getCampaigns,
    forceSync: forceSyncCampaigns
  },
  
  /**
   * Génère des campagnes fictives pour le mode démo
   * @param count Nombre de campagnes à générer
   */
  generateMockCampaigns: (count: number = 5) => {
    return Array.from({ length: count }).map((_, index) => {
      const totalEmails = Math.floor(Math.random() * 1000) + 200;
      const deliveredRate = 0.97 + Math.random() * 0.02;
      const delivered = Math.floor(totalEmails * deliveredRate);
      const openRate = 0.3 + Math.random() * 0.4;
      const opened = Math.floor(delivered * openRate);
      const clickRate = 0.1 + Math.random() * 0.3;
      const clicked = Math.floor(opened * clickRate);
      const bounceCount = totalEmails - delivered;
      
      return {
        uid: `demo-${index}`,
        campaign_uid: `demo-${index}`,
        name: `Campagne démo ${index + 1}`,
        subject: `Sujet de la campagne ${index + 1}`,
        status: ["sent", "sending", "queued", "new", "paused", "failed"][Math.floor(Math.random() * 6)],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        delivery_date: new Date().toISOString(),
        run_at: null,
        last_error: null,
        statistics: {
          subscriber_count: totalEmails,
          delivered_count: delivered,
          delivered_rate: deliveredRate * 100,
          open_count: opened,
          uniq_open_count: opened * 0.9,
          uniq_open_rate: openRate * 100,
          click_count: clicked,
          click_rate: clickRate * 100,
          bounce_count: bounceCount,
          soft_bounce_count: Math.floor(bounceCount * 0.7),
          hard_bounce_count: Math.floor(bounceCount * 0.3),
          unsubscribe_count: Math.floor(delivered * 0.02),
          abuse_complaint_count: Math.floor(delivered * 0.005),
        },
        delivery_info: {
          total: totalEmails,
          delivered: delivered,
          delivery_rate: deliveredRate * 100,
          opened: opened,
          unique_open_rate: openRate * 100,
          clicked: clicked,
          click_rate: clickRate * 100,
          bounced: {
            total: bounceCount,
            soft: Math.floor(bounceCount * 0.7),
            hard: Math.floor(bounceCount * 0.3)
          },
          unsubscribed: Math.floor(delivered * 0.02),
          complained: Math.floor(delivered * 0.005)
        }
      };
    });
  }
};

/**
 * Construit l'URL pour le proxy CORS
 * Version simplifiée pour appeler directement l'API Acelle via acelle-proxy
 * @deprecated Utiliser buildDirectApiUrl pour les nouveaux appels API
 */
export const buildProxyUrl = (path: string, params: Record<string, string> = {}): string => {
  const baseProxyUrl = 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy';
  
  const apiPath = path.startsWith('/') ? path.substring(1) : path;
  
  let apiUrl = `https://emailing.plateforme-solution.net/api/v1/${apiPath}`;
  
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, value);
    }
    
    apiUrl += '?' + searchParams.toString();
  }
  
  const encodedApiUrl = encodeURIComponent(apiUrl);
  
  return `${baseProxyUrl}?url=${encodedApiUrl}`;
};

/**
 * Construit l'URL pour appeler directement l'API Acelle via acelle-proxy
 * Cette méthode est recommandée pour garantir une communication fiable
 */
export const buildDirectApiUrl = (
  path: string, 
  acelleEndpoint: string = 'https://emailing.plateforme-solution.net',
  params: Record<string, string> = {}
): string => {
  // Utiliser le proxy CORS directement pour une meilleure compatibilité
  const baseProxyUrl = 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy';
  
  // Nettoyer le chemin d'API
  const apiPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Construire l'URL complète de l'API Acelle
  const apiBase = acelleEndpoint.endsWith('/api/v1') 
    ? acelleEndpoint 
    : `${acelleEndpoint}/api/v1`;
    
  let apiUrl = `${apiBase}/${apiPath}`;
  
  // Construire les paramètres de requête pour l'API
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        searchParams.append(key, value);
      }
    }
    
    apiUrl += '?' + searchParams.toString();
  }
  
  // Ajouter un paramètre de timestamp pour éviter la mise en cache
  const timestamp = Date.now().toString();
  apiUrl += (apiUrl.includes('?') ? '&' : '?') + `_t=${timestamp}`;
  
  // Encoder l'URL de l'API pour la passer au proxy CORS
  const encodedApiUrl = encodeURIComponent(apiUrl);
  
  // Construire l'URL finale pour le proxy CORS
  return `${baseProxyUrl}?url=${encodedApiUrl}`;
};
