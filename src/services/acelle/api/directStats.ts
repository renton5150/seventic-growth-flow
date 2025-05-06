
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { buildCorsProxyUrl, buildCorsProxyHeaders, wakeupCorsProxy } from "../cors-proxy";
import { supabase } from "@/integrations/supabase/client";

/**
 * Enrichit une liste de campagnes avec leurs statistiques
 * Cette version utilise des requêtes directes pour récupérer les statistiques
 * plutôt que de passer par un autre service
 */
export async function enrichCampaignsWithStats(
  campaigns: AcelleCampaign[],
  account: AcelleAccount,
  options?: {
    forceRefresh?: boolean;
  }
): Promise<AcelleCampaign[]> {
  try {
    if (!campaigns || campaigns.length === 0) {
      console.log("Aucune campagne à enrichir avec des statistiques");
      return [];
    }
    
    console.log(`Enrichissement de ${campaigns.length} campagnes avec des statistiques...`);
    const enrichedCampaigns = [...campaigns];

    // Récupérer les statistiques pour chaque campagne
    for (let i = 0; i < enrichedCampaigns.length; i++) {
      const campaign = enrichedCampaigns[i];
      
      // Si la campagne n'est pas envoyée ou est en cours d'envoi, pas besoin de statistiques
      if (campaign.status === 'new' || campaign.status === 'queued' || campaign.status === 'sending') {
        campaign.statistics = createEmptyStatistics();
        continue;
      }
      
      // Essayer de récupérer les statistiques depuis le cache d'abord
      if (!options?.forceRefresh) {
        const cachedStats = await getCachedCampaignStats(campaign.uid);
        if (cachedStats) {
          campaign.statistics = cachedStats;
          continue;
        }
      }
      
      // Sinon récupérer depuis l'API
      try {
        const stats = await fetchCampaignStatsFromApi(campaign.uid, account);
        campaign.statistics = stats;
        
        // Mettre à jour le cache
        await updateCampaignStatsCache(campaign.uid, stats);
      } catch (error) {
        console.error(`Erreur lors de la récupération des statistiques pour la campagne ${campaign.uid}:`, error);
        campaign.statistics = createEmptyStatistics();
      }
    }

    return enrichedCampaigns;
  } catch (error) {
    console.error("Erreur lors de l'enrichissement des campagnes:", error);
    return campaigns; // Retourner les campagnes sans statistiques en cas d'erreur
  }
}

/**
 * Récupère les statistiques d'une campagne depuis l'API
 */
async function fetchCampaignStatsFromApi(
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics> {
  try {
    // Construire l'URL de l'API
    const apiPath = `/api/v1/campaigns/${campaignUid}/statistics`;
    const url = buildCorsProxyUrl(apiPath);
    
    console.log(`Récupération des statistiques depuis l'API via CORS proxy: ${url}`);
    
    // Obtenez le token d'authentification
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      throw new Error("Token d'authentification non disponible");
    }
    
    // Construire les en-têtes pour la requête
    const headers = buildCorsProxyHeaders(account, {
      'Authorization': `Bearer ${token}`
    });
    
    // Effectuer la requête
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${response.status} ${response.statusText}`);
    }
    
    const statsData = await response.json();
    
    // Convertir les données en AcelleCampaignStatistics
    return parseStatisticsData(statsData);
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    throw error;
  }
}

/**
 * Récupère les statistiques d'une campagne depuis le cache
 */
async function getCachedCampaignStats(campaignUid: string): Promise<AcelleCampaignStatistics | null> {
  try {
    const { data, error } = await supabase
      .from('email_campaigns_stats_cache')
      .select('statistics')
      .eq('campaign_uid', campaignUid)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    const statsData = data.statistics;
    if (!statsData) {
      return null;
    }
    
    // S'assurer que les statistiques sont au bon format
    if (typeof statsData === 'string') {
      try {
        return JSON.parse(statsData) as AcelleCampaignStatistics;
      } catch (e) {
        console.error("Erreur lors de l'analyse des statistiques en cache:", e);
        return null;
      }
    }
    
    return statsData as AcelleCampaignStatistics;
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques depuis le cache:", error);
    return null;
  }
}

/**
 * Met à jour le cache des statistiques d'une campagne
 */
async function updateCampaignStatsCache(
  campaignUid: string,
  statistics: AcelleCampaignStatistics
): Promise<void> {
  try {
    await supabase
      .from('email_campaigns_stats_cache')
      .upsert({
        campaign_uid: campaignUid,
        statistics,
        cache_updated_at: new Date().toISOString()
      }, {
        onConflict: 'campaign_uid'
      });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du cache des statistiques:", error);
  }
}

/**
 * Parse les données de statistiques depuis l'API
 */
function parseStatisticsData(statsData: any): AcelleCampaignStatistics {
  if (!statsData) {
    return createEmptyStatistics();
  }

  // Créer un objet de statistiques avec des valeurs par défaut
  const stats: AcelleCampaignStatistics = createEmptyStatistics();
  
  // Essayer de remplir avec les données de l'API
  try {
    if (typeof statsData === 'object') {
      stats.subscriber_count = statsData.subscriber_count || 0;
      stats.delivered_count = statsData.delivered_count || 0;
      stats.open_count = statsData.open_count || 0;
      stats.click_count = statsData.click_count || 0;
      
      stats.bounce_count = statsData.bounce_count || 0;
      stats.hard_bounce_count = statsData.hard_bounce_count || 0;
      stats.soft_bounce_count = statsData.soft_bounce_count || 0;
      
      stats.delivered_rate = statsData.delivered_rate || 0;
      stats.uniq_open_rate = statsData.uniq_open_rate || 0;
      stats.click_rate = statsData.click_rate || 0;
      stats.unsubscribe_count = statsData.unsubscribe_count || 0;
      stats.abuse_complaint_count = statsData.abuse_complaint_count || 0;
      stats.open_rate = statsData.open_rate || 0;
    }
  } catch (e) {
    console.error("Erreur lors de l'analyse des statistiques:", e);
  }
  
  return stats;
}

/**
 * Crée un objet de statistiques vide
 */
export function createEmptyStatistics(): AcelleCampaignStatistics {
  return {
    subscriber_count: 0,
    delivered_count: 0,
    delivered_rate: 0,
    open_count: 0,
    open_rate: 0,
    uniq_open_rate: 0,
    click_count: 0,
    click_rate: 0,
    bounce_count: 0,
    soft_bounce_count: 0,
    hard_bounce_count: 0,
    unsubscribe_count: 0,
    abuse_complaint_count: 0
  };
}
