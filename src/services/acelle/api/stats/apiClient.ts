
import { AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { buildProxyUrl, buildDirectApiUrl } from "../../acelle-service";

/**
 * Récupère les statistiques d'une campagne depuis l'API Acelle
 * Version améliorée et simplifiée qui utilise acelle-proxy directement
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
    
    console.log(`Récupération directe des statistiques pour la campagne ${campaignUid}`);
    
    // Utiliser directement acelle-proxy au lieu de cors-proxy
    const url = buildDirectApiUrl(
      `campaigns/${campaignUid}/statistics`,
      account.api_endpoint,
      { api_token: account.api_token }
    );
    
    // Obtenir le token d'authentification
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      console.error("Aucun token d'authentification disponible pour l'API");
      return null;
    }
    
    // Effectuer la requête avec les en-têtes appropriés
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-acelle-token': account.api_token,
        'x-acelle-endpoint': account.api_endpoint
      }
    });
    
    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Détails de l'erreur: ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data?.statistics) {
      console.log(`Statistiques récupérées avec succès pour la campagne ${campaignUid}`, data.statistics);
      
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

/**
 * Méthode de secours pour la compatibilité - utilise cors-proxy
 * @deprecated À utiliser uniquement si acelle-proxy ne fonctionne pas
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
    
    console.log(`Récupération des statistiques via le proxy legacy pour la campagne ${campaignUid}`);
    
    // Utiliser la méthode legacy avec cors-proxy
    const params = {
      api_token: account.api_token,
      _t: Date.now().toString() // Empêcher la mise en cache
    };
    
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
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques via legacy pour la campagne ${campaignUid}:`, error);
    return null;
  }
};

