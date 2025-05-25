
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
    console.log(`Appel API statistics direct pour la campagne ${campaignUid}`);
    
    // Vérifier les paramètres requis
    if (!campaignUid || !account || !account.api_token || !account.api_endpoint) {
      console.error("Paramètres manquants pour fetchCampaignStatisticsFromApi", {
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
    
    console.log(`URL API directe (sans token): ${apiUrl.replace(account.api_token, '***')}`);
    
    // Appeler l'API directement avec headers simplifiés
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        // Headers simplifiés selon config serveur Icodia
      }
    });
    
    // Vérifier la réponse HTTP
    if (!response.ok) {
      console.error(`Erreur API HTTP ${response.status} (${campaignUid}): ${response.statusText}`);
      return null;
    }
    
    // Extraire les données
    const data = await response.json();
    
    if (!data) {
      console.error("Pas de données retournées par l'API directe");
      return null;
    }
    
    console.log(`Données brutes reçues pour la campagne ${campaignUid}:`, data);
    
    // Créer l'objet avec les statistiques
    const stats = extractStatisticsFromAnyFormat(data);
    console.log(`Statistiques extraites pour la campagne ${campaignUid}:`, stats);
    
    return ensureValidStatistics(stats);
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour ${campaignUid}:`, error);
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
    console.log(`Appel API legacy direct pour la campagne ${campaignUid}`);
    
    // Vérifier les paramètres requis
    if (!campaignUid || !account || !account.api_token || !account.api_endpoint) {
      console.error("Paramètres manquants pour fetchCampaignStatisticsLegacy");
      return null;
    }
    
    // Construire l'URL de l'API legacy directe
    const apiUrl = buildDirectAcelleApiUrl(
      `campaigns/${campaignUid}/stats`,
      account.api_endpoint,
      { api_token: account.api_token }
    );
    
    // Appeler l'API directement avec headers simplifiés
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    // Vérifier la réponse HTTP
    if (!response.ok) {
      console.error(`Erreur API HTTP ${response.status} (legacy): ${response.statusText}`);
      return null;
    }
    
    // Extraire les données
    const data = await response.json();
    
    if (!data) {
      console.error("Pas de données retournées par l'API legacy directe");
      return null;
    }
    
    console.log(`Données brutes reçues pour la campagne ${campaignUid} (legacy):`, data);
    
    // Traiter les statistiques depuis la réponse
    const statsData = data.stats || data.data || data;
    if (statsData) {
      // Extraire les statistiques de n'importe quel format
      const stats = extractStatisticsFromAnyFormat(statsData);
      console.log(`Statistiques extraites pour la campagne ${campaignUid} (legacy):`, stats);
      return ensureValidStatistics(stats);
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques legacy pour ${campaignUid}:`, error);
    return null;
  }
};
