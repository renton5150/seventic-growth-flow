
import { AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { ensureValidStatistics } from "./validation";
import { buildDirectAcelleApiUrl } from "../../acelle-service";
import { extractStatisticsFromAnyFormat } from "@/utils/acelle/campaignStats";

/**
 * Récupère les statistiques d'une campagne directement depuis l'API Acelle
 */
export const fetchCampaignStatisticsFromApi = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  try {
    console.log(`[fetchCampaignStatisticsFromApi] Début pour campagne ${campaignUid} sur compte ${account.name}`);
    
    // Vérifier les paramètres requis
    if (!campaignUid || !account || !account.api_token || !account.api_endpoint) {
      console.error("[fetchCampaignStatisticsFromApi] Paramètres manquants", {
        campaignUid,
        hasAccount: !!account,
        hasToken: account ? !!account.api_token : false,
        hasEndpoint: account ? !!account.api_endpoint : false
      });
      return null;
    }
    
    // Construire l'URL de l'API directe
    const apiUrl = buildDirectAcelleApiUrl(
      `campaigns/${campaignUid}/statistics`, 
      account.api_endpoint,
      { api_token: account.api_token }
    );
    
    console.log(`[fetchCampaignStatisticsFromApi] URL API directe: ${apiUrl.replace(account.api_token, '***')}`);
    
    // Appeler l'API directement avec headers simplifiés
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    console.log(`[fetchCampaignStatisticsFromApi] Headers utilisés:`, headers);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers
    });
    
    console.log(`[fetchCampaignStatisticsFromApi] Réponse: Status ${response.status}`);
    
    // Vérifier la réponse HTTP
    if (!response.ok) {
      console.error(`[fetchCampaignStatisticsFromApi] Erreur API HTTP ${response.status} (${campaignUid}): ${response.statusText}`);
      
      try {
        const errorText = await response.text();
        console.log(`[fetchCampaignStatisticsFromApi] Corps d'erreur:`, errorText);
      } catch (e) {
        console.log("[fetchCampaignStatisticsFromApi] Impossible de lire le corps d'erreur");
      }
      
      return null;
    }
    
    // Extraire les données
    const data = await response.json();
    
    if (!data) {
      console.error("[fetchCampaignStatisticsFromApi] Pas de données retournées par l'API directe");
      return null;
    }
    
    console.log(`[fetchCampaignStatisticsFromApi] Données brutes reçues pour la campagne ${campaignUid}:`, {
      dataType: typeof data,
      hasStatistics: !!data.statistics,
      hasCampaign: !!data.campaign
    });
    
    // Créer l'objet avec les statistiques
    const stats = extractStatisticsFromAnyFormat(data);
    console.log(`[fetchCampaignStatisticsFromApi] Statistiques extraites pour la campagne ${campaignUid}:`, {
      subscriber_count: stats.subscriber_count,
      delivered_count: stats.delivered_count,
      open_count: stats.open_count,
      click_count: stats.click_count
    });
    
    return ensureValidStatistics(stats);
  } catch (error) {
    console.error(`[fetchCampaignStatisticsFromApi] Erreur lors de la récupération des statistiques pour ${campaignUid}:`, error);
    return null;
  }
};

/**
 * Méthode legacy pour récupérer les statistiques d'une campagne depuis l'API Acelle
 * via la route tracking-log
 */
export const fetchCampaignStatisticsLegacy = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  try {
    console.log(`[fetchCampaignStatisticsLegacy] Début pour campagne ${campaignUid} sur compte ${account.name}`);
    
    // Vérifier les paramètres requis
    if (!campaignUid || !account || !account.api_token || !account.api_endpoint) {
      console.error("[fetchCampaignStatisticsLegacy] Paramètres manquants");
      return null;
    }
    
    // Construire l'URL de l'API legacy directe
    const apiUrl = buildDirectAcelleApiUrl(
      `campaigns/${campaignUid}/stats`,
      account.api_endpoint,
      { api_token: account.api_token }
    );
    
    console.log(`[fetchCampaignStatisticsLegacy] URL API legacy: ${apiUrl.replace(account.api_token, '***')}`);
    
    // Appeler l'API directement avec headers simplifiés
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers
    });
    
    console.log(`[fetchCampaignStatisticsLegacy] Réponse: Status ${response.status}`);
    
    // Vérifier la réponse HTTP
    if (!response.ok) {
      console.error(`[fetchCampaignStatisticsLegacy] Erreur API HTTP ${response.status} (legacy): ${response.statusText}`);
      return null;
    }
    
    // Extraire les données
    const data = await response.json();
    
    if (!data) {
      console.error("[fetchCampaignStatisticsLegacy] Pas de données retournées par l'API legacy directe");
      return null;
    }
    
    console.log(`[fetchCampaignStatisticsLegacy] Données brutes reçues pour la campagne ${campaignUid} (legacy):`, {
      dataType: typeof data,
      hasStats: !!data.stats,
      hasData: !!data.data
    });
    
    // Traiter les statistiques depuis la réponse
    const statsData = data.stats || data.data || data;
    if (statsData) {
      // Extraire les statistiques de n'importe quel format
      const stats = extractStatisticsFromAnyFormat(statsData);
      console.log(`[fetchCampaignStatisticsLegacy] Statistiques extraites pour la campagne ${campaignUid} (legacy):`, {
        subscriber_count: stats.subscriber_count,
        delivered_count: stats.delivered_count,
        open_count: stats.open_count,
        click_count: stats.click_count
      });
      return ensureValidStatistics(stats);
    }
    
    return null;
  } catch (error) {
    console.error(`[fetchCampaignStatisticsLegacy] Erreur lors de la récupération des statistiques legacy pour ${campaignUid}:`, error);
    return null;
  }
};
