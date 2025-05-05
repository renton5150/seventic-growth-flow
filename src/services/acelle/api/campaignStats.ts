
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics, CampaignStatsCache } from "@/types/acelle.types";
import { buildProxyUrl } from "../acelle-service";
import { supabase } from "@/integrations/supabase/client";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";

/**
 * Récupère et traite les statistiques d'une campagne
 */
export const fetchAndProcessCampaignStats = async (
  campaign: AcelleCampaign,
  account: AcelleAccount,
  options?: {
    refresh?: boolean;
    demoMode?: boolean;
  }
): Promise<{
  statistics: AcelleCampaignStatistics;
  delivery_info: any;
}> => {
  // Identifiant de la campagne
  const campaignUid = campaign.uid || campaign.campaign_uid;
  
  if (!campaignUid) {
    console.error("Aucun UID de campagne fourni pour la récupération des statistiques");
    return {
      statistics: createEmptyStatistics(),
      delivery_info: {}
    };
  }
  
  try {
    // Option mode démo
    if (options?.demoMode) {
      console.log(`Mode démo activé pour les stats de la campagne ${campaignUid}`);
      return generateDemoStats();
    }
    
    // Vérifier d'abord si les statistiques sont déjà dans le cache
    if (!options?.refresh) {
      const { data: cachedStats, error: cacheError } = await supabase
        .from('campaign_stats_cache')
        .select('*')
        .eq('campaign_uid', campaignUid)
        .single();
      
      if (!cacheError && cachedStats) {
        console.log(`Statistiques trouvées dans le cache pour ${campaignUid}`);
        
        try {
          // Convertir les données JSON en objets
          const statistics = typeof cachedStats.statistics === 'string' 
            ? JSON.parse(cachedStats.statistics) 
            : (cachedStats.statistics || {});
          
          // Handle delivery_info safely with type check
          let delivery_info = {};
          
          // Make sure cachedStats is not undefined and check if delivery_info exists
          if (cachedStats && typeof cachedStats === 'object' && cachedStats.delivery_info) {
            const rawDeliveryInfo = cachedStats.delivery_info;
            
            if (rawDeliveryInfo !== null && rawDeliveryInfo !== undefined) {
              delivery_info = typeof rawDeliveryInfo === 'string'
                ? JSON.parse(rawDeliveryInfo)
                : rawDeliveryInfo;
            }
          }
            
          return { 
            statistics: statistics as AcelleCampaignStatistics, 
            delivery_info 
          };
        } catch (parseError) {
          console.error(`Erreur lors de l'analyse des stats en cache:`, parseError);
        }
      }
    }
    
    // Si pas de refresh ou pas de cache, requête API
    console.log(`Récupération des statistiques depuis l'API pour ${campaignUid}`);
    
    // Vérification des informations du compte
    if (!account || !account.api_token || !account.api_endpoint) {
      console.error('Informations de compte incomplètes pour la récupération des stats');
      return { statistics: createEmptyStatistics(), delivery_info: {} };
    }
    
    // Récupérer les statistiques depuis l'API
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      console.error("Aucun token d'authentification disponible");
      return { statistics: createEmptyStatistics(), delivery_info: {} };
    }
    
    // Construire l'URL pour les statistiques
    const statsParams = { 
      api_token: account.api_token,
      _t: Date.now().toString()  // Anti-cache
    };
    
    // Créer l'URL pour les statistiques
    const statsUrl = buildProxyUrl(`campaigns/${campaignUid}/track`, statsParams);
    
    // Effectuer l'appel API
    const statsResponse = await fetch(statsUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!statsResponse.ok) {
      console.error(`Erreur API stats (${statsResponse.status}): ${statsResponse.statusText}`);
      return { statistics: createEmptyStatistics(), delivery_info: {} };
    }
    
    // Analyser la réponse
    const responseData = await statsResponse.json();
    
    console.log(`Statistiques récupérées pour ${campaignUid}:`, responseData);
    
    // Convertir et normaliser les statistiques
    const statistics: AcelleCampaignStatistics = {
      subscriber_count: responseData.data?.subscriber_count || responseData.data?.total || 0,
      delivered_count: responseData.data?.delivered_count || responseData.data?.delivered || 0,
      delivered_rate: responseData.data?.delivered_rate || 0,
      open_count: responseData.data?.open_count || responseData.data?.opened || 0,
      uniq_open_count: responseData.data?.uniq_open_count || 0,
      uniq_open_rate: responseData.data?.uniq_open_rate || responseData.data?.unique_open_rate || 0,
      click_count: responseData.data?.click_count || responseData.data?.clicked || 0,
      click_rate: responseData.data?.click_rate || 0,
      bounce_count: responseData.data?.bounce_count || 0,
      soft_bounce_count: responseData.data?.soft_bounce_count || 0,
      hard_bounce_count: responseData.data?.hard_bounce_count || 0,
      unsubscribe_count: responseData.data?.unsubscribe_count || 0,
      abuse_complaint_count: responseData.data?.abuse_complaint_count || 0,
    };
    
    // Créer un format unifié pour delivery_info
    const delivery_info = {
      total: statistics.subscriber_count,
      delivered: statistics.delivered_count,
      delivery_rate: statistics.delivered_rate,
      opened: statistics.open_count,
      unique_open_rate: statistics.uniq_open_rate,
      clicked: statistics.click_count,
      click_rate: statistics.click_rate,
      bounced: statistics.bounce_count
    };
    
    // Mettre en cache les statistiques pour une utilisation ultérieure
    try {
      await supabase
        .from('campaign_stats_cache')
        .upsert({
          campaign_uid: campaignUid,
          account_id: account.id,
          statistics: statistics as any,
          delivery_info: delivery_info as any,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'account_id,campaign_uid'
        });
      
      console.log(`Statistiques mises en cache pour ${campaignUid}`);
    } catch (cacheError) {
      console.error(`Erreur lors de la mise en cache des statistiques:`, cacheError);
    }
    
    return { statistics, delivery_info };
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour ${campaignUid}:`, error);
    
    // En cas d'erreur, essayer d'utiliser les statistiques existantes de la campagne
    if (campaign.statistics) {
      return {
        statistics: campaign.statistics,
        delivery_info: campaign.delivery_info || {}
      };
    }
    
    return {
      statistics: createEmptyStatistics(),
      delivery_info: {}
    };
  }
};

/**
 * Fonction utilitaire pour générer des statistiques de démonstration
 */
const generateDemoStats = () => {
  const subscriberCount = Math.floor(Math.random() * 10000) + 500;
  const deliveredCount = subscriberCount - Math.floor(subscriberCount * 0.05);
  const openRate = Math.random() * 0.7;
  const clickRate = Math.random() * 0.3;
  
  const statistics: AcelleCampaignStatistics = {
    subscriber_count: subscriberCount,
    delivered_count: deliveredCount,
    delivered_rate: deliveredCount / subscriberCount,
    open_count: Math.floor(deliveredCount * openRate),
    uniq_open_count: Math.floor(deliveredCount * openRate * 0.8),
    uniq_open_rate: openRate,
    click_count: Math.floor(deliveredCount * clickRate),
    click_rate: clickRate,
    bounce_count: Math.floor(subscriberCount * 0.05),
    soft_bounce_count: Math.floor(subscriberCount * 0.03),
    hard_bounce_count: Math.floor(subscriberCount * 0.02),
    unsubscribe_count: Math.floor(subscriberCount * 0.01),
    abuse_complaint_count: Math.floor(subscriberCount * 0.002)
  };
  
  const delivery_info = {
    total: subscriberCount,
    delivered: deliveredCount,
    delivery_rate: deliveredCount / subscriberCount,
    opened: statistics.open_count,
    unique_open_rate: statistics.uniq_open_rate,
    clicked: statistics.click_count,
    click_rate: statistics.click_rate,
    bounced: statistics.bounce_count
  };
  
  return { statistics, delivery_info };
};
