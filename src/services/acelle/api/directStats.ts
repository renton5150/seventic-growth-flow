
import { AcelleCampaign, AcelleAccount } from "@/types/acelle.types";
import { fetchAndProcessCampaignStats } from "./campaignStats";
import { createEmptyStatistics } from "./campaignStats";
import { buildCorsProxyUrl, buildCorsProxyHeaders } from "../cors-proxy";
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
      
      try {
        // Utiliser le proxy CORS
        const apiPath = `campaigns/${campaignUid}/overview`;
        const url = buildCorsProxyUrl(apiPath);
        
        console.log(`Appel via CORS proxy pour les statistiques de ${campaignUid}: ${url}`);
        
        // Obtenir le token d'authentification
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        if (!token) {
          throw new Error("Token d'authentification non disponible");
        }
        
        // Construire les en-têtes
        const headers = buildCorsProxyHeaders(account, {
          'Authorization': `Bearer ${token}`
        });
        
        // Effectuer la requête
        const response = await fetch(url, { headers });
        
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
          
          console.log(`Statistiques appliquées directement à la campagne ${campaign.name}`);
        } else {
          // Fallback à l'ancienne méthode en cas d'échec
          console.warn(`Pas de données reçues pour ${campaignUid}, tentative avec l'ancienne méthode...`);
          
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
        console.error(`Erreur API pour ${campaignUid}:`, apiError);
        
        // Fallback à l'ancienne méthode en cas d'erreur API
        console.warn(`Erreur API pour ${campaignUid}, tentative avec l'ancienne méthode...`);
        
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
    } catch (error) {
      console.error(`Erreur lors de l'enrichissement de la campagne ${enrichedCampaigns[i].name}:`, error);
      
      // Conserver les données existantes de la campagne
      console.log(`ERREUR: Impossible d'enrichir la campagne ${enrichedCampaigns[i].name}`);
    }
  }
  
  return enrichedCampaigns;
};
