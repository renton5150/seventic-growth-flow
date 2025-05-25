
import { supabase } from "@/integrations/supabase/client";

/**
 * Appel sécurisé via Edge Function avec timeout client
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
        forceRefresh: forceRefresh.toString()
      }
    });
    
    if (error) {
      console.error(`[callViaEdgeFunction] Erreur edge function:`, error);
      throw error;
    }
    
    if (data && data.success) {
      console.log(`[callViaEdgeFunction] Succès pour ${campaignId}`);
      return data;
    } else {
      console.warn(`[callViaEdgeFunction] Échec pour ${campaignId}:`, data);
      return null;
    }
  } catch (error) {
    console.error(`[callViaEdgeFunction] Exception pour ${campaignId}:`, error);
    throw error;
  }
};

/**
 * Fallback vers le cache en cas d'échec des Edge Functions
 */
export const getCachedStatistics = async (campaignId: string, accountId: string) => {
  try {
    const { data, error } = await supabase
      .from('campaign_stats_cache')
      .select('statistics')
      .eq('campaign_uid', campaignId)
      .eq('account_id', accountId)
      .single();
    
    if (error) {
      console.warn(`[getCachedStatistics] Erreur cache pour ${campaignId}:`, error);
      return null;
    }
    
    return data?.statistics || null;
  } catch (error) {
    console.error(`[getCachedStatistics] Exception pour ${campaignId}:`, error);
    return null;
  }
};

/**
 * Construction d'URL API directe (pour référence uniquement, ne pas utiliser)
 */
export const buildDirectApiUrl = (path: string, endpoint: string, params: Record<string, string> = {}) => {
  let cleanEndpoint = endpoint.trim();
  if (cleanEndpoint.endsWith('/')) {
    cleanEndpoint = cleanEndpoint.slice(0, -1);
  }
  if (cleanEndpoint.endsWith('/api/v1')) {
    cleanEndpoint = cleanEndpoint.replace(/\/api\/v1$/, '');
  }
  
  const searchParams = new URLSearchParams(params);
  return `${cleanEndpoint}/api/v1/${path}?${searchParams.toString()}`;
};

/**
 * Construction d'URL proxy (pour compatibilité avec l'ancien code)
 */
export const buildProxyUrl = (action: string, params: Record<string, string> = {}) => {
  // Cette fonction est gardée pour compatibilité mais ne devrait plus être utilisée
  // Préférer l'utilisation des Edge Functions directement
  console.warn('[buildProxyUrl] Cette fonction est dépréciée, utiliser les Edge Functions à la place');
  return `/api/proxy?action=${action}&${new URLSearchParams(params).toString()}`;
};
