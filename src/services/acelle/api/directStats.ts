
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { fetchAndProcessCampaignStats } from "./campaignStats";
import { createEmptyStatistics } from "./campaignStats";
import { buildCorsProxyUrl, buildCorsProxyHeaders, wakeupCorsProxy } from "../cors-proxy";
import { supabase } from "@/integrations/supabase/client";

/**
 * Enrichit les campagnes avec des statistiques directement depuis l'API Acelle
 */
export const enrichCampaignsWithStats = async (
  campaigns: AcelleCampaign[], 
  account: AcelleAccount,
  options?: { 
    forceRefresh?: boolean;
  }
): Promise<AcelleCampaign[]> => {
  console.log(`Enrichissement de ${campaigns.length} campagnes avec des statistiques...`);
  
  // Vérification des informations du compte
  if (!account || !account.api_token || !account.api_endpoint) {
    console.error("Impossible d'enrichir les campagnes: informations de compte incomplètes", {
      hasAccount: !!account,
      hasToken: account ? !!account.api_token : false,
      hasEndpoint: account ? !!account.api_endpoint : false
    });
    return campaigns;
  }
  
  // Obtenir le token d'authentification pour les appels API
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  
  if (!token) {
    console.error("Token d'authentification non disponible");
    return campaigns;
  }
  
  // Réveiller le proxy CORS au début pour éviter les problèmes de timeout
  try {
    await wakeupCorsProxy(token);
  } catch (error) {
    console.warn("Échec du réveil du proxy CORS, tentative de continuer:", error);
  }
  
  const enrichedCampaigns = [...campaigns];
  
  for (let i = 0; i < enrichedCampaigns.length; i++) {
    try {
      const campaign = enrichedCampaigns[i];
      const campaignUid = campaign.uid || campaign.campaign_uid;
      
      if (!campaignUid) {
        console.error(`Campagne sans UID valide: ${campaign.name}`);
        continue;
      }
      
      // Si les statistiques semblent déjà complètes et qu'on ne force pas le rafraîchissement, on saute
      if (!options?.forceRefresh && 
          campaign.delivery_info && 
          typeof campaign.delivery_info === 'object' &&
          campaign.delivery_info.total && 
          campaign.delivery_info.delivered) {
        console.log(`Statistiques déjà disponibles pour la campagne ${campaign.name}, aucun enrichissement nécessaire`);
        continue;
      }
      
      console.log(`Récupération des statistiques pour la campagne ${campaign.name}`, {
        endpoint: account.api_endpoint,
        campaignUid
      });
      
      // Vérifier d'abord si on a des statistiques en cache
      const { data: cachedStats, error: cacheError } = await supabase
        .from('campaign_stats_cache')
        .select('statistics, last_updated')
        .eq('campaign_uid', campaignUid)
        .single();
      
      // Si nous avons des statistiques en cache et qu'on ne force pas le rafraîchissement
      if (!cacheError && cachedStats && !options?.forceRefresh) {
        console.log(`Utilisation des statistiques en cache pour ${campaignUid}, dernière mise à jour: ${cachedStats.last_updated}`);
        
        // Appliquer les statistiques depuis le cache
        const cachedStatsData = cachedStats.statistics as any;
        
        // S'assurer que les données sont valides
        if (typeof cachedStatsData === 'object') {
          enrichedCampaigns[i] = {
            ...campaign,
            statistics: {
              subscriber_count: cachedStatsData.subscriber_count || 0,
              delivered_count: cachedStatsData.delivered_count || 0,
              delivered_rate: cachedStatsData.delivered_rate || 0,
              open_count: cachedStatsData.open_count || 0,
              uniq_open_rate: cachedStatsData.uniq_open_rate || 0,
              click_count: cachedStatsData.click_count || 0,
              click_rate: cachedStatsData.click_rate || 0,
              bounce_count: cachedStatsData.bounce_count || 0,
              soft_bounce_count: cachedStatsData.soft_bounce_count || 0,
              hard_bounce_count: cachedStatsData.hard_bounce_count || 0,
              unsubscribe_count: cachedStatsData.unsubscribe_count || 0,
              abuse_complaint_count: cachedStatsData.abuse_complaint_count || 0
            },
            delivery_info: {
              total: cachedStatsData.subscriber_count || 0,
              delivered: cachedStatsData.delivered_count || 0,
              opened: cachedStatsData.open_count || 0,
              clicked: cachedStatsData.click_count || 0,
              bounced: {
                total: cachedStatsData.bounce_count || 0,
                hard: cachedStatsData.hard_bounce_count || 0,
                soft: cachedStatsData.soft_bounce_count || 0
              },
              delivery_rate: cachedStatsData.delivered_rate || 0,
              unique_open_rate: cachedStatsData.uniq_open_rate || 0,
              click_rate: cachedStatsData.click_rate || 0,
              unsubscribed: cachedStatsData.unsubscribe_count || 0,
              complained: cachedStatsData.abuse_complaint_count || 0
            }
          };
          
          continue;
        }
      }
      
      try {
        // Utiliser le proxy CORS pour obtenir les statistiques de la campagne
        const apiPath = `campaigns/${campaignUid}/overview`;
        const url = buildCorsProxyUrl(apiPath);
        
        console.log(`Appel via CORS proxy pour les statistiques de ${campaignUid}: ${url}`);
        
        // Construire les en-têtes avec le token Supabase pour l'authentification
        const headers = buildCorsProxyHeaders(account, {
          'Authorization': `Bearer ${token}`
        });
        
        // Effectuer la requête avec un timeout étendu
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes timeout
        
        const response = await fetch(url, { 
          headers, 
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Erreur API lors de la récupération des stats: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        if (responseData && responseData.data) {
          console.log(`Statistiques reçues pour ${campaignUid}:`, responseData.data);
          
          const statsData = responseData.data;
          
          // Structurer les statistiques selon le format attendu
          const statistics = {
            subscriber_count: statsData.subscribers_count || 0,
            delivered_count: statsData.recipients_count || 0,
            delivered_rate: statsData.delivery_rate ? statsData.delivery_rate / 100 : 0,
            open_count: statsData.unique_opens_count || 0,
            open_rate: statsData.unique_opens_rate ? statsData.unique_opens_rate / 100 : 0,
            uniq_open_rate: statsData.unique_opens_rate ? statsData.unique_opens_rate / 100 : 0,
            uniq_open_count: statsData.unique_opens_count || 0,
            click_count: statsData.unique_clicks_count || 0,
            click_rate: statsData.clicks_rate ? statsData.clicks_rate / 100 : 0,
            bounce_count: (statsData.bounce_count || 0),
            soft_bounce_count: (statsData.soft_bounce_count || 0),
            hard_bounce_count: (statsData.hard_bounce_count || 0),
            unsubscribe_count: (statsData.unsubscribe_count || 0),
            abuse_complaint_count: (statsData.feedback_count || 0)
          };
          
          // Structurer les delivery_info
          const delivery_info = {
            total: statsData.subscribers_count || 0,
            delivered: statsData.recipients_count || 0,
            opened: statsData.unique_opens_count || 0,
            clicked: statsData.unique_clicks_count || 0,
            bounced: {
              total: (statsData.bounce_count || 0),
              hard: (statsData.hard_bounce_count || 0),
              soft: (statsData.soft_bounce_count || 0)
            },
            delivery_rate: statsData.delivery_rate ? statsData.delivery_rate / 100 : 0,
            unique_open_rate: statsData.unique_opens_rate ? statsData.unique_opens_rate / 100 : 0,
            click_rate: statsData.clicks_rate ? statsData.clicks_rate / 100 : 0,
            unsubscribed: (statsData.unsubscribe_count || 0),
            complained: (statsData.feedback_count || 0)
          };
          
          // Appliquer les statistiques directement
          enrichedCampaigns[i] = {
            ...campaign,
            statistics: statistics,
            delivery_info: delivery_info
          };
          
          // Mettre à jour le cache des statistiques
          await supabase
            .from('campaign_stats_cache')
            .upsert({
              campaign_uid: campaignUid,
              account_id: account.id,
              statistics: statistics,
              last_updated: new Date().toISOString()
            }, {
              onConflict: 'campaign_uid'
            });
          
          console.log(`Statistiques appliquées directement à la campagne ${campaign.name}`);
        } else {
          // Fallback à l'ancienne méthode en cas d'échec
          console.warn(`Pas de données reçues pour ${campaignUid}, tentative avec l'ancienne méthode...`);
          
          // Vérifier si on a déjà des statistiques dans l'objet campaign
          if (campaign.statistics || campaign.delivery_info) {
            console.info(`Tentative de récupération de statistiques alternatives pour ${campaignUid}`);
            console.info(`Utilisation des statistiques existantes dans la campagne pour ${campaignUid}`);
            
            // Si on a déjà des statistiques dans l'objet campaign, les utiliser
            continue;
          }
          
          // Sinon, essayer avec l'ancienne méthode
          const result = await fetchAndProcessCampaignStats(
            campaign, 
            account, 
            { refresh: true }
          );
          
          // Appliquer les statistiques enrichies à la campagne
          enrichedCampaigns[i] = {
            ...campaign,
            statistics: result.statistics || createEmptyStatistics(),
            delivery_info: result.delivery_info || {}
          };
        }
      } catch (apiError) {
        console.error(`Erreur lors de l'appel à l'API Acelle:`, apiError);
        
        // Vérifier si on a déjà des statistiques dans l'objet campaign
        if (campaign.statistics || campaign.delivery_info) {
          console.info(`Tentative de récupération de statistiques alternatives pour ${campaignUid}`);
          console.info(`Utilisation des statistiques existantes dans la campagne pour ${campaignUid}`);
          continue;
        }
        
        // Fallback à l'ancienne méthode en cas d'erreur API
        console.warn(`Erreur API pour ${campaignUid}, tentative avec l'ancienne méthode...`);
        
        try {
          const result = await fetchAndProcessCampaignStats(
            campaign, 
            account, 
            { refresh: true }
          );
          
          // Appliquer les statistiques enrichies à la campagne
          enrichedCampaigns[i] = {
            ...campaign,
            statistics: result.statistics || createEmptyStatistics(),
            delivery_info: result.delivery_info || {}
          };
        } catch (processError) {
          console.error(`Erreur lors du traitement des statistiques pour ${campaignUid}:`, processError);
        }
      }
    } catch (campaignError) {
      console.error(`Erreur lors du traitement de la campagne ${enrichedCampaigns[i]?.name}:`, campaignError);
    }
  }
  
  return enrichedCampaigns;
};
