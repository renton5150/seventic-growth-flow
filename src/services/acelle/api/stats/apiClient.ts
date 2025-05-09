
import { AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { buildApiPath } from "@/utils/acelle/proxyUtils";

/**
 * Récupère les statistiques d'une campagne depuis l'API Acelle
 * Modifié pour utiliser la méthode d'authentification validée par cURL
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
    
    // Construire l'URL pour la requête API en utilisant buildApiPath
    // IMPORTANT: Vérifier si l'endpoint contient déjà /api/v1
    const hasApiV1InEndpoint = account.api_endpoint.includes('/api/v1');
    
    // Si l'endpoint contient déjà /api/v1, ne l'ajoutons pas au chemin
    let apiPath;
    if (hasApiV1InEndpoint) {
      // Utiliser simplement le chemin de la campagne sans ajouter /api/v1/
      apiPath = `campaigns/${campaignUid}/statistics`;
      console.log(`L'endpoint contient déjà /api/v1, chemin direct utilisé: ${apiPath}`);
    } else {
      // Endpoint standard, ajouter le préfixe normalement
      apiPath = `campaigns/${campaignUid}/statistics`;
      console.log(`Utilisation du chemin standard: ${apiPath}`);
    }
    
    console.log(`Chemin API à appeler: ${apiPath}, endpoint: ${account.api_endpoint}`);
    
    // Obtenir le token d'authentification Supabase
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionToken = sessionData?.session?.access_token;
    
    if (!sessionToken) {
      console.error("Aucun token d'authentification Supabase disponible pour l'API");
      return null;
    }
    
    // MODIFICATION MAJEURE: Utiliser l'authentification par paramètre URL, validée par cURL
    // Ajouter explicitement le token API dans les paramètres
    const proxyUrl = buildApiPath(account.api_endpoint, apiPath, {
      api_token: account.api_token // Méthode d'authentification principale
    });
    console.log(`URL complète construite pour la requête: ${proxyUrl.replace(account.api_token, "***MASQUÉ***")}`);
    
    // Préparer les en-têtes pour l'authentification
    // Simplifié pour n'utiliser que la méthode bearer comme secours
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`, // Token Supabase pour l'Edge Function
      'X-Acelle-Token': account.api_token, // Token Acelle pour les fonctions edge
      'X-Acelle-Endpoint': account.api_endpoint, // Endpoint explicite
      'X-Auth-Priority': 'both' // Utiliser la méthode combinée (URL + Bearer)
    };
    
    // Ajouter des logs détaillés pour diagnostiquer les problèmes d'authentification
    console.log("En-têtes de requête API (authentification masquée):", {
      ...headers,
      'Authorization': 'Bearer ***MASQUÉ***',
      'X-Acelle-Token': '***MASQUÉ***'
    });
    
    console.log(`URL du proxy: ${proxyUrl.replace(account.api_token, "***MASQUÉ***")}`);
    
    // Effectuer la requête via le proxy
    console.log(`Envoi de la requête au proxy...`);
    const response = await fetch(proxyUrl, { headers });
    
    // Logger le statut de la réponse pour diagnostiquer
    console.log(`Statut de réponse API: ${response.status} ${response.statusText}`);
    
    // Amélioration de la gestion des erreurs
    if (!response.ok) {
      // Journaliser plus de détails sur l'erreur
      let errorText = '';
      try {
        errorText = await response.text();
        console.error(`Erreur API ${response.status}: ${errorText.substring(0, 500)}...`);
      } catch (e) {
        console.error(`Impossible de lire le corps de la réponse d'erreur: ${e}`);
      }
      
      // Gestion spécifique pour le 403 Forbidden
      if (response.status === 403) {
        console.error(`Erreur d'authentification (403 Forbidden) lors de l'accès à l'API Acelle. 
        Détails de réponse: ${errorText}
        Méthode d'authentification utilisée: Paramètre URL api_token (méthode validée par cURL)`);
        
        throw new Error(`Erreur d'authentification à l'API Acelle (403 Forbidden). Vérifiez la validité du token API.`);
      }
      
      // Gestion spécifique pour le 404 Not Found
      if (response.status === 404) {
        console.error(`Ressource non trouvée (404): L'URL demandée n'existe pas.
        Vérifiez le chemin d'API et la structure de l'URL: ${proxyUrl.replace(account.api_token, "***MASQUÉ***")}
        Votre endpoint API est: ${account.api_endpoint}
        Chemin demandé: ${apiPath}
        L'endpoint contient-il déjà /api/v1? ${hasApiV1InEndpoint ? 'OUI' : 'NON'}`);
        
        throw new Error(`La ressource demandée n'existe pas (404 Not Found). Vérifiez la structure de l'URL.`);
      }
      
      return null;
    }
    
    const data = await response.json();
    console.log(`Données reçues de l'API:`, data);
    
    // AMÉLIORATION: Gestion unifiée des formats de réponse
    // Certaines installations d'Acelle renvoient les statistiques directement
    // D'autres les encapsulent dans un objet "statistics"
    let statisticsData = data;
    
    if (data?.statistics) {
      // Format où les statistiques sont encapsulées dans un objet "statistics"
      statisticsData = data.statistics;
      console.log("Format avec statistiques encapsulées détecté");
    }
    
    // S'assurer que nous avons bien des statistiques
    if (statisticsData) {
      // Convertir les statistiques en format attendu
      return {
        subscriber_count: Number(statisticsData.subscriber_count) || 0,
        delivered_count: Number(statisticsData.delivered_count) || 0,
        delivered_rate: Number(statisticsData.delivered_rate) || 0,
        open_count: Number(statisticsData.open_count) || 0,
        uniq_open_count: Number(statisticsData.uniq_open_count) || 0,
        uniq_open_rate: Number(statisticsData.uniq_open_rate) || 0,
        click_count: Number(statisticsData.click_count) || 0,
        click_rate: Number(statisticsData.click_rate) || 0,
        bounce_count: Number(statisticsData.bounce_count) || 0,
        soft_bounce_count: Number(statisticsData.soft_bounce_count) || 0,
        hard_bounce_count: Number(statisticsData.hard_bounce_count) || 0,
        unsubscribe_count: Number(statisticsData.unsubscribe_count) || 0,
        abuse_complaint_count: Number(statisticsData.abuse_complaint_count) || 0
      };
    }
    
    console.log("Aucune statistique trouvée dans la réponse de l'API");
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour la campagne ${campaignUid}:`, error);
    return null;
  }
};
