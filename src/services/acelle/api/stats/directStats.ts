
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
 * Récupère les statistiques via Edge Functions avec fallbacks multiples
 */
export const fetchDirectStatistics = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  try {
    console.log(`[fetchDirectStatistics] Récupération pour ${campaignUid} via ${account.name}`);
    
    if (!campaignUid || !account?.id) {
      console.error("[fetchDirectStatistics] Paramètres manquants");
      return null;
    }
    
    // Méthode 1: Via acelle-proxy avec timeout réduit
    try {
      console.log(`[fetchDirectStatistics] Tentative via acelle-proxy pour ${campaignUid}`);
      
      const { data, error } = await supabase.functions.invoke('acelle-proxy', {
        body: { 
          endpoint: account.api_endpoint,
          api_token: account.api_token,
          action: 'get_campaign_stats',
          campaign_uid: campaignUid,
          timeout: 10000 // Très court timeout
        }
      });
      
      if (!error && data?.success && data.statistics) {
        console.log(`[fetchDirectStatistics] Succès via acelle-proxy pour ${campaignUid}`);
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
    
    // Méthode 2: Via acelle-stats-test (fallback)
    try {
      console.log(`[fetchDirectStatistics] Fallback via acelle-stats-test pour ${campaignUid}`);
      
      const { data, error } = await supabase.functions.invoke('acelle-stats-test', {
        body: { 
          campaignId: campaignUid, 
          accountId: account.id, 
          forceRefresh: 'true',
          timeout: 8000 // Timeout encore plus court
        }
      });
      
      if (!error && data?.success && data.stats) {
        console.log(`[fetchDirectStatistics] Succès via acelle-stats-test pour ${campaignUid}`);
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
    
    // Méthode 3: Fallback sur le cache local uniquement
    try {
      console.log(`[fetchDirectStatistics] Fallback cache pour ${campaignUid}`);
      
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
 * Enrichit les campagnes avec des statistiques - Version ultra-robuste
 */
export const enrichCampaignsWithStats = async (
  campaigns: AcelleCampaign[],
  account: AcelleAccount,
  options?: {
    forceRefresh?: boolean;
  }
): Promise<AcelleCampaign[]> => {
  if (!campaigns.length || !account) return campaigns;
  
  console.log(`[enrichCampaignsWithStats] Enrichissement de ${campaigns.length} campagnes pour ${account.name}`);
  
  const enrichedCampaigns: AcelleCampaign[] = [];
  
  // Traiter les campagnes une par une pour éviter la surcharge
  for (let i = 0; i < campaigns.length; i++) {
    const campaign = campaigns[i];
    
    try {
      const campaignUid = campaign.uid || campaign.campaign_uid || '';
      if (!campaignUid) {
        console.warn("[enrichCampaignsWithStats] Campaign sans UID:", campaign);
        enrichedCampaigns.push(campaign);
        continue;
      }
      
      // Vérifier si les statistiques sont vides dans delivery_info
      const hasEmptyDeliveryInfo = !campaign.delivery_info || 
        Object.keys(campaign.delivery_info).length === 0 ||
        (!campaign.delivery_info.subscriber_count && !campaign.delivery_info.delivered_count);
      
      // Forcer la récupération si les statistiques semblent vides ou si demandé
      const shouldFetchStats = options?.forceRefresh || 
        hasEmptyStatistics(campaign.statistics) || 
        hasEmptyDeliveryInfo;
      
      if (shouldFetchStats) {
        console.log(`[enrichCampaignsWithStats] Récupération stats manquantes pour ${campaign.name} (${campaignUid})`);
        
        // Récupérer les statistiques via Edge Functions
        const statistics = await fetchDirectStatistics(campaignUid, account);
        
        // Créer la campagne enrichie
        const enrichedCampaign = {
          ...campaign,
          statistics: statistics || campaign.statistics || createEmptyStatistics(),
          meta: {
            ...campaign.meta,
            data_source: statistics ? 'edge_function' : 'cache',
            last_refresh: new Date().toISOString(),
            has_stats: !!statistics
          }
        };
        
        enrichedCampaigns.push(enrichedCampaign);
        
        // Pause entre chaque campagne pour éviter la surcharge des APIs
        if (i < campaigns.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } else {
        console.log(`[enrichCampaignsWithStats] Statistiques déjà disponibles pour ${campaign.name}`);
        enrichedCampaigns.push(campaign);
      }
      
    } catch (error) {
      console.error(`[enrichCampaignsWithStats] Erreur pour campagne ${campaign.uid}:`, error);
      enrichedCampaigns.push({
        ...campaign,
        statistics: campaign.statistics || createEmptyStatistics()
      });
    }
  }
  
  console.log(`[enrichCampaignsWithStats] Enrichissement terminé: ${enrichedCampaigns.length}/${campaigns.length} campagnes pour ${account.name}`);
  return enrichedCampaigns;
};
