
import { AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { buildProxyUrl } from "../../acelle-service";

/**
 * Récupère les statistiques d'une campagne depuis l'API Acelle
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
    
    console.log(`Fetching statistics from API for campaign ${campaignUid}`);
    
    // Construire l'URL pour la requête API
    const params = {
      api_token: account.api_token,
      _t: Date.now().toString() // Empêcher la mise en cache
    };
    
    // Utiliser le proxy pour éviter les problèmes CORS
    const url = buildProxyUrl(`campaigns/${campaignUid}/statistics`, params);
    
    // Obtenir le token d'authentification
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      console.error("Aucun token d'authentification disponible pour l'API");
      return null;
    }
    
    // Effectuer la requête
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data?.statistics) {
      // Convertir les statistiques en format attendu
      return {
        subscriber_count: Number(data.statistics.subscriber_count) || 0,
        delivered_count: Number(data.statistics.delivered_count) || 0,
        delivered_rate: Number(data.statistics.delivered_rate) || 0,
        open_count: Number(data.statistics.open_count) || 0,
        uniq_open_count: Number(data.statistics.uniq_open_count) || 0,
        uniq_open_rate: Number(data.statistics.uniq_open_rate) || 0,
        click_count: Number(data.statistics.click_count) || 0,
        click_rate: Number(data.statistics.click_rate) || 0,
        bounce_count: Number(data.statistics.bounce_count) || 0,
        soft_bounce_count: Number(data.statistics.soft_bounce_count) || 0,
        hard_bounce_count: Number(data.statistics.hard_bounce_count) || 0,
        unsubscribe_count: Number(data.statistics.unsubscribe_count) || 0,
        abuse_complaint_count: Number(data.statistics.abuse_complaint_count) || 0
      };
    }
    
    console.log("Aucune statistique trouvée dans la réponse de l'API");
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour la campagne ${campaignUid}:`, error);
    return null;
  }
};
