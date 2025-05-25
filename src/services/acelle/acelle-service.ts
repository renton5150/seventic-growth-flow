
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount } from "@/types/acelle.types";
import { getAcelleAccounts, getAcelleAccountById, createAcelleAccount, updateAcelleAccount, deleteAcelleAccount } from "./api/accounts";
import { forceSyncCampaigns, getCampaigns } from "./api/campaigns";

/**
 * Service pour gérer les appels à l'API Acelle via Edge Functions uniquement
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
  }
};

/**
 * Construction d'URL simplifiée pour Edge Functions
 */
export const buildCleanAcelleApiUrl = (
  path: string, 
  endpoint: string = 'https://emailing.plateforme-solution.net',
  params: Record<string, string> = {}
): string => {
  console.log(`[buildCleanAcelleApiUrl] Construction pour Edge Function: ${path}`);
  
  // Nettoyer l'endpoint
  let cleanEndpoint = endpoint.replace(/\/api\/v1\/?$/, '');
  
  // Nettoyer le path
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
    console.log(`[buildCleanAcelleApiUrl] URL Edge Function: ${finalUrl.replace(params.api_token || '', '***')}`);
    return finalUrl;
  }
  
  console.log(`[buildCleanAcelleApiUrl] URL Edge Function: ${baseUrl}`);
  return baseUrl;
};

/**
 * Appel API via Edge Function uniquement
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

// Fonctions legacy pour compatibilité - toutes redirigent vers les Edge Functions
export const buildProxyUrl = buildCleanAcelleApiUrl;
export const buildDirectAcelleApiUrl = buildCleanAcelleApiUrl;
export const buildDirectApiUrl = buildCleanAcelleApiUrl;

/**
 * Appel API direct DÉSACTIVÉ - utilise Edge Function à la place
 */
export const callDirectAcelleApi = async (url: string, options: any = {}) => {
  console.warn(`[callDirectAcelleApi] DÉSACTIVÉ - Redirection vers Edge Function pour: ${url.replace(/api_token=[^&]+/, 'api_token=***')}`);
  throw new Error("Appels directs désactivés - utilisez les Edge Functions");
};
