
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
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
    // Vérifier d'abord si les statistiques sont déjà dans le cache
    if (!options?.refresh) {
      const { data: cachedStats, error: cacheError } = await supabase
        .from('email_campaigns_cache')
        .select('delivery_info')
        .eq('campaign_uid', campaignUid)
        .single();
      
      if (!cacheError && cachedStats && cachedStats.delivery_info) {
        console.log(`Statistiques trouvées dans le cache pour ${campaignUid}`);
        
        try {
          // Type checking et normalisation
          let delivery_info: Record<string, any> = {};
          
          if (cachedStats.delivery_info !== null) {
            // Parse delivery_info if it's a string, otherwise use as is if it's an object
            delivery_info = typeof cachedStats.delivery_info === 'string'
              ? JSON.parse(cachedStats.delivery_info)
              : cachedStats.delivery_info;
              
            // Make sure delivery_info is an object
            if (typeof delivery_info !== 'object' || delivery_info === null) {
              delivery_info = {};
            }
              
            // Calculer les statistiques de base avec des valeurs par défaut si les propriétés n'existent pas
            const statistics: AcelleCampaignStatistics = {
              subscriber_count: delivery_info.total || 0,
              delivered_count: delivery_info.delivered || 0,
              delivered_rate: delivery_info.delivery_rate || 0,
              open_count: delivery_info.opened || 0,
              uniq_open_rate: delivery_info.unique_open_rate || 0,
              click_count: delivery_info.clicked || 0,
              click_rate: delivery_info.click_rate || 0,
              bounce_count: typeof delivery_info.bounced === 'number' ? delivery_info.bounced : 0,
              soft_bounce_count: 0,
              hard_bounce_count: 0,
              unsubscribe_count: delivery_info.unsubscribed || 0,
              abuse_complaint_count: delivery_info.complained || 0
            };
            
            return { statistics, delivery_info };
          }
        } catch (parseError) {
          console.error(`Erreur lors de l'analyse des stats en cache:`, parseError);
        }
      }
    }
    
    // Si pas de cache ou refresh demandé, récupérer depuis l'API
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
    
    if (!responseData || !responseData.data) {
      console.error('Format de réponse API inattendu:', responseData);
      return { statistics: createEmptyStatistics(), delivery_info: {} };
    }
    
    console.log(`Statistiques récupérées pour ${campaignUid}:`, responseData);
    
    // Ensure data is an object
    const apiData = responseData.data || {};
    
    // Convertir et normaliser les statistiques
    const statistics: AcelleCampaignStatistics = {
      subscriber_count: apiData.subscriber_count || apiData.total || 0,
      delivered_count: apiData.delivered_count || apiData.delivered || 0,
      delivered_rate: apiData.delivered_rate || 0,
      open_count: apiData.open_count || apiData.opened || 0,
      uniq_open_count: apiData.uniq_open_count || 0,
      uniq_open_rate: apiData.uniq_open_rate || apiData.unique_open_rate || 0,
      click_count: apiData.click_count || apiData.clicked || 0,
      click_rate: apiData.click_rate || 0,
      bounce_count: apiData.bounce_count || 0,
      soft_bounce_count: apiData.soft_bounce_count || 0,
      hard_bounce_count: apiData.hard_bounce_count || 0,
      unsubscribe_count: apiData.unsubscribe_count || 0,
      abuse_complaint_count: apiData.abuse_complaint_count || 0,
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
        .from('email_campaigns_cache')
        .update({
          delivery_info: delivery_info as any,
        })
        .eq('campaign_uid', campaignUid)
        .eq('account_id', account.id);
      
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
