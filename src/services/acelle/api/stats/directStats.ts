
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { ensureValidStatistics } from "./validation";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";
import { saveCampaignStatistics } from "./cacheManager";
import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie si les statistiques sont vides ou non initialisées
 */
export const hasEmptyStatistics = (statistics?: AcelleCampaignStatistics | null): boolean => {
  if (!statistics) return true;
  
  const hasNonZeroValue = 
    statistics.subscriber_count > 0 || 
    statistics.delivered_count > 0 ||
    statistics.open_count > 0 ||
    statistics.click_count > 0 ||
    statistics.bounce_count > 0;
  
  return !hasNonZeroValue;
};

/**
 * Récupère les statistiques via Edge Functions uniquement
 */
export const fetchDirectStatistics = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  try {
    console.log(`[fetchDirectStatistics] Récupération pour ${campaignUid}`);
    
    if (!campaignUid || !account?.id) {
      console.error("[fetchDirectStatistics] Paramètres manquants");
      return null;
    }
    
    // Méthode 1: Via acelle-stats-test (prioritaire)
    try {
      console.log(`[fetchDirectStatistics] Tentative via acelle-stats-test`);
      
      const { data, error } = await supabase.functions.invoke('acelle-stats-test', {
        body: { 
          campaignId: campaignUid, 
          accountId: account.id, 
          forceRefresh: 'true'
        }
      });
      
      if (!error && data?.success && data.stats) {
        console.log(`[fetchDirectStatistics] Succès via acelle-stats-test`);
        const validStats = ensureValidStatistics(data.stats as Partial<AcelleCampaignStatistics>);
        
        // Sauvegarder en cache (sans bloquer)
        saveCampaignStatistics(campaignUid, account.id, validStats).catch(err => {
          console.warn("[fetchDirectStatistics] Erreur cache:", err);
        });
        
        return validStats;
      }
      
      if (error) {
        console.warn(`[fetchDirectStatistics] Erreur acelle-stats-test:`, error);
      }
    } catch (edgeError) {
      console.warn(`[fetchDirectStatistics] acelle-stats-test échouée:`, edgeError);
    }
    
    // Méthode 2: Via acelle-proxy (fallback Edge Function)
    try {
      console.log(`[fetchDirectStatistics] Tentative via acelle-proxy`);
      
      const { data, error } = await supabase.functions.invoke('acelle-proxy', {
        body: { 
          endpoint: account.api_endpoint,
          api_token: account.api_token,
          action: 'get_campaign_stats',
          campaign_uid: campaignUid
        }
      });
      
      if (!error && data?.success && data.statistics) {
        console.log(`[fetchDirectStatistics] Succès via acelle-proxy`);
        const validStats = ensureValidStatistics(data.statistics as Partial<AcelleCampaignStatistics>);
        
        // Sauvegarder en cache (sans bloquer)
        saveCampaignStatistics(campaignUid, account.id, validStats).catch(err => {
          console.warn("[fetchDirectStatistics] Erreur cache:", err);
        });
        
        return validStats;
      }
      
      if (error) {
        console.warn(`[fetchDirectStatistics] Erreur acelle-proxy:`, error);
      }
    } catch (proxyError) {
      console.warn(`[fetchDirectStatistics] acelle-proxy échouée:`, proxyError);
    }
    
    // Méthode 3: Fallback sur le cache local uniquement
    try {
      console.log(`[fetchDirectStatistics] Tentative de récupération depuis le cache`);
      
      const { data: cachedStats } = await supabase
        .from('campaign_stats_cache')
        .select('statistics')
        .eq('campaign_uid', campaignUid)
        .eq('account_id', account.id)
        .maybeSingle();
      
      if (cachedStats?.statistics && typeof cachedStats.statistics === 'object') {
        console.log(`[fetchDirectStatistics] Statistiques trouvées en cache pour ${campaignUid}`);
        return ensureValidStatistics(cachedStats.statistics as Partial<AcelleCampaignStatistics>);
      }
    } catch (cacheError) {
      console.warn(`[fetchDirectStatistics] Erreur cache:`, cacheError);
    }
    
    console.warn(`[fetchDirectStatistics] Toutes les méthodes ont échoué pour ${campaignUid}`);
    return null;
  } catch (error) {
    console.error(`[fetchDirectStatistics] Erreur générale:`, error);
    return null;
  }
};

/**
 * Enrichit les campagnes avec des statistiques via Edge Functions uniquement
 */
export const enrichCampaignsWithStats = async (
  campaigns: AcelleCampaign[],
  account: AcelleAccount,
  options?: {
    forceRefresh?: boolean;
  }
): Promise<AcelleCampaign[]> => {
  if (!campaigns.length || !account) return campaigns;
  
  console.log(`[enrichCampaignsWithStats] Enrichissement de ${campaigns.length} campagnes`);
  
  const enrichedCampaigns: AcelleCampaign[] = [];
  
  for (const campaign of campaigns) {
    try {
      const campaignUid = campaign.uid || campaign.campaign_uid || '';
      if (!campaignUid) {
        console.warn("[enrichCampaignsWithStats] Campaign sans UID:", campaign);
        enrichedCampaigns.push(campaign);
        continue;
      }
      
      // Si les statistiques semblent déjà complètes et qu'on ne force pas le rafraîchissement
      if (!options?.forceRefresh && 
          campaign.statistics && 
          !hasEmptyStatistics(campaign.statistics)) {
        console.log(`[enrichCampaignsWithStats] Statistiques déjà disponibles pour ${campaign.name}`);
        enrichedCampaigns.push(campaign);
        continue;
      }
      
      console.log(`[enrichCampaignsWithStats] Récupération stats pour ${campaignUid}`);
      
      // Récupérer les statistiques via Edge Functions uniquement
      const statistics = await fetchDirectStatistics(campaignUid, account);
      
      // Créer la campagne enrichie
      const enrichedCampaign = {
        ...campaign,
        statistics: statistics || campaign.statistics || createEmptyStatistics(),
        meta: {
          ...campaign.meta,
          data_source: statistics ? 'edge_function' : 'cache',
          last_refresh: new Date().toISOString()
        }
      };
      
      enrichedCampaigns.push(enrichedCampaign);
      
    } catch (error) {
      console.error(`[enrichCampaignsWithStats] Erreur pour campagne ${campaign.uid}:`, error);
      enrichedCampaigns.push({
        ...campaign,
        statistics: campaign.statistics || createEmptyStatistics()
      });
    }
  }
  
  return enrichedCampaigns;
};
