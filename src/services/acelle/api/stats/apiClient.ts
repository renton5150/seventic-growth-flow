
import { AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { buildApiPath } from "@/utils/acelle/proxyUtils";

/**
 * Récupère les statistiques d'une campagne depuis l'API Acelle
 * Modifié pour utiliser la construction d'URL corrigée
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
    const apiPath = `campaigns/${campaignUid}/statistics`;
    
    console.log(`Chemin API à appeler: ${apiPath}`);
    
    // Obtenir le token d'authentification Supabase
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionToken = sessionData?.session?.access_token;
    
    if (!sessionToken) {
      console.error("Aucun token d'authentification Supabase disponible pour l'API");
      return null;
    }
    
    // Utiliser buildApiPath pour construire l'URL correctement
    const proxyUrl = buildApiPath(account.api_endpoint, apiPath);
    
    // Préparer les en-têtes pour l'authentification correcte
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`, // Token Supabase pour l'Edge Function
      'X-Acelle-Token': account.api_token, // Token Acelle pour l'API
      'X-Acelle-Endpoint': account.api_endpoint // Endpoint explicite
    };
    
    // Ajouter des logs détaillés pour diagnostiquer les problèmes d'authentification
    console.log("En-têtes de requête API (authentification masquée):", {
      ...headers,
      'Authorization': 'Bearer ***MASKED***',
      'X-Acelle-Token': '***MASKED***'
    });
    
    console.log(`URL du proxy: ${proxyUrl} (les paramètres d'authentification seront ajoutés par l'Edge Function)`);
    
    // Effectuer la requête via le proxy
    console.log(`Envoi de la requête au proxy...`);
    const response = await fetch(proxyUrl, { headers });
    
    // Logger le statut de la réponse pour diagnostiquer
    console.log(`Statut de réponse API: ${response.status} ${response.statusText}`);
    
    // Amélioration de la gestion des erreurs
    if (!response.ok) {
      // Journaliser plus de détails sur l'erreur
      const errorText = await response.text();
      console.error(`Erreur API ${response.status}: ${errorText.substring(0, 500)}...`);
      
      // Gestion spécifique pour le 404 Not Found
      if (response.status === 404) {
        console.error(`Ressource non trouvée (404): L'URL demandée n'existe pas. 
        Vérifiez le chemin d'API et la structure de l'URL: ${proxyUrl}`);
        throw new Error(`La ressource demandée n'existe pas (404 Not Found)`);
      }
      
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
