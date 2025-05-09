
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
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
    
    // Utiliser l'URL directe qui fonctionne, comme spécifié dans les retours
    const endpoint = `${account.api_endpoint}/api/v1/campaigns/${campaignUid}`;
    const url = new URL(endpoint);
    
    // Ajouter le token API comme paramètre d'URL (méthode préférée d'Acelle)
    url.searchParams.append('api_token', account.api_token);
    
    // Ajouter un paramètre pour éviter la mise en cache
    url.searchParams.append('_t', Date.now().toString());
    
    // Obtenir le token d'authentification pour le proxy CORS
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    // Utiliser le proxy CORS pour éviter les problèmes CORS
    const proxyUrl = encodeURIComponent(url.toString());
    const corsProxyUrl = `https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy?url=${proxyUrl}`;
    
    // Effectuer la requête avec les en-têtes appropriés
    console.log(`Appel API à ${corsProxyUrl}`);
    console.time(`API_Call_${campaignUid}`);
    
    const response = await fetch(corsProxyUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-acelle-token': account.api_token,
        'x-acelle-endpoint': account.api_endpoint,
        'Authorization': `Bearer ${token}`
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
    
    // Extraction des données selon la structure de réponse
    const data = responseData.data || responseData;
    
    // Structure probable: data.campaign.statistics ou directement data.campaign
    let campaignData = data;
    if (data.campaign) {
      campaignData = data.campaign;
    }
    
    // Extraction des statistiques selon diverses structures possibles
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
    } 
    
    console.warn("Aucune statistique trouvée dans la réponse de l'API pour la campagne", campaignUid);
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour la campagne ${campaignUid}:`, error);
    return null;
  }
};

/**
 * Méthode de secours pour la compatibilité - utilise les endpoints directs mentionnés
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
    
    console.log(`Tentative de récupération via méthode alternative pour la campagne ${campaignUid}`);
    
    // Utiliser l'URL directe comme mentionné dans votre exemple
    const endpoint = `${account.api_endpoint}/api/v1/campaigns/${campaignUid}`;
    const url = new URL(endpoint);
    url.searchParams.append('api_token', account.api_token);
    url.searchParams.append('_t', Date.now().toString()); // Éviter la mise en cache
    
    const directUrl = url.toString();
    
    // Utiliser le proxy CORS pour éviter les problèmes CORS
    const proxyUrl = encodeURIComponent(directUrl);
    const corsProxyUrl = `https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy?url=${proxyUrl}`;
    
    console.log(`Appel API Legacy à ${corsProxyUrl}`);
    
    // Effectuer la requête
    const response = await fetch(corsProxyUrl, {
      headers: {
        'Accept': 'application/json',
        'x-acelle-token': account.api_token,
      }
    });
    
    if (!response.ok) {
      console.error(`Erreur API Legacy: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Détails de l'erreur Legacy: ${errorText}`);
      return null;
    }
    
    const responseData = await response.json();
    console.log(`Données legacy reçues pour ${campaignUid}:`, responseData);
    
    // Extraction des données réelles (peuvent être encapsulées dans data)
    const data = responseData.data ? responseData.data : responseData;
    
    // Traitement similaire à la méthode principale
    if (data && (data.campaign || data.statistics || data.delivery_info)) {
      // Structure possible : data.campaign.statistics
      if (data.campaign?.statistics) {
        const stats = data.campaign.statistics;
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
      }
      
      // Ou directement data.statistics
      if (data.statistics) {
        const stats = data.statistics;
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
      }
      
      // Ou data.delivery_info
      if (data.delivery_info) {
        const delivery = data.delivery_info;
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
    }
    
    // Essayer de récupérer directement des données de base de la campagne
    if (data && (data.subscriber_count || data.open_rate)) {
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
    
    console.warn("Aucune statistique trouvée dans la réponse Legacy API pour", campaignUid);
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération via méthode alternative pour ${campaignUid}:`, error);
    return null;
  }
};
