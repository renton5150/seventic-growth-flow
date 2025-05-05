
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
    console.log(`[Stats] Début récupération stats pour campagne ${campaignUid}`);
    
    // Vérifier d'abord si les statistiques sont déjà dans le cache
    if (!options?.refresh) {
      console.log(`[Stats] Vérification du cache pour campagne ${campaignUid}...`);
      
      // Essayer d'abord campaign_stats_cache (table spécifique aux statistiques)
      const { data: cachedStatsData, error: cacheStatsError } = await supabase
        .from('campaign_stats_cache')
        .select('statistics, last_updated')
        .eq('campaign_uid', campaignUid)
        .single();
      
      console.log(`[Stats] Résultat cache stats:`, 
        cachedStatsData ? "Données trouvées" : "Cache stats vide", 
        cacheStatsError ? `Erreur: ${cacheStatsError.message}` : "Pas d'erreur");
      
      if (!cacheStatsError && cachedStatsData && cachedStatsData.statistics) {
        // Vérifier la fraîcheur du cache
        const lastUpdated = new Date(cachedStatsData.last_updated);
        const now = new Date();
        const cacheAgeHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
        
        if (cacheAgeHours < 24) {
          console.log(`[Stats] Utilisation du cache stats pour ${campaignUid}, âge: ${cacheAgeHours.toFixed(2)}h`);
          
          // Extraire les statistiques du cache (gérer string ou objet)
          const statistics = typeof cachedStatsData.statistics === 'string' 
            ? JSON.parse(cachedStatsData.statistics) 
            : cachedStatsData.statistics;
          
          return {
            statistics: statistics,
            delivery_info: {
              total: statistics.subscriber_count || 0,
              delivered: statistics.delivered_count || 0,
              delivery_rate: statistics.delivered_rate || 0,
              opened: statistics.open_count || statistics.unique_open_count || 0,
              unique_open_rate: statistics.uniq_open_rate || 0,
              clicked: statistics.click_count || 0,
              click_rate: statistics.click_rate || 0,
              bounced: statistics.bounce_count || 0,
              unsubscribed: statistics.unsubscribe_count || 0,
              complained: statistics.abuse_complaint_count || 0
            }
          };
        } else {
          console.log(`[Stats] Cache expiré pour ${campaignUid}, âge: ${cacheAgeHours.toFixed(2)}h > 24h`);
        }
      }
      
      // Fallback sur email_campaigns_cache si aucune donnée dans campaign_stats_cache
      console.log(`[Stats] Vérification du cache email_campaigns_cache pour ${campaignUid}...`);
      const { data: cachedCampaign, error: cacheCampaignError } = await supabase
        .from('email_campaigns_cache')
        .select('delivery_info, cache_updated_at')
        .eq('campaign_uid', campaignUid)
        .single();
      
      console.log(`[Stats] Résultat cache campaigns:`, 
        cachedCampaign ? "Données trouvées" : "Cache campaigns vide", 
        cacheCampaignError ? `Erreur: ${cacheCampaignError.message}` : "Pas d'erreur");
      
      if (!cacheCampaignError && cachedCampaign && cachedCampaign.delivery_info) {
        // Vérifier la fraîcheur du cache
        const lastUpdated = new Date(cachedCampaign.cache_updated_at || new Date());
        const now = new Date();
        const cacheAgeHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
        
        if (cacheAgeHours < 24) {
          console.log(`[Stats] Utilisation du cache campaigns pour ${campaignUid}, âge: ${cacheAgeHours.toFixed(2)}h`);
          
          try {
            // Parse delivery_info if it's a string, otherwise use as is if it's an object
            const delivery_info = typeof cachedCampaign.delivery_info === 'string'
              ? JSON.parse(cachedCampaign.delivery_info)
              : cachedCampaign.delivery_info || {};
            
            // Ensure delivery_info is an object and has the required properties
            if (typeof delivery_info === 'object' && delivery_info !== null) {
              // Calculer les statistiques à partir de delivery_info
              const statistics: AcelleCampaignStatistics = {
                subscriber_count: delivery_info.total || 0,
                delivered_count: delivery_info.delivered || 0,
                delivered_rate: delivery_info.delivery_rate || 0,
                open_count: delivery_info.opened || 0,
                uniq_open_count: delivery_info.opened || 0,
                uniq_open_rate: delivery_info.unique_open_rate || 0,
                click_count: delivery_info.clicked || 0,
                click_rate: delivery_info.click_rate || 0,
                bounce_count: typeof delivery_info.bounced === 'object' ? 
                  (delivery_info.bounced?.total || 0) : 
                  (typeof delivery_info.bounced === 'number' ? delivery_info.bounced : 0),
                soft_bounce_count: typeof delivery_info.bounced === 'object' ? 
                  (delivery_info.bounced?.soft || 0) : 0,
                hard_bounce_count: typeof delivery_info.bounced === 'object' ? 
                  (delivery_info.bounced?.hard || 0) : 0,
                unsubscribe_count: delivery_info.unsubscribed || 0,
                abuse_complaint_count: delivery_info.complained || 0
              };
              
              return { statistics, delivery_info };
            }
          } catch (parseError) {
            console.error(`[Stats] Erreur lors de l'analyse des stats en cache:`, parseError);
          }
        } else {
          console.log(`[Stats] Cache campaigns expiré pour ${campaignUid}, âge: ${cacheAgeHours.toFixed(2)}h > 24h`);
        }
      }
    } else {
      console.log(`[Stats] Rafraîchissement forcé pour campagne ${campaignUid}`);
    }
    
    // Si pas de cache ou refresh demandé, récupérer depuis l'API
    console.log(`[Stats] Appel API pour campagne ${campaignUid}`);
    
    // Vérification des informations du compte
    if (!account || !account.api_token || !account.api_endpoint) {
      console.error('[Stats] Informations de compte incomplètes pour la récupération des stats');
      return { statistics: createEmptyStatistics(), delivery_info: {} };
    }
    
    // Récupérer les statistiques depuis l'API
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      console.error("[Stats] Aucun token d'authentification disponible");
      return { statistics: createEmptyStatistics(), delivery_info: {} };
    }
    
    // IMPORTANT : Utiliser l'endpoint /campaigns/{uid} comme recommandé
    const apiEndpoint = `campaigns/${campaignUid}`;
    
    // Construire l'URL pour les statistiques
    const statsParams = { 
      api_token: account.api_token,
      _t: Date.now().toString()  // Anti-cache
    };
    
    // Créer l'URL pour les statistiques
    const statsUrl = buildProxyUrl(apiEndpoint, statsParams);
    
    console.log(`[Stats] Requête API statistiques: ${statsUrl}`);
    
    // Effectuer l'appel API
    const statsResponse = await fetch(statsUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`[Stats] Réponse API: Status ${statsResponse.status}`);
    
    if (!statsResponse.ok) {
      console.error(`[Stats] Erreur API (${statsResponse.status}): ${statsResponse.statusText}`);
      return { statistics: createEmptyStatistics(), delivery_info: {} };
    }
    
    // Analyser la réponse
    const responseData = await statsResponse.json();
    
    if (!responseData) {
      console.error('[Stats] Format de réponse API inattendu:', responseData);
      return { statistics: createEmptyStatistics(), delivery_info: {} };
    }
    
    console.log(`[Stats] Données reçues pour ${campaignUid}:`, responseData);
    
    // Structure de réponse attendue : { campaign: {...}, statistics: {...} }
    const apiStats = responseData.statistics || responseData.data || {};
    
    if (!apiStats || Object.keys(apiStats).length === 0) {
      console.error('[Stats] Aucune statistique trouvée dans la réponse API:', responseData);
      return { statistics: createEmptyStatistics(), delivery_info: {} };
    }
    
    // Convertir et normaliser les statistiques
    const statistics: AcelleCampaignStatistics = {
      subscriber_count: apiStats.subscriber_count || 0,
      delivered_count: apiStats.delivered_count || 0,
      delivered_rate: apiStats.delivered_rate || 0,
      open_count: apiStats.open_count || apiStats.unique_open_count || 0,
      uniq_open_count: apiStats.uniq_open_count || apiStats.unique_open_count || 0,
      uniq_open_rate: apiStats.uniq_open_rate || apiStats.unique_open_rate || 0,
      click_count: apiStats.click_count || 0,
      click_rate: apiStats.click_rate || 0,
      bounce_count: apiStats.bounce_count || 0,
      soft_bounce_count: apiStats.soft_bounce_count || 0,
      hard_bounce_count: apiStats.hard_bounce_count || 0,
      unsubscribe_count: apiStats.unsubscribe_count || 0,
      abuse_complaint_count: apiStats.abuse_complaint_count || 0,
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
      bounced: {
        total: statistics.bounce_count,
        soft: statistics.soft_bounce_count,
        hard: statistics.hard_bounce_count
      },
      unsubscribed: statistics.unsubscribe_count,
      complained: statistics.abuse_complaint_count
    };
    
    // Mettre à jour le cache dans campaign_stats_cache
    try {
      console.log(`[Stats] Mise à jour du cache campaign_stats_cache pour ${campaignUid}`);
      
      const { error: statsUpsertError } = await supabase
        .from('campaign_stats_cache')
        .upsert({
          campaign_uid: campaignUid,
          account_id: account.id,
          statistics: statistics,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'campaign_uid,account_id'
        });
      
      if (statsUpsertError) {
        console.error(`[Stats] Erreur lors de la mise à jour de campaign_stats_cache:`, statsUpsertError);
      } else {
        console.log(`[Stats] Mise à jour de campaign_stats_cache réussie pour ${campaignUid}`);
      }
    } catch (cacheStatsError) {
      console.error(`[Stats] Exception lors de la mise à jour de campaign_stats_cache:`, cacheStatsError);
    }
    
    // Mettre en cache les statistiques dans email_campaigns_cache pour une utilisation ultérieure
    try {
      console.log(`[Stats] Mise à jour du cache email_campaigns_cache pour ${campaignUid}`);
      
      const { error: campaignUpsertError } = await supabase
        .from('email_campaigns_cache')
        .update({
          delivery_info: delivery_info,
          cache_updated_at: new Date().toISOString()
        })
        .eq('campaign_uid', campaignUid)
        .eq('account_id', account.id);
      
      if (campaignUpsertError) {
        console.error(`[Stats] Erreur lors de la mise à jour de email_campaigns_cache:`, campaignUpsertError);
      } else {
        console.log(`[Stats] Mise à jour de email_campaigns_cache réussie pour ${campaignUid}`);
      }
    } catch (cacheCampaignError) {
      console.error(`[Stats] Exception lors de la mise à jour de email_campaigns_cache:`, cacheCampaignError);
    }
    
    return { statistics, delivery_info };
  } catch (error) {
    console.error(`[Stats] Erreur lors de la récupération des statistiques pour ${campaignUid}:`, error);
    
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
 * Teste l'insertion d'une statistique dans le cache pour vérification
 */
export const testCacheInsertion = async (
  account: AcelleAccount
): Promise<boolean> => {
  try {
    console.log(`[Stats] Test d'insertion dans le cache pour compte ${account.name}`);
    
    const testData = {
      campaign_uid: "test-campaign-uid",
      account_id: account.id,
      statistics: {
        subscriber_count: 100,
        delivered_count: 80,
        delivered_rate: 0.8,
        open_count: 40,
        uniq_open_count: 35,
        uniq_open_rate: 0.35,
        click_count: 20,
        click_rate: 0.2,
        bounce_count: 5,
        soft_bounce_count: 3,
        hard_bounce_count: 2,
        unsubscribe_count: 2,
        abuse_complaint_count: 0
      },
      last_updated: new Date().toISOString()
    };
    
    const { error: insertError } = await supabase
      .from('campaign_stats_cache')
      .upsert(testData);
    
    if (insertError) {
      console.error(`[Stats] Erreur lors du test d'insertion:`, insertError);
      return false;
    }
    
    console.log(`[Stats] Test d'insertion réussi`);
    return true;
  } catch (error) {
    console.error(`[Stats] Exception lors du test d'insertion:`, error);
    return false;
  }
};
