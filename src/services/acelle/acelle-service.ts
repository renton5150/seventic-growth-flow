
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount } from "@/types/acelle.types";
import { getAcelleAccounts, getAcelleAccountById, createAcelleAccount, updateAcelleAccount, deleteAcelleAccount } from "./api/accounts";
import { forceSyncCampaigns, getCampaigns } from "./api/campaigns";

/**
 * Service pour gérer les appels à l'API Acelle avec priorisation des edge functions
 */
export const acelleService = {
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
 * Construction d'URL simplifiée et robuste pour l'API Acelle
 * Cette version évite toute duplication et problème de construction
 */
export const buildCleanAcelleApiUrl = (
  path: string, 
  endpoint: string = 'https://emailing.plateforme-solution.net',
  params: Record<string, string> = {}
): string => {
  console.log(`[buildCleanAcelleApiUrl] Construction pour path: ${path}, endpoint: ${endpoint}`);
  
  // Nettoyer l'endpoint - supprimer /api/v1 s'il existe
  let cleanEndpoint = endpoint.replace(/\/api\/v1\/?$/, '');
  
  // Nettoyer le path - supprimer les slashes en début
  const cleanPath = path.replace(/^\/+/, '');
  
  // Construire l'URL complète
  const baseUrl = `${cleanEndpoint}/api/v1/${cleanPath}`;
  
  // Ajouter les paramètres si nécessaires
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    
    const finalUrl = `${baseUrl}?${searchParams.toString()}`;
    console.log(`[buildCleanAcelleApiUrl] URL finale: ${finalUrl.replace(params.api_token || '', '***')}`);
    return finalUrl;
  }
  
  console.log(`[buildCleanAcelleApiUrl] URL finale: ${baseUrl}`);
  return baseUrl;
};

/**
 * Appel API via Edge Function (méthode recommandée)
 */
export const callViaEdgeFunction = async (
  campaignId: string,
  accountId: string,
  forceRefresh: boolean = false
) => {
  try {
    console.log(`[callViaEdgeFunction] Appel pour campagne ${campaignId} via edge function`);
    
    const { data, error } = await supabase.functions.invoke('acelle-stats-test', {
      body: { 
        campaignId, 
        accountId, 
        forceRefresh: forceRefresh.toString(),
        debug: 'false'
      }
    });
    
    if (error) {
      console.error('[callViaEdgeFunction] Erreur edge function:', error);
      throw error;
    }
    
    console.log(`[callViaEdgeFunction] Succès pour ${campaignId}:`, data);
    return data;
  } catch (error) {
    console.error(`[callViaEdgeFunction] Exception pour ${campaignId}:`, error);
    throw error;
  }
};

/**
 * Appel API direct simplifié (fallback uniquement)
 */
export const callDirectAcelleApi = async (
  url: string,
  options: {
    timeout?: number;
  } = {}
) => {
  const { timeout = 10000 } = options;
  
  console.log(`[callDirectAcelleApi] Appel direct: ${url.replace(/api_token=[^&]+/, 'api_token=***')}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`[callDirectAcelleApi] HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[callDirectAcelleApi] Succès:`, typeof data);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[callDirectAcelleApi] Erreur:`, error);
    throw error;
  }
};

// Fonctions legacy pour compatibilité
export const buildProxyUrl = buildCleanAcelleApiUrl;
export const buildDirectAcelleApiUrl = buildCleanAcelleApiUrl;
export const buildDirectApiUrl = buildCleanAcelleApiUrl;
