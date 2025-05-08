
import { AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Récupère les statistiques d'une campagne depuis l'API Acelle
 * Modifié pour utiliser l'authentification par paramètre URL (api_token)
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
    
    // Construire l'URL pour la requête API - utiliser directement l'endpoint complet
    const apiEndpoint = account.api_endpoint.replace(/\/$/, '');
    const apiPath = `/campaigns/${campaignUid}/statistics`;
    
    console.log(`Chemin API à appeler: ${apiPath}`);
    
    // Obtenir le token d'authentification Supabase
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionToken = sessionData?.session?.access_token;
    
    if (!sessionToken) {
      console.error("Aucun token d'authentification Supabase disponible pour l'API");
      return null;
    }
    
    // Préparer les en-têtes pour l'authentification correcte
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`, // Token Supabase pour l'Edge Function
      'X-Acelle-Token': account.api_token, // Token Acelle pour l'API
      'X-Acelle-Endpoint': apiEndpoint // Endpoint explicite
    };
    
    // Ajouter des logs détaillés pour diagnostiquer les problèmes d'authentification
    console.log("En-têtes de requête API (authentification masquée):", {
      ...headers,
      'Authorization': 'Bearer ***MASKED***',
      'X-Acelle-Token': '***MASKED***'
    });
    
    // Construire l'URL pour le proxy CORS de Supabase
    // IMPORTANT: On n'inclut pas directement le token dans l'URL ici car le proxy Edge Function le fera
    const proxyUrl = `https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/campaigns/${campaignUid}/statistics`;
    
    console.log(`URL du proxy: ${proxyUrl} (les paramètres d'authentification seront ajoutés par l'Edge Function)`);
    
    // Effectuer la requête via le proxy
    console.log(`Envoi de la requête au proxy...`);
    const response = await fetch(proxyUrl, { headers });
    
    // Logger le statut de la réponse pour diagnostiquer
    console.log(`Statut de réponse API: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      // Journaliser plus de détails sur l'erreur
      const errorText = await response.text();
      console.error(`Erreur API ${response.status}: ${errorText.substring(0, 500)}...`);
      
      // Gestion spécifique pour le 403 Forbidden
      if (response.status === 403) {
        console.error(`Erreur d'authentification (403 Forbidden) lors de l'accès à l'API Acelle. 
        Vérifiez si le token API doit être passé dans l'URL ou dans les en-têtes.`);
        throw new Error(`Erreur d'authentification à l'API Acelle (403 Forbidden)`);
      }
      
      return null;
    }
    
    const data = await response.json();
    console.log(`Données reçues de l'API:`, data);
    
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
