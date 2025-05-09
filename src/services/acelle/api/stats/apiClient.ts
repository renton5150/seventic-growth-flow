
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
    
    // URL de base corrigée pour éviter la duplication 'api/v1/api/v1'
    const endpoint = `${account.api_endpoint}/api/v1/campaigns/${campaignUid}`;
    const url = new URL(endpoint);
    url.searchParams.append('api_token', account.api_token);
    url.searchParams.append('_t', Date.now().toString()); // Éviter la mise en cache
    
    // Obtenir le token d'authentification pour le proxy CORS
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      console.error("Token d'authentification non disponible pour le proxy CORS");
      return null;
    }
    
    // Construire l'URL pour le proxy CORS
    const proxyUrl = encodeURIComponent(url.toString());
    const corsProxyUrl = `https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy?url=${proxyUrl}`;
    
    console.log(`Appel API à ${corsProxyUrl}`);
    console.time(`API_Call_${campaignUid}`);
    
    // Effectuer la requête avec les en-têtes appropriés
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
      
      // Si erreur 401, essayer une autre méthode d'authentification
      if (response.status === 401) {
        console.log("Tentative avec en-têtes alternatifs après erreur 401");
        return await fetchWithAlternativeHeaders(campaignUid, account, token);
      }
      // Si erreur 404, l'URL peut être incorrecte - essayons avec le format correct
      if (response.status === 404) {
        console.log("URL incorrecte possible - tentative avec chemin corrigé");
        return await fetchWithCorrectedPath(campaignUid, account, token);
      }
      return null;
    }
    
    const responseData = await response.json();
    console.log(`Données brutes reçues pour ${campaignUid}:`, responseData);
    
    // Extraction des statistiques
    return extractStatistics(responseData);
    
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour la campagne ${campaignUid}:`, error);
    return null;
  }
};

/**
 * Tente une requête avec des en-têtes d'authentification alternatifs
 */
const fetchWithAlternativeHeaders = async (
  campaignUid: string,
  account: AcelleAccount,
  token: string
): Promise<AcelleCampaignStatistics | null> => {
  try {
    const endpoint = `${account.api_endpoint}/api/v1/campaigns/${campaignUid}`;
    const url = new URL(endpoint);
    url.searchParams.append('api_token', account.api_token);
    url.searchParams.append('_t', Date.now().toString());
    
    const proxyUrl = encodeURIComponent(url.toString());
    const corsProxyUrl = `https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy?url=${proxyUrl}`;
    
    console.log(`Tentative alternative pour la campagne ${campaignUid}`);
    
    // Utiliser un ensemble différent d'en-têtes
    const response = await fetch(corsProxyUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'api-token': account.api_token
      }
    });
    
    if (!response.ok) {
      console.error(`Échec de la tentative alternative: ${response.status}`);
      return null;
    }
    
    const responseData = await response.json();
    console.log(`Données alternatives reçues pour ${campaignUid}:`, responseData);
    
    return extractStatistics(responseData);
    
  } catch (error) {
    console.error(`Erreur lors de la tentative alternative pour ${campaignUid}:`, error);
    return null;
  }
};

/**
 * Tente une requête avec un chemin corrigé
 * - Parfois l'API nécessite "campaigns/uid" et parfois "campaign/uid"
 */
const fetchWithCorrectedPath = async (
  campaignUid: string,
  account: AcelleAccount, 
  token: string
): Promise<AcelleCampaignStatistics | null> => {
  try {
    // Essayer avec "campaign" (singulier) au lieu de "campaigns" (pluriel)
    const endpoint = `${account.api_endpoint}/api/v1/campaign/${campaignUid}`;
    const url = new URL(endpoint);
    url.searchParams.append('api_token', account.api_token);
    url.searchParams.append('_t', Date.now().toString());
    
    const proxyUrl = encodeURIComponent(url.toString());
    const corsProxyUrl = `https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy?url=${proxyUrl}`;
    
    console.log(`Tentative avec chemin corrigé pour la campagne ${campaignUid}`);
    
    const response = await fetch(corsProxyUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'x-acelle-token': account.api_token,
        'x-acelle-endpoint': account.api_endpoint
      }
    });
    
    if (!response.ok) {
      console.error(`Échec de la tentative avec chemin corrigé: ${response.status}`);
      return null;
    }
    
    const responseData = await response.json();
    console.log(`Données avec chemin corrigé reçues pour ${campaignUid}:`, responseData);
    
    return extractStatistics(responseData);
    
  } catch (error) {
    console.error(`Erreur lors de la tentative avec chemin corrigé pour ${campaignUid}:`, error);
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
    
    console.log(`Tentative de récupération via méthode legacy pour la campagne ${campaignUid}`);
    
    // Construire l'URL directe pour l'API legacy - Assurez-vous que c'est le bon chemin
    const endpoint = `${account.api_endpoint}/api/v1/campaigns/${campaignUid}/track`;
    // Enlever les duplications possibles de api/v1
    const cleanEndpoint = endpoint.replace('/api/v1/api/v1/', '/api/v1/');
    const url = new URL(cleanEndpoint);
    url.searchParams.append('api_token', account.api_token);
    url.searchParams.append('_t', Date.now().toString());
    
    // Obtenir le token d'authentification
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      console.error("Token d'authentification non disponible pour l'API legacy");
      return null;
    }
    
    // Construire l'URL pour le proxy CORS
    const proxyUrl = encodeURIComponent(url.toString());
    const corsProxyUrl = `https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy?url=${proxyUrl}`;
    
    console.log(`Appel API Legacy à ${corsProxyUrl}`);
    
    // Effectuer la requête
    const response = await fetch(corsProxyUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-acelle-token': account.api_token,
        'x-acelle-endpoint': account.api_endpoint,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error(`Erreur API Legacy: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Détails de l'erreur Legacy: ${errorText}`);
      
      // Si erreur 401, essayer une autre méthode d'authentification
      if (response.status === 401) {
        return await fetchLegacyWithAlternativeHeaders(campaignUid, account, token);
      }
      
      // Si erreur 404, essayer l'endpoint report au lieu de track
      if (response.status === 404) {
        return await fetchLegacyWithReportEndpoint(campaignUid, account, token);
      }
      
      return null;
    }
    
    const responseData = await response.json();
    console.log(`Données legacy reçues pour ${campaignUid}:`, responseData);
    
    return extractStatistics(responseData);
    
  } catch (error) {
    console.error(`Erreur lors de la récupération via méthode legacy pour ${campaignUid}:`, error);
    return null;
  }
};

/**
 * Tente une requête legacy avec des en-têtes d'authentification alternatifs
 */
const fetchLegacyWithAlternativeHeaders = async (
  campaignUid: string,
  account: AcelleAccount,
  token: string
): Promise<AcelleCampaignStatistics | null> => {
  try {
    // Essayer avec un endpoint alternatif pour les statistiques
    const endpoint = `${account.api_endpoint}/api/v1/campaigns/${campaignUid}/report`;
    const cleanEndpoint = endpoint.replace('/api/v1/api/v1/', '/api/v1/');
    const url = new URL(cleanEndpoint);
    url.searchParams.append('api_token', account.api_token);
    url.searchParams.append('_t', Date.now().toString());
    
    const proxyUrl = encodeURIComponent(url.toString());
    const corsProxyUrl = `https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy?url=${proxyUrl}`;
    
    console.log(`Tentative legacy alternative pour la campagne ${campaignUid}`);
    
    const response = await fetch(corsProxyUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`Échec de la tentative legacy alternative: ${response.status}`);
      return null;
    }
    
    const responseData = await response.json();
    console.log(`Données legacy alternatives reçues pour ${campaignUid}:`, responseData);
    
    return extractStatistics(responseData);
    
  } catch (error) {
    console.error(`Erreur lors de la tentative legacy alternative pour ${campaignUid}:`, error);
    return null;
  }
};

/**
 * Tente une requête avec l'endpoint report au lieu de track
 */
const fetchLegacyWithReportEndpoint = async (
  campaignUid: string,
  account: AcelleAccount,
  token: string
): Promise<AcelleCampaignStatistics | null> => {
  try {
    const endpoint = `${account.api_endpoint}/api/v1/campaigns/${campaignUid}/report`;
    const cleanEndpoint = endpoint.replace('/api/v1/api/v1/', '/api/v1/');
    const url = new URL(cleanEndpoint);
    url.searchParams.append('api_token', account.api_token);
    url.searchParams.append('_t', Date.now().toString());
    
    const proxyUrl = encodeURIComponent(url.toString());
    const corsProxyUrl = `https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy?url=${proxyUrl}`;
    
    console.log(`Tentative avec endpoint report pour la campagne ${campaignUid}`);
    
    const response = await fetch(corsProxyUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'x-acelle-token': account.api_token,
        'x-acelle-endpoint': account.api_endpoint
      }
    });
    
    if (!response.ok) {
      console.error(`Échec de la tentative avec endpoint report: ${response.status}`);
      return null;
    }
    
    const responseData = await response.json();
    console.log(`Données report reçues pour ${campaignUid}:`, responseData);
    
    return extractStatistics(responseData);
    
  } catch (error) {
    console.error(`Erreur lors de la tentative avec endpoint report pour ${campaignUid}:`, error);
    return null;
  }
};

/**
 * Extrait les statistiques de la réponse de l'API, quelle que soit sa structure
 */
const extractStatistics = (responseData: any): AcelleCampaignStatistics | null => {
  // Débogage pour comprendre la structure de la réponse
  console.log("STRUCTURE DE LA RÉPONSE:", Object.keys(responseData));
  
  // Extraction des données selon diverses structures possibles
  // Vérifier d'abord si les données sont encapsulées dans data
  const data = responseData.data || responseData;
  
  if (!data) {
    console.error("Aucune donnée dans la réponse");
    return null;
  }
  
  // Récupérer les données de delivery_info depuis la base
  if (data.delivery_info) {
    console.log("Données extraites directement du delivery_info:", data.delivery_info);
    return mapDeliveryInfoToStats(data.delivery_info);
  }
  
  // Récupérer les données depuis la structure campaign
  if (data.campaign && data.campaign.delivery_info) {
    console.log("Données extraites de campaign.delivery_info:", data.campaign.delivery_info);
    return mapDeliveryInfoToStats(data.campaign.delivery_info);
  }
  
  // Récupérer les données depuis statistics
  if (data.statistics) {
    console.log("Données extraites de statistics:", data.statistics);
    return mapToStandardFormat(data.statistics);
  }
  
  // Récupérer les données depuis campaign.statistics
  if (data.campaign && data.campaign.statistics) {
    console.log("Données extraites de campaign.statistics:", data.campaign.statistics);
    return mapToStandardFormat(data.campaign.statistics);
  }
  
  // Structure possible : data -> track -> data
  if (data.track && data.track.data) {
    console.log("Données extraites de track.data:", data.track.data);
    return mapToStandardFormat(data.track.data);
  }
  
  // Données dans meta?.report
  if (data.meta && data.meta.report) {
    console.log("Données extraites de meta.report:", data.meta.report);
    return mapToStandardFormat(data.meta.report);
  }
  
  // Structure possible : campaign contient directement les stats
  if (data.campaign && (
    typeof data.campaign.subscriber_count !== 'undefined' ||
    typeof data.campaign.total !== 'undefined'
  )) {
    console.log("Données extraites directement de campaign:", data.campaign);
    return mapToStandardFormat(data.campaign);
  }
  
  // Dernier recours : data contient directement les stats
  if (typeof data.subscriber_count !== 'undefined' || 
      typeof data.total !== 'undefined' || 
      typeof data.delivered_count !== 'undefined') {
    console.log("Données extraites directement de data:", data);
    return mapToStandardFormat(data);
  }

  console.warn("Aucune statistique trouvée dans la réponse après analyse complète");
  return null;
};

/**
 * Transforme un objet de statistiques en format standard AcelleCampaignStatistics
 */
const mapToStandardFormat = (stats: any): AcelleCampaignStatistics => {
  return {
    subscriber_count: parseNumber(stats.subscriber_count) || parseNumber(stats.total) || 0,
    delivered_count: parseNumber(stats.delivered_count) || parseNumber(stats.delivered) || parseNumber(stats.sent) || 0,
    delivered_rate: parseNumber(stats.delivered_rate) || parseNumber(stats.delivery_rate) || 0,
    open_count: parseNumber(stats.open_count) || parseNumber(stats.opened) || 0,
    uniq_open_count: parseNumber(stats.uniq_open_count) || parseNumber(stats.unique_opened) || parseNumber(stats.unique_open_count) || 0,
    uniq_open_rate: parseNumber(stats.uniq_open_rate) || parseNumber(stats.unique_open_rate) || parseNumber(stats.open_rate) || 0,
    click_count: parseNumber(stats.click_count) || parseNumber(stats.clicked) || 0,
    click_rate: parseNumber(stats.click_rate) || 0,
    bounce_count: getBounceCount(stats),
    soft_bounce_count: getSoftBounceCount(stats),
    hard_bounce_count: getHardBounceCount(stats),
    unsubscribe_count: parseNumber(stats.unsubscribe_count) || parseNumber(stats.unsubscribed) || 0,
    abuse_complaint_count: parseNumber(stats.abuse_complaint_count) || parseNumber(stats.complained) || 0
  };
};

/**
 * Transforme un objet delivery_info en format AcelleCampaignStatistics
 */
const mapDeliveryInfoToStats = (delivery: any): AcelleCampaignStatistics => {
  return {
    subscriber_count: parseNumber(delivery.total) || parseNumber(delivery.subscriber_count) || 0,
    delivered_count: parseNumber(delivery.delivered) || parseNumber(delivery.delivered_count) || 0,
    delivered_rate: parseNumber(delivery.delivery_rate) || parseNumber(delivery.delivered_rate) || 0,
    open_count: parseNumber(delivery.opened) || parseNumber(delivery.open_count) || 0,
    uniq_open_count: parseNumber(delivery.unique_opened) || parseNumber(delivery.uniq_open_count) || parseNumber(delivery.opened) || 0,
    uniq_open_rate: parseNumber(delivery.unique_open_rate) || parseNumber(delivery.uniq_open_rate) || parseNumber(delivery.open_rate) || 0,
    click_count: parseNumber(delivery.clicked) || parseNumber(delivery.click_count) || 0,
    click_rate: parseNumber(delivery.click_rate) || 0,
    bounce_count: getBounceCount(delivery),
    soft_bounce_count: getSoftBounceCount(delivery),
    hard_bounce_count: getHardBounceCount(delivery),
    unsubscribe_count: parseNumber(delivery.unsubscribed) || parseNumber(delivery.unsubscribe_count) || 0,
    abuse_complaint_count: parseNumber(delivery.complained) || parseNumber(delivery.abuse_complaint_count) || 0
  };
};

/**
 * Fonctions utilitaires pour extraire les valeurs de bounces avec différentes structures possibles
 */
const getBounceCount = (data: any): number => {
  if (typeof data.bounced === 'object' && data.bounced?.total !== undefined) {
    return parseNumber(data.bounced.total);
  }
  return parseNumber(data.bounced) || parseNumber(data.bounce_count) || 0;
};

const getSoftBounceCount = (data: any): number => {
  if (typeof data.bounced === 'object' && data.bounced?.soft !== undefined) {
    return parseNumber(data.bounced.soft);
  }
  return parseNumber(data.soft_bounce_count) || 0;
};

const getHardBounceCount = (data: any): number => {
  if (typeof data.bounced === 'object' && data.bounced?.hard !== undefined) {
    return parseNumber(data.bounced.hard);
  }
  return parseNumber(data.hard_bounce_count) || 0;
};

/**
 * Convertit une valeur en nombre de manière sécurisée
 */
const parseNumber = (value: any): number => {
  if (value === undefined || value === null) {
    return 0;
  }
  
  // Si c'est une chaîne contenant un pourcentage
  if (typeof value === 'string') {
    let numValue;
    if (value.includes('%')) {
      numValue = parseFloat(value.replace('%', ''));
    } else {
      numValue = parseFloat(value);
    }
    return !isNaN(numValue) ? numValue : 0;
  }
  
  // Pour les autres types de valeurs
  if (typeof value === 'number') {
    return !isNaN(value) ? value : 0;
  }
  
  // Conversion forcée
  const numValue = Number(value);
  return !isNaN(numValue) ? numValue : 0;
};
