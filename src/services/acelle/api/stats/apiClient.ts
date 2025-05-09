
import { AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { buildProxyUrl, buildDirectApiUrl } from "../../acelle-service";

/**
 * Récupère les statistiques d'une campagne depuis l'API Acelle
 * Version améliorée qui utilise directement l'endpoint principal de la campagne
 */
export const fetchCampaignStatisticsFromApi = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  try {
    if (!campaignUid || !account?.api_token || !account?.api_endpoint) {
      console.error("Informations manquantes pour récupérer les statistiques:", {
        hasCampaignUid: !!campaignUid,
        hasApiToken: !!account?.api_token,
        hasApiEndpoint: !!account?.api_endpoint
      });
      return null;
    }
    
    console.log(`Récupération directe des informations pour la campagne ${campaignUid}`);
    
    // Utiliser directement l'endpoint principal de la campagne
    const url = `${account.api_endpoint}/public/api/v1/campaigns/${campaignUid}?api_token=${account.api_token}`;
    
    // Effectuer la requête directe à l'API Acelle
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Détails de l'erreur: ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Les statistiques sont disponibles sous data.campaign.statistics
    if (data?.campaign?.statistics) {
      console.log(`Statistiques récupérées avec succès pour la campagne ${campaignUid}`, data.campaign.statistics);
      
      // Convertir les statistiques en format attendu
      return {
        subscriber_count: Number(data.campaign.statistics.subscriber_count) || 0,
        delivered_count: Number(data.campaign.statistics.delivered_count) || 0,
        delivered_rate: Number(data.campaign.statistics.delivered_rate) || 0,
        open_count: Number(data.campaign.statistics.open_count) || 0,
        uniq_open_count: Number(data.campaign.statistics.uniq_open_count) || 0,
        uniq_open_rate: Number(data.campaign.statistics.uniq_open_rate) || 0,
        click_count: Number(data.campaign.statistics.click_count) || 0,
        click_rate: Number(data.campaign.statistics.click_rate) || 0,
        bounce_count: Number(data.campaign.statistics.bounce_count) || 0,
        soft_bounce_count: Number(data.campaign.statistics.soft_bounce_count) || 0,
        hard_bounce_count: Number(data.campaign.statistics.hard_bounce_count) || 0,
        unsubscribe_count: Number(data.campaign.statistics.unsubscribe_count) || 0,
        abuse_complaint_count: Number(data.campaign.statistics.abuse_complaint_count) || 0
      };
    }
    
    console.log("Aucune statistique trouvée dans la réponse de l'API");
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour la campagne ${campaignUid}:`, error);
    return null;
  }
};

/**
 * Méthode de secours pour la compatibilité - appel direct à l'API
 */
export const fetchCampaignStatisticsLegacy = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  try {
    if (!campaignUid || !account?.api_token || !account?.api_endpoint) {
      console.error("Informations manquantes pour récupérer les statistiques");
      return null;
    }
    
    console.log(`Récupération des informations via méthode legacy pour la campagne ${campaignUid}`);
    
    // Utiliser directement l'API sans passer par le proxy
    const url = `${account.api_endpoint}/public/api/v1/campaigns/${campaignUid}?api_token=${account.api_token}`;
    
    // Effectuer la requête
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Extraire les statistiques de la campagne
    if (data?.campaign?.statistics) {
      return {
        subscriber_count: Number(data.campaign.statistics.subscriber_count) || 0,
        delivered_count: Number(data.campaign.statistics.delivered_count) || 0,
        delivered_rate: Number(data.campaign.statistics.delivered_rate) || 0,
        open_count: Number(data.campaign.statistics.open_count) || 0,
        uniq_open_count: Number(data.campaign.statistics.uniq_open_count) || 0,
        uniq_open_rate: Number(data.campaign.statistics.uniq_open_rate) || 0,
        click_count: Number(data.campaign.statistics.click_count) || 0,
        click_rate: Number(data.campaign.statistics.click_rate) || 0,
        bounce_count: Number(data.campaign.statistics.bounce_count) || 0,
        soft_bounce_count: Number(data.campaign.statistics.soft_bounce_count) || 0,
        hard_bounce_count: Number(data.campaign.statistics.hard_bounce_count) || 0,
        unsubscribe_count: Number(data.campaign.statistics.unsubscribe_count) || 0,
        abuse_complaint_count: Number(data.campaign.statistics.abuse_complaint_count) || 0
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques via legacy pour la campagne ${campaignUid}:`, error);
    return null;
  }
};
