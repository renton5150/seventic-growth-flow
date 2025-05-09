
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
    
    // Utiliser directement l'endpoint principal de la campagne (pas /statistics)
    const url = buildDirectApiUrl(
      `campaigns/${campaignUid}`,
      account.api_endpoint,
      { api_token: account.api_token }
    );
    
    // Obtenir le token d'authentification
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    // Effectuer la requête avec les en-têtes appropriés
    console.log(`Appel API à ${url}`);
    console.time(`API_Call_${campaignUid}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-acelle-token': account.api_token,
        'x-acelle-endpoint': account.api_endpoint,
        'Authorization': `Bearer ${account.api_token}` // Ajouter l'en-tête d'autorisation
      }
    });
    
    console.timeEnd(`API_Call_${campaignUid}`);
    
    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Détails de l'erreur: ${errorText}`);
      return null;
    }
    
    const responseData = await response.json();
    console.log(`Données brutes reçues pour ${campaignUid}:`, responseData);
    
    // Si la réponse est encapsulée dans une propriété "data"
    const data = responseData.data ? responseData.data : responseData;
    
    // Les statistiques sont disponibles sous different chemins selon l'API
    let campaignData = data;
    if (data.campaign) {
      campaignData = data.campaign;
    }
    
    if (campaignData?.statistics) {
      console.log(`Statistiques récupérées avec succès pour la campagne ${campaignUid}`, campaignData.statistics);
      
      // Convertir les statistiques en format attendu
      const stats = campaignData.statistics;
      return {
        subscriber_count: Number(stats.subscriber_count) || 0,
        delivered_count: Number(stats.delivered_count) || 0,
        delivered_rate: Number(stats.delivered_rate) || 0,
        open_count: Number(stats.open_count) || 0,
        uniq_open_count: Number(stats.uniq_open_count) || 0,
        uniq_open_rate: Number(stats.uniq_open_rate) || 0,
        click_count: Number(stats.click_count) || 0,
        click_rate: Number(stats.click_rate) || 0,
        bounce_count: Number(stats.bounce_count) || 0,
        soft_bounce_count: Number(stats.soft_bounce_count) || 0,
        hard_bounce_count: Number(stats.hard_bounce_count) || 0,
        unsubscribe_count: Number(stats.unsubscribe_count) || 0,
        abuse_complaint_count: Number(stats.abuse_complaint_count) || 0
      };
    } else if (campaignData?.delivery_info || campaignData?.delivery_stats) {
      // Fallback: utiliser les infos de livraison si statistiques non disponibles
      const deliveryInfo = campaignData.delivery_info || campaignData.delivery_stats;
      console.log(`Statistiques non trouvées, utilisation des infos de livraison pour ${campaignUid}`, deliveryInfo);
      
      return {
        subscriber_count: Number(deliveryInfo.total || deliveryInfo.subscriber_count) || 0,
        delivered_count: Number(deliveryInfo.delivered || deliveryInfo.delivered_count) || 0,
        delivered_rate: Number(deliveryInfo.delivery_rate || deliveryInfo.delivered_rate) || 0,
        open_count: Number(deliveryInfo.opened || deliveryInfo.open_count) || 0,
        uniq_open_count: Number(deliveryInfo.unique_opened || deliveryInfo.uniq_open_count) || 0,
        uniq_open_rate: Number(deliveryInfo.unique_open_rate || deliveryInfo.open_rate) || 0,
        click_count: Number(deliveryInfo.clicked || deliveryInfo.click_count) || 0,
        click_rate: Number(deliveryInfo.click_rate) || 0,
        bounce_count: Number(
          typeof deliveryInfo.bounced === 'object'
            ? deliveryInfo.bounced.total
            : deliveryInfo.bounced || deliveryInfo.bounce_count
        ) || 0,
        soft_bounce_count: Number(
          typeof deliveryInfo.bounced === 'object'
            ? deliveryInfo.bounced.soft
            : deliveryInfo.soft_bounce_count
        ) || 0,
        hard_bounce_count: Number(
          typeof deliveryInfo.bounced === 'object'
            ? deliveryInfo.bounced.hard
            : deliveryInfo.hard_bounce_count
        ) || 0,
        unsubscribe_count: Number(deliveryInfo.unsubscribed || deliveryInfo.unsubscribe_count) || 0,
        abuse_complaint_count: Number(deliveryInfo.complained || deliveryInfo.abuse_complaint_count) || 0
      };
    } else {
      // Essayer de récupérer directement de la racine
      console.log(`Aucune statistique structurée trouvée, tentative d'extraction directe pour ${campaignUid}`);
      
      return {
        subscriber_count: Number(campaignData.subscriber_count) || 0,
        delivered_count: Number(campaignData.delivered_count) || 0,
        delivered_rate: Number(campaignData.delivered_rate) || 0,
        open_count: Number(campaignData.open_count) || 0,
        uniq_open_count: Number(campaignData.uniq_open_count) || 0,
        uniq_open_rate: Number(campaignData.uniq_open_rate || campaignData.open_rate) || 0,
        click_count: Number(campaignData.click_count) || 0,
        click_rate: Number(campaignData.click_rate) || 0,
        bounce_count: Number(campaignData.bounce_count) || 0,
        soft_bounce_count: Number(campaignData.soft_bounce_count) || 0,
        hard_bounce_count: Number(campaignData.hard_bounce_count) || 0,
        unsubscribe_count: Number(campaignData.unsubscribe_count) || 0,
        abuse_complaint_count: Number(campaignData.abuse_complaint_count) || 0
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
    
    console.log(`Récupération des informations via le proxy legacy pour la campagne ${campaignUid}`);
    
    // Utiliser la méthode legacy avec cors-proxy, mais cibler l'endpoint principal
    const params = {
      api_token: account.api_token,
      _t: Date.now().toString() // Empêcher la mise en cache
    };
    
    // Cibler l'endpoint principal campaigns/{uid}
    const url = buildProxyUrl(`campaigns/${campaignUid}`, params);
    
    console.log(`Appel API Legacy à ${url}`);
    console.time(`API_Legacy_Call_${campaignUid}`);
    
    // Obtenir le token d'authentification
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    // Effectuer la requête
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'x-acelle-token': account.api_token,
        'x-acelle-endpoint': account.api_endpoint,
        'Authorization': `Bearer ${account.api_token}`
      }
    });
    
    console.timeEnd(`API_Legacy_Call_${campaignUid}`);
    
    if (!response.ok) {
      console.error(`Erreur API Legacy: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Détails de l'erreur Legacy: ${errorText}`);
      return null;
    }
    
    const responseData = await response.json();
    console.log(`Données legacy reçues pour ${campaignUid}:`, responseData);
    
    // Extraire les données réelles (peuvent être encapsulées dans data)
    const data = responseData.data ? responseData.data : responseData;
    
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
    } else if (data?.statistics) {
      // Traitez le cas où les statistiques sont directement dans la racine
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
    } else if (data?.delivery_info) {
      const delivery = data.delivery_info;
      // Fallback sur delivery_info si aucune statistique n'est disponible
      return {
        subscriber_count: Number(delivery.total) || 0,
        delivered_count: Number(delivery.delivered) || 0,
        delivered_rate: Number(delivery.delivery_rate) || 0,
        open_count: Number(delivery.opened) || 0,
        uniq_open_count: Number(delivery.unique_opened || delivery.opened) || 0,
        uniq_open_rate: Number(delivery.unique_open_rate) || 0,
        click_count: Number(delivery.clicked) || 0,
        click_rate: Number(delivery.click_rate) || 0,
        bounce_count: typeof delivery.bounced === 'object' ? Number(delivery.bounced.total) : Number(delivery.bounced) || 0,
        soft_bounce_count: typeof delivery.bounced === 'object' ? Number(delivery.bounced.soft) : 0,
        hard_bounce_count: typeof delivery.bounced === 'object' ? Number(delivery.bounced.hard) : 0,
        unsubscribe_count: Number(delivery.unsubscribed) || 0,
        abuse_complaint_count: Number(delivery.complained) || 0
      };
    }
    
    // Si aucune statistique n'est trouvée, essayer de récupérer directement des données de la campagne
    if (data?.subscriber_count || data?.open_rate) {
      return {
        subscriber_count: Number(data.subscriber_count) || 0,
        delivered_count: Number(data.delivered_count) || 0,
        delivered_rate: Number(data.delivered_rate) || 0,
        open_count: Number(data.open_count) || 0,
        uniq_open_count: Number(data.uniq_open_count) || 0,
        uniq_open_rate: Number(data.uniq_open_rate || data.open_rate) || 0,
        click_count: Number(data.click_count) || 0,
        click_rate: Number(data.click_rate) || 0,
        bounce_count: Number(data.bounce_count) || 0,
        soft_bounce_count: Number(data.soft_bounce_count) || 0,
        hard_bounce_count: Number(data.hard_bounce_count) || 0,
        unsubscribe_count: Number(data.unsubscribe_count) || 0,
        abuse_complaint_count: Number(data.abuse_complaint_count) || 0
      };
    }
    
    console.log("Aucune statistique trouvée dans la réponse Legacy API");
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques via legacy pour la campagne ${campaignUid}:`, error);
    return null;
  }
};
